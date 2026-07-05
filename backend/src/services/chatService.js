'use strict';

// Core chat logic, shared by the REST controller and the Socket.io handlers so
// behaviour is identical whether a message arrives over HTTP or a live socket.

const { query, withTransaction } = require('../config/db');
const { publicUser } = require('../utils/serialize');

// Conversations store the user pair in a canonical order (smaller UUID first)
// so a pair always maps to a single row regardless of who started it.
function orderPair(a, b) {
  return a < b ? [a, b] : [b, a];
}

/**
 * Find or create the 1:1 conversation between two users, optionally scoped to a
 * property. Returns the conversation row.
 */
async function getOrCreateConversation(userId, otherUserId, propertyId = null) {
  if (userId === otherUserId) throw new Error('Cannot start a conversation with yourself');
  const [a, b] = orderPair(userId, otherUserId);

  // Confirm the other user exists. (Any roles may chat: seeker↔owner for
  // listings, seeker↔seeker for roommate matching, owner↔owner for questions,
  // and anyone↔admin for support.)
  const other = await query('SELECT id FROM users WHERE id = $1', [otherUserId]);
  if (!other.rows[0]) throw new Error('Recipient does not exist');

  const sentinel = '00000000-0000-0000-0000-000000000000';
  const existing = await query(
    `SELECT * FROM conversations
     WHERE user_a_id = $1 AND user_b_id = $2
       AND COALESCE(property_id, $3::uuid) = COALESCE($4::uuid, $3::uuid)`,
    [a, b, sentinel, propertyId]
  );
  if (existing.rows[0]) return existing.rows[0];

  const created = await query(
    `INSERT INTO conversations (user_a_id, user_b_id, property_id)
     VALUES ($1, $2, $3)
     ON CONFLICT DO NOTHING
     RETURNING *`,
    [a, b, propertyId]
  );
  if (created.rows[0]) return created.rows[0];

  // Lost a race — fetch the row the other insert created.
  const again = await query(
    `SELECT * FROM conversations
     WHERE user_a_id = $1 AND user_b_id = $2
       AND COALESCE(property_id, $3::uuid) = COALESCE($4::uuid, $3::uuid)`,
    [a, b, sentinel, propertyId]
  );
  return again.rows[0];
}

function otherParticipant(conversation, userId) {
  return conversation.user_a_id === userId ? conversation.user_b_id : conversation.user_a_id;
}

/**
 * Make sure a (non-admin) user has a "Parppidam Support" conversation with an
 * admin, seeded with a friendly welcome message so it's there the moment they
 * open chat. Idempotent and cheap: the fast path is a single existence query, so
 * it's safe to call on every conversation-list request. Returns the conversation
 * if it created one, else null.
 */
async function ensureSupportConversation(userId) {
  // Fast path: already chatting with an admin → nothing to do.
  const has = await query(
    `SELECT 1 FROM conversations c
       JOIN users u ON u.id = CASE WHEN c.user_a_id = $1 THEN c.user_b_id ELSE c.user_a_id END
     WHERE (c.user_a_id = $1 OR c.user_b_id = $1) AND u.role = 'admin'
     LIMIT 1`,
    [userId]
  );
  if (has.rows[0]) return null;

  // Pick the earliest admin as the support contact.
  const admin = await query(
    "SELECT id FROM users WHERE role = 'admin' AND id <> $1 ORDER BY created_at ASC LIMIT 1",
    [userId]
  );
  if (!admin.rows[0]) return null; // no admin exists yet
  const adminId = admin.rows[0].id;

  const conv = await getOrCreateConversation(userId, adminId, null);
  // Seed a welcome from support so the chat isn't empty (also gives the user an
  // unread nudge that support is reachable).
  await sendMessage({
    senderId: adminId,
    conversationId: conv.id,
    content:
      "Welcome to Parppidam! This is your support chat. Message us anytime for help finding a stay, listing a property, or anything else.",
  });
  return conv;
}

async function assertParticipant(conversationId, userId) {
  const { rows } = await query('SELECT * FROM conversations WHERE id = $1', [conversationId]);
  const conv = rows[0];
  if (!conv) throw new Error('Conversation not found');
  if (conv.user_a_id !== userId && conv.user_b_id !== userId) {
    throw new Error('You are not part of this conversation');
  }
  return conv;
}

/**
 * Persist a message in a conversation. Creates a notification for the receiver.
 * Returns { message, conversation, receiverId }.
 */
async function sendMessage({ senderId, conversationId, content, propertyId = null }) {
  const text = String(content || '').trim();
  if (!text) throw new Error('Message content is required');
  if (text.length > 4000) throw new Error('Message is too long');

  const conv = await assertParticipant(conversationId, senderId);
  const receiverId = otherParticipant(conv, senderId);

  // Can't message an account that's gone or blocked (the thread stays readable,
  // but no new messages). The UI disables the composer; this is the hard guard.
  const recv = await query('SELECT is_blocked, deleted_at FROM users WHERE id = $1', [receiverId]);
  if (recv.rows[0]?.deleted_at) throw new Error('This account has been deleted');
  if (recv.rows[0]?.is_blocked) throw new Error('This account has been blocked');

  return withTransaction(async (client) => {
    const ins = await client.query(
      `INSERT INTO messages (conversation_id, sender_id, receiver_id, property_id, content)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [conversationId, senderId, receiverId, propertyId || conv.property_id, text]
    );
    await client.query('UPDATE conversations SET updated_at = now() WHERE id = $1', [
      conversationId,
    ]);

    const sender = await client.query('SELECT name FROM users WHERE id = $1', [senderId]);
    const senderName = sender.rows[0]?.name || 'someone';

    // If this chat is about a property, name it in the notification so the owner
    // knows which listing the enquiry is about (not just "new message").
    const propId = propertyId || conv.property_id;
    let propTitle = null;
    if (propId) {
      const pr = await client.query('SELECT title FROM properties WHERE id = $1', [propId]);
      propTitle = pr.rows[0]?.title || null;
    }

    await client.query(
      `INSERT INTO notifications (user_id, title, message, type, data)
       VALUES ($1, $2, $3, 'message', $4)`,
      [
        receiverId,
        propTitle ? `${senderName} · about "${propTitle}"` : `New message from ${senderName}`,
        text.slice(0, 120),
        JSON.stringify({ conversation_id: conversationId, property_id: propId || null }),
      ]
    );

    return { message: ins.rows[0], conversation: conv, receiverId };
  });
}

/** List the current user's conversations with last message + unread count. */
async function listConversations(userId) {
  const { rows } = await query(
    `SELECT c.*,
       (SELECT row_to_json(m) FROM (
          SELECT content, sender_id, created_at, is_read
          FROM messages WHERE conversation_id = c.id
          ORDER BY created_at DESC LIMIT 1
        ) m) AS last_message,
       (SELECT COUNT(*)::int FROM messages
          WHERE conversation_id = c.id AND receiver_id = $1 AND is_read = FALSE) AS unread_count
     FROM conversations c
     WHERE c.user_a_id = $1 OR c.user_b_id = $1
     ORDER BY c.updated_at DESC`,
    [userId]
  );

  // Attach the "other" participant's public profile + property summary.
  return Promise.all(
    rows.map(async (c) => {
      const otherId = otherParticipant(c, userId);
      const [u, p] = await Promise.all([
        query('SELECT * FROM users WHERE id = $1', [otherId]),
        c.property_id
          ? query('SELECT id, title, rent_amount FROM properties WHERE id = $1', [c.property_id])
          : Promise.resolve({ rows: [] }),
      ]);
      return {
        id: c.id,
        property_id: c.property_id,
        property: p.rows[0]
          ? { ...p.rows[0], rent_amount: Number(p.rows[0].rent_amount) }
          : null,
        other_user: publicUser(u.rows[0]),
        last_message: c.last_message,
        unread_count: c.unread_count,
        updated_at: c.updated_at,
      };
    })
  );
}

/** Fetch messages for a conversation (paginated, newest last). */
async function listMessages(userId, conversationId, { before, limit = 50 } = {}) {
  await assertParticipant(conversationId, userId);
  const lim = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
  const params = [conversationId];
  let sql = 'SELECT * FROM messages WHERE conversation_id = $1';
  if (before) {
    params.push(before);
    sql += ` AND created_at < $2`;
  }
  sql += ` ORDER BY created_at DESC LIMIT ${lim}`;
  const { rows } = await query(sql, params);
  return rows.reverse(); // chronological order for the UI
}

/**
 * ADMIN oversight: every conversation on the platform (both participants +
 * last message + counts), newest first. No participant restriction.
 */
async function listAllConversations() {
  const { rows } = await query(
    `SELECT c.*,
       (SELECT row_to_json(m) FROM (
          SELECT content, sender_id, created_at
          FROM messages WHERE conversation_id = c.id
          ORDER BY created_at DESC LIMIT 1
        ) m) AS last_message,
       (SELECT COUNT(*)::int FROM messages WHERE conversation_id = c.id) AS message_count
     FROM conversations c
     ORDER BY c.updated_at DESC`
  );

  return Promise.all(
    rows.map(async (c) => {
      const [a, b, p] = await Promise.all([
        query('SELECT * FROM users WHERE id = $1', [c.user_a_id]),
        query('SELECT * FROM users WHERE id = $1', [c.user_b_id]),
        c.property_id
          ? query('SELECT id, title FROM properties WHERE id = $1', [c.property_id])
          : Promise.resolve({ rows: [] }),
      ]);
      return {
        id: c.id,
        property_id: c.property_id,
        property: p.rows[0] || null,
        user_a: publicUser(a.rows[0]),
        user_b: publicUser(b.rows[0]),
        last_message: c.last_message,
        message_count: c.message_count,
        updated_at: c.updated_at,
      };
    })
  );
}

/** ADMIN oversight: read any conversation's messages (no participant check). */
async function listMessagesForAdmin(conversationId, { limit = 300 } = {}) {
  const { rows: convRows } = await query('SELECT id FROM conversations WHERE id = $1', [conversationId]);
  if (!convRows[0]) throw new Error('Conversation not found');
  const lim = Math.min(500, Math.max(1, parseInt(limit, 10) || 300));
  const { rows } = await query(
    `SELECT * FROM messages WHERE conversation_id = $1 ORDER BY created_at DESC LIMIT ${lim}`,
    [conversationId]
  );
  return rows.reverse(); // chronological
}

/** Mark all messages in a conversation addressed to userId as read. */
async function markRead(userId, conversationId) {
  await assertParticipant(conversationId, userId);
  const { rows } = await query(
    `UPDATE messages SET is_read = TRUE
     WHERE conversation_id = $1 AND receiver_id = $2 AND is_read = FALSE
     RETURNING id`,
    [conversationId, userId]
  );
  return { updated: rows.length };
}

module.exports = {
  getOrCreateConversation,
  ensureSupportConversation,
  sendMessage,
  listConversations,
  listMessages,
  listAllConversations,
  listMessagesForAdmin,
  markRead,
  assertParticipant,
  otherParticipant,
};
