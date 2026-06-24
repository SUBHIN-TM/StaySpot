'use strict';

const { Pool } = require('pg');
const env = require('./env');

// Prefer a single connection string; fall back to discrete PG* vars.
const pool = env.databaseUrl
  ? new Pool({ connectionString: env.databaseUrl })
  : new Pool({
      host: env.pg.host || 'localhost',
      port: env.pg.port || 5432,
      user: env.pg.user || 'postgres',
      password: env.pg.password || 'postgres',
      database: env.pg.database || 'staymate',
    });

pool.on('error', (err) => {
  // Idle client errors should not crash the process.
  console.error('[db] unexpected idle client error:', err.message);
});

// Connection-establishment failures: the DB refused/couldn't be reached, so no
// statement ran yet — meaning a retry is SAFE (it can't double-run a write).
// Our remote DB intermittently refuses new connections; a couple of quick
// retries turn most of those transient blips into successes.
const TRANSIENT_CONNECT = new Set(['ECONNREFUSED', 'ETIMEDOUT', 'ENETUNREACH', 'ENOTFOUND']);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function withConnectRetry(fn, attempts = 3) {
  let lastErr;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      // Only retry pre-execution connection errors; let real SQL errors through.
      if (!TRANSIENT_CONNECT.has(err.code) || i === attempts - 1) throw err;
      console.warn(`[db] ${err.code} — retrying (${i + 1}/${attempts - 1})`);
      await sleep(250 * (i + 1)); // 250ms, 500ms backoff
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

module.exports = { pool, query, withTransaction };
