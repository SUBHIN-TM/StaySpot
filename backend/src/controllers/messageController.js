'use strict';

const chat = require('../services/chatService');
const { query } = require('../config/db');
const { asyncHandler, ApiError } = require('../utils/http');

// POST /api/chat/support
// Start (or reuse) a conversation with an admin — the common "contact support".
const startSupport = asyncHandler(async (req, res) => {
  const { rows } = await query(
    "SELECT id FROM users WHERE role = 'admin' AND id <> $1 ORDER BY created_at ASC LIMIT 1",
    [req.user.id]
  );
  if (!rows[0]) throw new ApiError(404, 'No support contact is available right now');
  const conv = await chat.getOrCreateConversation(req.user.id, rows[0].id, null);
  res.status(201).json({ conversation_id: conv.id });
});

// POST /api/chat/conversations  { other_user_id, property_id? }
const startConversation = asyncHandler(async (req, res) => {
  const { other_user_id, property_id } = req.body || {};
  if (!other_user_id) throw new ApiError(400, 'other_user_id is required');
  try {
    const conv = await chat.getOrCreateConversation(req.user.id, other_user_id, property_id || null);
    res.status(201).json({ conversation_id: conv.id, conversation: conv });
  } catch (err) {
    throw new ApiError(400, err.message);
  }
});

// GET /api/chat/conversations
const getConversations = asyncHandler(async (req, res) => {
  res.json({ conversations: await chat.listConversations(req.user.id) });
});

// GET /api/chat/conversations/:id/messages
const getMessages = asyncHandler(async (req, res) => {
  try {
    const messages = await chat.listMessages(req.user.id, req.params.id, {
      before: req.query.before,
      limit: req.query.limit,
    });
    res.json({ messages });
  } catch (err) {
    throw new ApiError(403, err.message);
  }
});

// POST /api/chat/conversations/:id/messages  { content }
// REST fallback for sending (Socket.io is the primary path). Emits over sockets
// too if the io instance is attached to the app.
const postMessage = asyncHandler(async (req, res) => {
  const { content } = req.body || {};
  try {
    const result = await chat.sendMessage({
      senderId: req.user.id,
      conversationId: req.params.id,
      content,
    });
    const io = req.app.get('io');
    if (io) {
      io.to(`conversation:${req.params.id}`).emit('message:new', result.message);
      io.to(`user:${result.receiverId}`).emit('message:new', result.message);
    }
    res.status(201).json({ message: result.message });
  } catch (err) {
    throw new ApiError(400, err.message);
  }
});

// POST /api/chat/conversations/:id/read
const readConversation = asyncHandler(async (req, res) => {
  try {
    const result = await chat.markRead(req.user.id, req.params.id);
    const io = req.app.get('io');
    if (io) io.to(`conversation:${req.params.id}`).emit('message:read', {
      conversation_id: req.params.id,
      reader_id: req.user.id,
    });
    res.json(result);
  } catch (err) {
    throw new ApiError(403, err.message);
  }
});

module.exports = {
  startConversation, startSupport, getConversations, getMessages, postMessage, readConversation,
};
