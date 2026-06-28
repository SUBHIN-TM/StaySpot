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

module.exports = { getHistory };
