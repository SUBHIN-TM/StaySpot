'use strict';

// Simple file-based error log so failures are visible after the fact (in prod
// or dev) without scrolling the console. Errors are appended to
// backend/logs/error.log; view the tail via GET /api/log-error.
//
// Kept deliberately small: synchronous appends (errors are infrequent) and a
// crude size-based rotation so the file can't grow without bound.

const fs = require('fs');
const fsp = require('fs/promises');
const path = require('path');

const LOG_DIR = path.resolve(__dirname, '..', '..', 'logs');
const LOG_FILE = path.join(LOG_DIR, 'error.log');
const MAX_BYTES = 5 * 1024 * 1024; // rotate at ~5 MB (keep one previous file)

fs.mkdirSync(LOG_DIR, { recursive: true });

// When the log gets big, move it aside (error.log -> error.log.1) and start fresh.
function rotateIfNeeded() {
  try {
    if (fs.statSync(LOG_FILE).size > MAX_BYTES) {
      fs.renameSync(LOG_FILE, `${LOG_FILE}.1`);
    }
  } catch {
    // No file yet — nothing to rotate.
  }
}

// Append one error entry: timestamp, context (e.g. "POST /api/auth/google"),
// and the stack trace (or message).
function logError(context, err) {
  try {
    rotateIfNeeded();
    const time = new Date().toISOString();
    const detail = (err && (err.stack || err.message)) || String(err);
    fs.appendFileSync(LOG_FILE, `[${time}] ${context}\n${detail}\n\n`);
  } catch (e) {
    // Logging must never throw — fall back to the console.
    console.error('[logger] failed to write error log:', e.message);
  }
}

// Read the last `maxLines` lines of the log (for the viewer endpoint).
async function readErrorLog(maxLines = 300) {
  try {
    const data = await fsp.readFile(LOG_FILE, 'utf8');
    const lines = data.split('\n');
    return lines.slice(-maxLines).join('\n');
  } catch {
    return '';
  }
}

// Wipe the log (admin "clear" action).
async function clearErrorLog() {
  await fsp.writeFile(LOG_FILE, '');
}

module.exports = { logError, readErrorLog, clearErrorLog, LOG_FILE };
