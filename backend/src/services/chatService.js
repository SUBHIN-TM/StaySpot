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

  // Confirm the other user exists.
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
    await client.query(
      `INSERT INTO notifications (user_id, title, message, type, data)
       VALUES ($1, $2, $3, 'message', $4)`,
      [
        receiverId,
        `New message from ${sender.rows[0]?.name || 'someone'}`,
        text.slice(0, 120),
        JSON.stringify({ conversation_id: conversationId }),
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
  sendMessage,
  listConversations,
  listMessages,
  markRead,
  assertParticipant,
  otherParticipant,
};
