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

/**
 * Run a parameterized query. Always use $1, $2 … placeholders — never string
 * concatenation — to stay safe from SQL injection.
 */
function query(text, params) {
  return pool.query(text, params);
}

/**
 * Run a set of statements inside a single transaction. The callback receives a
 * dedicated client; commit/rollback is handled automatically.
 */
async function withTransaction(callback) {
  const client = await pool.connect();
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
