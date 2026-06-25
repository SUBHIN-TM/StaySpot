'use strict';

// Bookkeeping for the direct-to-storage upload flow (see migration 009).
//
// A row is created the moment we hand out a presigned URL ("pending"). When the
// property form is submitted we flip the used keys to "claimed". A background
// sweep (services/uploadSweeper.js) deletes anything still "pending" past the
// TTL — those were attached but never submitted.

const { query } = require('../config/db');

// Record a freshly-presigned upload as pending.
async function recordPending({ key, ownerId, folder, mimeType }) {
  await query(
    `INSERT INTO pending_uploads (key, owner_id, folder, mime_type, status)
     VALUES ($1, $2, $3, $4, 'pending')
     ON CONFLICT (key) DO NOTHING`,
    [key, ownerId, folder, mimeType || null]
  );
}

// Mark the given keys as claimed (in use) so the sweep leaves them alone.
// Scoped to the owner so one user can't claim another's pending object.
// `exec` lets the caller run this inside an open transaction (pass a client's
// query) so claiming commits atomically with the property write. Returns the
// keys that were actually claimed.
async function claimKeys(ownerId, keys, exec = query) {
  if (!keys || !keys.length) return [];
  const { rows } = await exec(
    `UPDATE pending_uploads
       SET status = 'claimed'
     WHERE owner_id = $1 AND key = ANY($2::text[])
     RETURNING key`,
    [ownerId, keys]
  );
  return rows.map((r) => r.key);
}

// Remove a still-pending upload (user cancelled / removed the attachment before
// submitting). Only deletes rows the owner owns AND that are still pending — a
// claimed key belongs to a saved listing and must not be cancel-deleted here.
// Returns the row if one was removed (so the caller can delete the storage object).
async function removePending(ownerId, key) {
  const { rows } = await query(
    `DELETE FROM pending_uploads
     WHERE key = $1 AND owner_id = $2 AND status = 'pending'
     RETURNING key`,
    [key, ownerId]
  );
  return rows[0] || null;
}

module.exports = { recordPending, claimKeys, removePending };
