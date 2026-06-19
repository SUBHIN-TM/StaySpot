'use strict';

// Real-time chat over Socket.io.
//
// Client connects with the JWT:  io(URL, { auth: { token } })
//
// Events the client can emit:
//   conversation:join   { conversationId }      -> join a room to receive live messages
//   conversation:leave  { conversationId }
//   message:send        { conversationId, content, propertyId? }  (ack returns the saved message)
//   message:read        { conversationId }
//   typing              { conversationId, isTyping }
//
// Events the server emits:
//   message:new   <message>            to conversation room + receiver's personal room
//   message:read  { conversation_id, reader_id }
//   typing        { conversation_id, user_id, isTyping }
//   notification  { ... }              to the receiver's personal room

const { verifyToken } = require('../utils/jwt');
const { query } = require('../config/db');
const chat = require('../services/chatService');

function registerChat(io) {
  // Authenticate every socket via the JWT in the handshake.
  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        (socket.handshake.headers?.authorization || '').replace('Bearer ', '');
      if (!token) return next(new Error('Authentication required'));
      const decoded = verifyToken(token);
      const { rows } = await query('SELECT id, name, role FROM users WHERE id = $1', [decoded.sub]);
      if (!rows[0]) return next(new Error('User not found'));
      socket.user = rows[0];
      next();
    } catch {
      next(new Error('Invalid or expired token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.user.id;
    // Personal room — lets us push messages/notifications to a user on any screen.
    socket.join(`user:${userId}`);

    socket.on('conversation:join', async ({ conversationId } = {}, ack) => {
      try {
        await chat.assertParticipant(conversationId, userId);
        socket.join(`conversation:${conversationId}`);
        if (typeof ack === 'function') ack({ ok: true });
      } catch (err) {
        if (typeof ack === 'function') ack({ ok: false, error: err.message });
      }
    });

    socket.on('conversation:leave', ({ conversationId } = {}) => {
      socket.leave(`conversation:${conversationId}`);
    });

    socket.on('message:send', async ({ conversationId, content, propertyId } = {}, ack) => {
      try {
        const result = await chat.sendMessage({
          senderId: userId,
          conversationId,
          content,
          propertyId: propertyId || null,
        });
        // Deliver to everyone in the conversation room (incl. sender's other devices)
        io.to(`conversation:${conversationId}`).emit('message:new', result.message);
        // Also nudge the receiver's personal room in case they aren't in the room.
        io.to(`user:${result.receiverId}`).emit('message:new', result.message);
        io.to(`user:${result.receiverId}`).emit('notification', {
          type: 'message',
          conversation_id: conversationId,
          message: result.message,
        });
        if (typeof ack === 'function') ack({ ok: true, message: result.message });
      } catch (err) {
        if (typeof ack === 'function') ack({ ok: false, error: err.message });
      }
    });

    socket.on('message:read', async ({ conversationId } = {}, ack) => {
      try {
        await chat.markRead(userId, conversationId);
        io.to(`conversation:${conversationId}`).emit('message:read', {
          conversation_id: conversationId,
          reader_id: userId,
        });
        if (typeof ack === 'function') ack({ ok: true });
      } catch (err) {
        if (typeof ack === 'function') ack({ ok: false, error: err.message });
      }
    });

    socket.on('typing', ({ conversationId, isTyping } = {}) => {
      socket.to(`conversation:${conversationId}`).emit('typing', {
        conversation_id: conversationId,
        user_id: userId,
        isTyping: !!isTyping,
      });
    });
  });
}

module.exports = { registerChat };
