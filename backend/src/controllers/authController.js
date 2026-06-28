'use strict';

const { OAuth2Client } = require('google-auth-library');
const { query } = require('../config/db');
const env = require('../config/env');
const { hashPassword, comparePassword } = require('../utils/password');
const { signToken } = require('../utils/jwt');
const { asyncHandler, ApiError, withTimeout } = require('../utils/http');
const { selfUser } = require('../utils/serialize');
const { createOtp, checkOtp, consumeOtp } = require('../services/otp');
const { sendOtpEmail, sendWelcomeEmail } = require('../services/mail');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const VALID_ROLES = ['seeker', 'owner'];

// Hide most of an email for friendly UI messages: s****n@gmail.com
function maskEmail(email) {
  const [name, domain] = String(email).split('@');
  if (!domain) return email;
  const shown = name.length <= 2 ? name[0] : name[0] + '***' + name[name.length - 1];
  return `${shown}@${domain}`;
}

// Client used to verify Google ID tokens against our OAuth client id.
const googleClient = new OAuth2Client(env.googleClientId);

// POST /api/auth/send-otp
// Body: { purpose: 'signup' | 'login', email?, identifier? }
// Generates a code, stores it, and emails it to the right address.
const sendOtp = asyncHandler(async (req, res) => {
  const { purpose, email, identifier } = req.body || {};
  const p = purpose === 'login' ? 'login' : 'signup';

  let targetEmail;
  if (p === 'signup') {
    if (!email || !EMAIL_RE.test(email)) throw new ApiError(400, 'A valid email is required');
    targetEmail = String(email).toLowerCase().trim();
    const exists = await query('SELECT id FROM users WHERE email = $1', [targetEmail]);
    if (exists.rows[0]) throw new ApiError(409, 'An account with this email already exists');
  } else {
    // login: find the user by username/email and send to their registered email.
    const id = String(identifier || email || '').toLowerCase().trim();
    if (!id) throw new ApiError(400, 'Username or email is required');
    const u = await query('SELECT email FROM users WHERE email = $1 OR username = $1', [id]);
    if (!u.rows[0]) throw new ApiError(404, 'No account found with that username or email');
    targetEmail = u.rows[0].email;
  }

  const code = await createOtp(targetEmail, p);
  await sendOtpEmail(targetEmail, code);
  res.json({ sent: true, email: maskEmail(targetEmail) });
});

// POST /api/auth/verify-otp
// Body: { email, code, purpose }. Checks the code is valid (without consuming it),
// so the signup UI can confirm before showing the password fields.
const verifyOtp = asyncHandler(async (req, res) => {
  const { email, code, purpose } = req.body || {};
  const p = purpose === 'login' ? 'login' : 'signup';
  const e = String(email || '').toLowerCase().trim();
  if (!e || !code) throw new ApiError(400, 'Email and code are required');

  const ok = await checkOtp(e, p, code);
  if (!ok) throw new ApiError(400, 'Invalid or expired code');
  res.json({ valid: true });
});

// POST /api/auth/register
// Manual sign-up with name, email, username, password — requires a verified OTP.
// role defaults to 'seeker' (a regular USER). Owners will use role 'owner'.
const register = asyncHandler(async (req, res) => {
  const { email, password, name, username, otp, role, gender, occupation, mobile_number } =
    req.body || {};

  if (!email || !EMAIL_RE.test(email)) throw new ApiError(400, 'A valid email is required');
  if (!password || String(password).length < 6)
    throw new ApiError(400, 'Password must be at least 6 characters');
  if (!name || !String(name).trim()) throw new ApiError(400, 'Name is required');

  const cleanEmail = String(email).toLowerCase().trim();

  // The email must have been verified via OTP first.
  const otpOk = await checkOtp(cleanEmail, 'signup', otp);
  if (!otpOk) throw new ApiError(400, 'Please verify your email with the code we sent');
  // Default the username to the email if one wasn't provided.
  const cleanUsername = (username && String(username).trim()) || cleanEmail;

  // Don't allow duplicate accounts.
  const existing = await query('SELECT id FROM users WHERE email = $1 OR username = $2', [
    cleanEmail,
    cleanUsername,
  ]);
  if (existing.rows[0]) throw new ApiError(409, 'An account with this email or username already exists');

  const finalRole = VALID_ROLES.includes(role) ? role : 'seeker';
  const password_hash = await hashPassword(String(password));

  const { rows } = await query(
    `INSERT INTO users (email, username, password_hash, name, role, gender, occupation, mobile_number)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [
      cleanEmail,
      cleanUsername,
      password_hash,
      String(name).trim(),
      finalRole,
      gender || null,
      occupation || null,
      mobile_number || null,
    ]
  );

  const user = rows[0];

  // The OTP is used up; send a welcome email (best-effort — don't fail signup).
  await consumeOtp(cleanEmail, 'signup');
  sendWelcomeEmail(cleanEmail, user.name).catch((err) =>
    console.error('Welcome email failed:', err.message)
  );

  const token = signToken({ sub: user.id, role: user.role });
  res.status(201).json({ token, user: selfUser(user) });
});

// POST /api/auth/login
// Manual login by USERNAME or EMAIL + password.
const login = asyncHandler(async (req, res) => {
  const { identifier, email, password } = req.body || {};
  const id = String(identifier || email || '').toLowerCase().trim();
  if (!id || !password) throw new ApiError(400, 'Username/email and password are required');

  const { rows } = await query('SELECT * FROM users WHERE email = $1 OR username = $1', [id]);
  const user = rows[0];
  if (!user || !user.password_hash) throw new ApiError(401, 'Invalid username/email or password');
  if (user.is_blocked) throw new ApiError(403, 'Your account has been blocked');

  const ok = await comparePassword(String(password), user.password_hash);
  if (!ok) throw new ApiError(401, 'Invalid username/email or password');

  const token = signToken({ sub: user.id, role: user.role });
  res.json({ token, user: selfUser(user) });
});

// POST /api/auth/otp-login
// Body: { identifier, code }. Logs a user in after verifying the emailed OTP.
const otpLogin = asyncHandler(async (req, res) => {
  const { identifier, email, code } = req.body || {};
  const id = String(identifier || email || '').toLowerCase().trim();
  if (!id || !code) throw new ApiError(400, 'Username/email and code are required');

  const { rows } = await query('SELECT * FROM users WHERE email = $1 OR username = $1', [id]);
  const user = rows[0];
  if (!user) throw new ApiError(404, 'No account found with that username or email');
  if (user.is_blocked) throw new ApiError(403, 'Your account has been blocked');

  const ok = await checkOtp(user.email, 'login', code);
  if (!ok) throw new ApiError(400, 'Invalid or expired code');
  await consumeOtp(user.email, 'login');

  const token = signToken({ sub: user.id, role: user.role });
  res.json({ token, user: selfUser(user) });
});

// GET /api/auth/me
const me = asyncHandler(async (req, res) => {
  const { rows } = await query('SELECT * FROM users WHERE id = $1', [req.user.id]);
  res.json({ user: selfUser(rows[0]) });
});

// POST /api/auth/google
// Body: { credential } — the Google ID token returned by the browser sign-in.
// We verify it with Google, then find-or-create the user (name + email + pic).
const googleAuth = asyncHandler(async (req, res) => {
  if (!env.googleClientId) throw new ApiError(500, 'Google sign-in is not configured');

  const { credential, role } = req.body || {};
  if (!credential) throw new ApiError(400, 'Missing Google credential');
  // Desired role for a NEW account (owner signup page sends 'owner'); default 'seeker'.
  const desiredRole = role === 'owner' ? 'owner' : 'seeker';

  // 1. Verify the token is genuine and was issued for OUR app.
  //    Hard 8s ceiling: verifyIdToken normally uses cached Google certs (fast),
  //    but if it must refetch certs and Google/network is slow, don't hang.
  let payload;
  try {
    const ticket = await withTimeout(
      googleClient.verifyIdToken({ idToken: credential, audience: env.googleClientId }),
      8000,
      'Google verification timed out'
    );
    payload = ticket.getPayload();
  } catch (err) {
    if (err.status === 504) throw err; // timeout → surface as 504, not "invalid token"
    // TEMP DEBUG: print the real reason verification failed so we can diagnose the
    // 401 (e.g. "Wrong recipient" = client-id/audience mismatch, "Token used too
    // late" = clock skew). Remove once the Google sign-in issue is resolved.
    console.error('[google-auth] verifyIdToken failed:', err.message);
    console.error('[google-auth] backend audience (GOOGLE_CLIENT_ID):', env.googleClientId);
    throw new ApiError(401, 'Invalid Google token');
  }

  const email = payload.email ? String(payload.email).toLowerCase() : null;
  if (!email || !payload.email_verified) throw new ApiError(401, 'Google email not verified');

  const googleId = payload.sub;
  const name = payload.name || email.split('@')[0];
  const avatar = payload.picture || null;

  // 2. Find an existing user by email or Google id.
  const found = await query('SELECT * FROM users WHERE email = $1 OR google_id = $2', [
    email,
    googleId,
  ]);
  let user = found.rows[0];
  if (user && user.is_blocked) throw new ApiError(403, 'Your account has been blocked');

  if (!user) {
    // 3a. New user → create as role "seeker" (a regular USER).
    // username defaults to the email; password is a random hash they never use
    // (they always sign in via Google).
    const randomPassword = await hashPassword(`google:${googleId}:${name}`);
    // Google's basic profile usually omits gender — save it if present, else null.
    const gender = payload.gender || null;
    const created = await query(
      `INSERT INTO users (email, username, name, role, google_id, avatar_url, password_hash, gender)
       VALUES ($1, $1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [email, name, desiredRole, googleId, avatar, randomPassword, gender]
    );
    user = created.rows[0];
  } else {
    // 3b. Existing user → backfill Google id / latest avatar.
    const updated = await query(
      `UPDATE users
         SET google_id = COALESCE(google_id, $2),
             avatar_url = COALESCE($3, avatar_url),
             updated_at = now()
       WHERE id = $1
       RETURNING *`,
      [user.id, googleId, avatar]
    );
    user = updated.rows[0];
  }

  const token = signToken({ sub: user.id, role: user.role });
  res.json({ token, user: selfUser(user) });
});

module.exports = { register, login, otpLogin, sendOtp, verifyOtp, me, googleAuth };
