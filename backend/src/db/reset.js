'use strict';

// ONE-OFF production-fresh reset.
// Wipes all user data (users, properties, media rows, chat, roommate posts,
// favorites, notifications, OTPs) and recreates the admin account.
// Keeps `settings` (config) and `_migrations` (bookkeeping) intact.
//
// Run: node src/db/reset.js

const { pool } = require('../config/db');

const ADMIN_EMAIL = 'admin@staymate.com';
const ADMIN_PASSWORD = 'admin123';
const ADMIN_NAME = 'StayMate Admin';

async function run() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // CASCADE handles FK order; RESTART IDENTITY resets any sequences.
    await client.query(`
      TRUNCATE TABLE
        notifications, messages, conversations, favorites,
        property_images, properties, roommate_posts, email_otps, users
      RESTART IDENTITY CASCADE
    `);

    // Recreate admin. pgcrypto bcrypt is compatible with backend's bcryptjs.
    await client.query(
      `INSERT INTO users (email, username, password_hash, name, role)
       VALUES ($1, $1, crypt($2, gen_salt('bf')), $3, 'admin')`,
      [ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME]
    );

    await client.query('COMMIT');
    console.log('✓ Database reset. Admin recreated:');
    console.log(`  ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('✗ Reset failed:', err.message);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

run();
