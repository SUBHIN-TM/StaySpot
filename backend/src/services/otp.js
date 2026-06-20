'use strict';

// Server-side OTP (one-time code) storage + verification, backed by the
// email_otps table. Codes live for 10 minutes and there is one active code per
// (email, purpose).

const { query } = require('../config/db');

const OTP_TTL_MINUTES = 10;

function generateCode() {
  return String(Math.floor(100000 + Math.random() * 900000)); // 6 digits
}

// Create (or replace) the OTP for an email+purpose and return the code.
async function createOtp(email, purpose) {
  const code = generateCode();
  await query(
    `INSERT INTO email_otps (email, purpose, code, expires_at)
     VALUES ($1, $2, $3, now() + ($4 || ' minutes')::interval)
     ON CONFLICT (email, purpose)
     DO UPDATE SET code = $3,
                   expires_at = now() + ($4 || ' minutes')::interval,
                   created_at = now()`,
    [email, purpose, code, String(OTP_TTL_MINUTES)]
  );
  return code;
}

// True if the code matches and hasn't expired.
async function checkOtp(email, purpose, code) {
  const { rows } = await query(
    `SELECT 1 FROM email_otps
     WHERE email = $1 AND purpose = $2 AND code = $3 AND expires_at > now()`,
    [email, purpose, String(code)]
  );
  return !!rows[0];
}

// Remove a used OTP.
async function consumeOtp(email, purpose) {
  await query('DELETE FROM email_otps WHERE email = $1 AND purpose = $2', [email, purpose]);
}

module.exports = { createOtp, checkOtp, consumeOtp };
