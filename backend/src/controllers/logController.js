'use strict';

// Error-log viewer — lets you read the persisted error log from a browser.
//   GET    /api/log-error            → last N lines as plain text
//   DELETE /api/log-error            → clear the log
//
// Access: in production you MUST pass the secret (?key=... or x-log-key header)
// that matches LOG_ACCESS_KEY in the backend .env. In development it's open.

const env = require('../config/env');
const { asyncHandler, ApiError } = require('../utils/http');
const { readErrorLog, clearErrorLog } = require('../utils/logger');

// Is this request allowed to see the logs?
function authorized(req) {
  if (!env.isProd && !env.logAccessKey) return true; // dev convenience: open
  if (!env.logAccessKey) return false; // prod with no key set → locked
  const provided = req.query.key || req.headers['x-log-key'];
  return provided === env.logAccessKey;
}

function guard(req) {
  if (!authorized(req)) {
    throw new ApiError(
      403,
      env.isProd
        ? 'Forbidden — set LOG_ACCESS_KEY in the backend .env and pass ?key=<that value>.'
        : 'Forbidden'
    );
  }
}

// GET /api/log-error?lines=300
const viewLog = asyncHandler(async (req, res) => {
  guard(req);
  const lines = Math.min(5000, Math.max(1, parseInt(req.query.lines || '300', 10) || 300));
  const text = await readErrorLog(lines);
  res.type('text/plain').send(text || '(no errors logged yet)');
});

// DELETE /api/log-error
const clearLog = asyncHandler(async (req, res) => {
  guard(req);
  await clearErrorLog();
  res.type('text/plain').send('Error log cleared.');
});

module.exports = { viewLog, clearLog };
