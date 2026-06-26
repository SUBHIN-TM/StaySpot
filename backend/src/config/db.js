'use strict';

const { Pool } = require('pg');
const env = require('./env');

// Prefer a single connection string; fall back to discrete PG* vars.
const connection = env.databaseUrl
  ? { connectionString: env.databaseUrl }
  : {
      host: env.pg.host || 'localhost',
      port: env.pg.port || 5432,
      user: env.pg.user || 'postgres',
      password: env.pg.password || 'postgres',
      database: env.pg.database || 'staymate',
    };

// Pool tuning. The remote DB is occasionally flaky, so: keepAlive stops an idle
// connection from being silently dropped by the network; connectionTimeoutMillis
// makes a dead DB fail fast (10s) instead of hanging a request forever.
const pool = new Pool({
  ...connection,
  // Smaller pool = fewer simultaneous new connections on startup/under load.
  // The remote host's firewall rate-limits bursts of new connections to 5432
  // (a burst of 8 gets ~3 dropped; spaced connects succeed), so keeping the
  // pool small avoids tripping that limit. keepAlive + idle reuse mean we open
  // new connections rarely once warmed up.
  max: 5,
  // Keep pooled connections open indefinitely (0 = never auto-close on idle).
  // Opening a NEW connection over the flaky network costs 5–10s; reusing a warm
  // one costs ~0.27s. So we hold connections open and lean on keepAlive + the
  // keep-warm pinger below to stop them going stale.
  idleTimeoutMillis: 0,
  // A healthy connect to this DB is sub-second; 5s is plenty. Failing fast lets
  // withConnectRetry() retry a dropped connection quickly instead of stalling.
  connectionTimeoutMillis: 5000,
  keepAlive: true,
  // Tags our connections in pg_stat_activity so they're easy to spot/diagnose.
  application_name: 'staymate-backend',
});

// Keep at least one connection warm. Most page loads are slow ONLY because they
// have to open a fresh connection over the lossy network; a tiny periodic ping
// keeps a pooled connection alive so requests reuse it (~0.27s) instead of
// paying the multi-second connect cost. unref() so it never blocks shutdown.
let keepWarmTimer = null;
function startKeepWarm(intervalMs = 20000) {
  if (keepWarmTimer) return;
  keepWarmTimer = setInterval(() => {
    pool.query('SELECT 1').catch(() => {}); // ignore blips; just keeping it warm
  }, intervalMs);
  if (keepWarmTimer.unref) keepWarmTimer.unref();
}

pool.on('error', (err) => {
  // Idle client errors should not crash the process.
  console.error('[db] unexpected idle client error:', err.message);
});

// Connection-establishment failures: the DB refused/couldn't be reached, so no
// statement ran yet — meaning a retry is SAFE (it can't double-run a write).
// Our remote DB intermittently refuses new connections; a few quick retries
// turn most of those transient blips into successes.
const TRANSIENT_CONNECT = new Set(['ECONNREFUSED', 'ETIMEDOUT', 'ENETUNREACH', 'ENOTFOUND']);

// pg-pool reports the two timeout failures we actually hit as plain Errors with
// NO `.code` — so matching on code alone misses them. Catch them by message too.
//   • "timeout exceeded when trying to connect"      (pool acquire timeout)
//   • "Connection terminated due to connection timeout" (socket connect timeout)
const TRANSIENT_MESSAGE = /timeout exceeded when trying to connect|connection terminated due to connection timeout/i;

function isTransientConnect(err) {
  if (!err) return false;
  return TRANSIENT_CONNECT.has(err.code) || TRANSIENT_MESSAGE.test(err.message || '');
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function withConnectRetry(fn, attempts = 4) {
  let lastErr;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      // Only retry pre-execution connection errors; let real SQL errors through.
      if (!isTransientConnect(err) || i === attempts - 1) throw err;
      console.warn(
        `[db] transient connect failure (${err.code || err.message}) — retrying (${i + 1}/${attempts - 1})`
      );
      await sleep(300 * (i + 1)); // 300ms, 600ms, 900ms backoff
    }
  }
  throw lastErr;
}

/**
 * Run a parameterized query. Always use $1, $2 … placeholders — never string
 * concatenation — to stay safe from SQL injection.
 * Retries transient connection refusals (see withConnectRetry).
 */
function query(text, params) {
  return withConnectRetry(() => pool.query(text, params));
}

/**
 * Run a set of statements inside a single transaction. The callback receives a
 * dedicated client; commit/rollback is handled automatically.
 */
async function withTransaction(callback) {
  // Retry only the connection step; once BEGIN runs we never retry (unsafe).
  const client = await withConnectRetry(() => pool.connect());
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { pool, query, withTransaction, startKeepWarm };
