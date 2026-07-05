'use strict';

const { query } = require('../config/db');
const storage = require('../storage');
const { asyncHandler, ApiError } = require('../utils/http');

// Backfill display URLs for older entries that only stored storage keys, so the
// admin UI can render thumbnails (driver-correct via storage.url). Newer entries
// already include `urls`/`url`.
function withMediaUrls(changes, action) {
  if (!changes || typeof changes !== 'object') return changes;
  const c = { ...changes };
  if (action === 'image_add' && !c.urls && Array.isArray(c.keys)) {
    c.urls = c.keys.map((k) => storage.url(k));
  }
  if (action === 'video_set' && !c.url && c.key) {
    c.url = storage.url(c.key);
  }
  return c;
}

// GET /api/audit/:entityType/:entityId   (admin only)
// The full edit history (newest first) of a user or property, with the actor's
// current name resolved by join. Each row's `changes` holds the before/after diff.
const getHistory = asyncHandler(async (req, res) => {
  const { entityType, entityId } = req.params;
  if (entityType !== 'user' && entityType !== 'property') {
    throw new ApiError(400, 'entityType must be "user" or "property"');
  }
  const { rows } = await query(
    `SELECT a.id, a.action, a.changes, a.created_at, a.actor_role, u.name AS actor_name
       FROM audit_logs a
       LEFT JOIN users u ON u.id = a.actor_id
      WHERE a.entity_type = $1 AND a.entity_id = $2
      ORDER BY a.created_at DESC
      LIMIT 200`,
    [entityType, entityId]
  );
  const history = rows.map((r) => ({ ...r, changes: withMediaUrls(r.changes, r.action) }));
  res.json({ history });
});

// GET /api/audit   (admin only) — GLOBAL activity feed across all entities.
// Filters: ?entity_type= ?action= ?actor_role= ?q= (actor name/email) + page/limit.
const listActivity = asyncHandler(async (req, res) => {
  const { entity_type, action, actor_role, q } = req.query;
  const page = Math.max(1, parseInt(req.query.page || '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit || '50', 10)));
  const offset = (page - 1) * limit;

  const where = [];
  const params = [];
  let i = 1;
  if (entity_type) { params.push(entity_type); where.push(`a.entity_type = $${i++}`); }
  if (action) { params.push(action); where.push(`a.action = $${i++}`); }
  if (actor_role) { params.push(actor_role); where.push(`a.actor_role = $${i++}`); }
  if (q) { params.push(`%${q}%`); where.push(`(u.name ILIKE $${i} OR u.email ILIKE $${i})`); i++; }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const countRes = await query(
    `SELECT COUNT(*)::int AS total FROM audit_logs a LEFT JOIN users u ON u.id = a.actor_id ${whereSql}`,
    params
  );
  const total = countRes.rows[0]?.total || 0;

  params.push(limit, offset);
  const { rows } = await query(
    `SELECT a.id, a.entity_type, a.entity_id, a.action, a.changes, a.created_at,
            a.actor_role, u.name AS actor_name, u.email AS actor_email,
            (u.deleted_at IS NOT NULL) AS actor_deleted
       FROM audit_logs a
       LEFT JOIN users u ON u.id = a.actor_id
       ${whereSql}
       ORDER BY a.created_at DESC
       LIMIT $${i++} OFFSET $${i++}`,
    params
  );
  const items = rows.map((r) => ({ ...r, changes: withMediaUrls(r.changes, r.action) }));
  res.json({ items, total, page, limit, total_pages: Math.max(1, Math.ceil(total / limit)) });
});

module.exports = { getHistory, listActivity };
