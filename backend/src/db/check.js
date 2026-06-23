'use strict';

// Quick DB connection check. Run before db:migrate / db:seed to confirm the
// database is reachable and the credentials in .env are correct. Prints a clear
// OK message on success, or a friendly diagnosis + exit code 1 on failure so it
// can gate other commands (e.g. `npm run db:check && npm run db:migrate`).

const { pool } = require('../config/db');

// Build a password-free description of where we're connecting, for nice output.
function target() {
  const url = process.env.DATABASE_URL;
  if (url) {
    try {
      const u = new URL(url);
      return `${u.hostname}:${u.port || 5432}${u.pathname} (user ${u.username})`;
    } catch {
      return '(unparseable DATABASE_URL)';
    }
  }
  const host = process.env.PGHOST || 'localhost';
  const port = process.env.PGPORT || '5432';
  const db = process.env.PGDATABASE || 'staymate';
  const user = process.env.PGUSER || 'postgres';
  return `${host}:${port}/${db} (user ${user})`;
}

async function run() {
  const where = target();
  console.log(`Checking database connection → ${where}`);

  // Fail fast instead of hanging if the host/port is unreachable.
  const timeout = setTimeout(() => {
    console.error('\n✗ Timed out after 5s — is PostgreSQL running on that port?');
    process.exit(1);
  }, 5000);

  try {
    const { rows } = await pool.query('SELECT version() AS version, current_database() AS db');
    clearTimeout(timeout);
    console.log(`✓ Connected to ${rows[0].db}`);
    console.log(`  ${rows[0].version}`);
    await pool.end();
    process.exit(0);
  } catch (err) {
    clearTimeout(timeout);
    console.error(`\n✗ Could not connect: ${err.message}`);

    // Point at the usual culprits based on the error code/text.
    const msg = err.message.toLowerCase();
    if (err.code === 'ECONNREFUSED' || msg.includes('econnrefused')) {
      console.error('  → Nothing is listening there. Check PostgreSQL is running and the port in .env.');
    } else if (err.code === '28P01' || msg.includes('password authentication failed')) {
      console.error('  → Wrong username/password. Fix the credentials in backend/.env (DATABASE_URL).');
    } else if (err.code === '3D000' || msg.includes('does not exist')) {
      console.error('  → That database does not exist yet. Create it: CREATE DATABASE staymate;');
    }
    await pool.end().catch(() => {});
    process.exit(1);
  }
}

run();
