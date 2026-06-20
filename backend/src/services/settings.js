'use strict';

// Read/write app settings (key/value pairs in the `settings` table).
// Values are stored as text; booleans are 'true' / 'false'.

const { query } = require('../config/db');

async function getSetting(key, fallback = null) {
  const { rows } = await query('SELECT value FROM settings WHERE key = $1', [key]);
  return rows[0] ? rows[0].value : fallback;
}

async function getBool(key, fallback = false) {
  const v = await getSetting(key, fallback ? 'true' : 'false');
  return v === 'true';
}

async function setSetting(key, value) {
  await query(
    `INSERT INTO settings (key, value) VALUES ($1, $2)
     ON CONFLICT (key) DO UPDATE SET value = $2`,
    [key, String(value)]
  );
}

async function getAllSettings() {
  const { rows } = await query('SELECT key, value FROM settings');
  const out = {};
  rows.forEach((r) => (out[r.key] = r.value));
  return out;
}

module.exports = { getSetting, getBool, setSetting, getAllSettings };
