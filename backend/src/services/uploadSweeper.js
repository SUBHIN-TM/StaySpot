'use strict';

// Garbage-collects orphaned uploads from the direct-to-storage flow.
//
// A file uploaded straight to storage but never attached to a property (the user
// cancelled, closed the tab, or crashed) is left as a "pending" row. This sweeper
// deletes any pending object older than the configured TTL, plus an admin "flush
// now" that drops every pending object regardless of age.

const { query } = require('../config/db');
const storage = require('../storage');
const { getSetting } = require('./settings');

const DEFAULT_TTL_MINUTES = 60;
const SWEEP_INTERVAL_MS = 5 * 60 * 1000; // run the age-based sweep every 5 minutes

// Read the admin-configured TTL (minutes), falling back to the default.
async function getTtlMinutes() {
  const raw = await getSetting('pending_upload_ttl_minutes', String(DEFAULT_TTL_MINUTES));
  const n = parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : DEFAULT_TTL_MINUTES;
}

// Delete a set of pending rows: remove the storage object first, then the row.
// (Storage first so a delete failure leaves the row to retry next sweep, rather
// than forgetting about a file we never managed to remove.)
async function deletePendingRows(rows) {
  let deleted = 0;
  let failed = 0;
  for (const { key } of rows) {
    try {
      await storage.delete(key);
      await query('DELETE FROM pending_uploads WHERE key = $1', [key]);
      deleted++;
    } catch (err) {
      failed++;
      console.error('[sweeper] could not delete orphaned upload', key, '-', err.message);
    }
  }
  return { deleted, failed };
}

// Age-based sweep: delete pending uploads older than the TTL.
async function cleanupPendingUploads() {
  const ttl = await getTtlMinutes();
  const { rows } = await query(
    `SELECT key FROM pending_uploads
     WHERE status = 'pending' AND created_at < now() - make_interval(mins => $1)`,
    [ttl]
  );
  const result = await deletePendingRows(rows);
  if (result.deleted || result.failed) {
    console.log(`[sweeper] removed ${result.deleted} orphaned upload(s), ${result.failed} failed`);
  }
  return result;
}

// Manual flush (admin button): delete EVERY pending upload, ignoring age.
async function flushPendingUploads() {
  const { rows } = await query(`SELECT key FROM pending_uploads WHERE status = 'pending'`);
  return deletePendingRows(rows);
}

// How many orphan candidates are currently waiting (shown in the admin panel).
async function countPending() {
  const { rows } = await query(
    `SELECT COUNT(*)::int AS n FROM pending_uploads WHERE status = 'pending'`
  );
  return rows[0].n;
}

// Start the periodic sweep. Safe to call once at boot. The timer is unref'd so
// it never keeps the process alive on its own.
let timer = null;
function startSweeper() {
  if (timer) return;
  const run = () =>
    cleanupPendingUploads().catch((err) => console.error('[sweeper]', err.message));
  timer = setInterval(run, SWEEP_INTERVAL_MS);
  if (timer.unref) timer.unref();
  // First sweep a little after boot, so startup isn't competing with it.
  const kickoff = setTimeout(run, 30 * 1000);
  if (kickoff.unref) kickoff.unref();
}

module.exports = {
  cleanupPendingUploads,
  flushPendingUploads,
  countPending,
  startSweeper,
};
