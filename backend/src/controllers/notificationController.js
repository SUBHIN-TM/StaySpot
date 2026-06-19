'use strict';

const { query } = require('../config/db');
const { asyncHandler } = require('../utils/http');

// GET /api/notifications
const listNotifications = asyncHandler(async (req, res) => {
  const { rows } = await query(
    'SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 100',
    [req.user.id]
  );
  const unread = rows.filter((n) => n.status === 'unread').length;
  res.json({ notifications: rows, unread_count: unread });
});

// POST /api/notifications/:id/read
const markRead = asyncHandler(async (req, res) => {
  await query(
    `UPDATE notifications SET status = 'read' WHERE id = $1 AND user_id = $2`,
    [req.params.id, req.user.id]
  );
  res.json({ ok: true });
});

// POST /api/notifications/read-all
const markAllRead = asyncHandler(async (req, res) => {
  await query(
    `UPDATE notifications SET status = 'read' WHERE user_id = $1 AND status = 'unread'`,
    [req.user.id]
  );
  res.json({ ok: true });
});

module.exports = { listNotifications, markRead, markAllRead };
