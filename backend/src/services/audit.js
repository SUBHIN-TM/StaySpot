'use strict';

// Audit trail helpers (see migration 017). Records who changed what, when, with a
// before/after diff — so admins can review the edit history of a user or property.

const { query } = require('../config/db');

// Secrets must never be written into the log — we only note that they changed.
const SECRET_FIELDS = new Set(['password', 'password_hash']);

// Compare two values loosely: numeric strings compare as numbers (so 18000 vs
// "18000.00" isn't a false "change"); everything else compares as strings.
function valuesEqual(b, a) {
  if (b === a) return true;
  const bn = Number(b);
  const an = Number(a);
  if (b !== null && b !== '' && a !== null && a !== '' && !Number.isNaN(bn) && !Number.isNaN(an)) {
    return bn === an;
  }
  return String(b ?? '') === String(a ?? '');
}

// Build { field: { before, after } } for the fields that actually changed.
// `before` = existing row, `after` = object of new values being written.
function diffChanges(before, after, fields) {
  const changes = {};
  for (const f of fields) {
    if (after[f] === undefined) continue;
    if (SECRET_FIELDS.has(f)) {
      changes[f] = { changed: true };
      continue;
    }
    if (!valuesEqual(before?.[f], after[f])) {
      changes[f] = { before: before?.[f] ?? null, after: after[f] ?? null };
    }
  }
  return changes;
}

// Record one audit entry. Best-effort: NEVER throws (a logging hiccup must not
// break the real operation). `countsAsEdit` bumps the entity's edit_count — set
// it for owner/user-initiated content edits, not admin moderation actions.
async function recordAudit({ entityType, entityId, action, actor, changes, countsAsEdit = false }) {
  try {
    await query(
      `INSERT INTO audit_logs (entity_type, entity_id, action, actor_id, actor_role, changes)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        entityType,
        entityId,
        action,
        actor?.id || null,
        actor?.role || null,
        changes ? JSON.stringify(changes) : null,
      ]
    );
    if (countsAsEdit) {
      const table = entityType === 'user' ? 'users' : 'properties';
      await query(`UPDATE ${table} SET edit_count = edit_count + 1 WHERE id = $1`, [entityId]);
    }
  } catch (err) {
    console.error('audit log failed:', err.message);
  }
}

module.exports = { recordAudit, diffChanges };
