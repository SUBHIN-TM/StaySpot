'use strict';

const { query } = require('../config/db');
const storage = require('../storage');
const { hashPassword } = require('../utils/password');
const { asyncHandler, ApiError } = require('../utils/http');
const { publicUser, selfUser, adminUser } = require('../utils/serialize');
const { claimKeys } = require('../services/pendingUploads');
const { recordAudit, diffChanges } = require('../services/audit');
const { createOtp, checkOtp, consumeOtp } = require('../services/otp');
const { sendOtpEmail } = require('../services/mail');

// Mask an email for confirmation UIs, e.g. "jo***@gmail.com".
function maskEmail(email) {
  const [name, domain] = String(email || '').split('@');
  if (!domain) return email;
  const shown = name.slice(0, 2);
  return `${shown}${'*'.repeat(Math.max(1, name.length - 2))}@${domain}`;
}

// GET /api/users/:id  (public profile)
const getUser = asyncHandler(async (req, res) => {
  const { rows } = await query('SELECT * FROM users WHERE id = $1', [req.params.id]);
  if (!rows[0]) throw new ApiError(404, 'User not found');
  res.json({ user: publicUser(rows[0]) });
});

// PATCH /api/users/me  (update own profile)
// Editable: name, username, password (all optional — only sent fields change).
const updateMe = asyncHandler(async (req, res) => {
  const { name, username, password, otp, gender, occupation } = req.body || {};

  // If changing the username, make sure no one else has it.
  let cleanUsername = null;
  if (username !== undefined && username !== null && String(username).trim()) {
    cleanUsername = String(username).trim().toLowerCase();
    const clash = await query('SELECT id FROM users WHERE username = $1 AND id <> $2', [
      cleanUsername,
      req.user.id,
    ]);
    if (clash.rows[0]) throw new ApiError(409, 'That username is already taken');
  }

  // If changing the password, validate, and require an email-OTP that the user
  // confirmed first (POST /users/me/password-otp). This protects against someone
  // changing the password on an unlocked/hijacked session.
  let password_hash = null;
  if (password) {
    if (String(password).length < 6)
      throw new ApiError(400, 'Password must be at least 6 characters');
    const ok = await checkOtp(req.user.email, 'password_change', otp);
    if (!ok) throw new ApiError(400, 'Enter the verification code we emailed you to change your password');
    password_hash = await hashPassword(String(password));
  }

  // Snapshot before the change so we can log the before/after diff.
  const before = (await query(
    'SELECT name, username, gender, occupation FROM users WHERE id = $1',
    [req.user.id]
  )).rows[0] || {};

  const { rows } = await query(
    `UPDATE users SET
       name          = COALESCE($2, name),
       username      = COALESCE($3, username),
       password_hash = COALESCE($4, password_hash),
       gender        = COALESCE($5, gender),
       occupation    = COALESCE($6, occupation),
       updated_at    = now()
     WHERE id = $1
     RETURNING *`,
    [req.user.id, name ?? null, cleanUsername, password_hash, gender ?? null, occupation ?? null]
  );

  // Password changed successfully → burn the one-time code so it can't be reused.
  if (password) await consumeOtp(req.user.email, 'password_change');

  const changes = diffChanges(before, rows[0], ['name', 'username', 'gender', 'occupation']);
  if (password) changes.password = { changed: true };
  if (Object.keys(changes).length) {
    await recordAudit({
      entityType: 'user', entityId: req.user.id, action: 'update',
      actor: req.user, changes, countsAsEdit: true,
    });
  }
  res.json({ user: selfUser(rows[0]) });
});

// POST /api/users/me/password-otp
// Emails the logged-in user a one-time code to authorize a password change.
const sendPasswordOtp = asyncHandler(async (req, res) => {
  const { rows } = await query('SELECT email FROM users WHERE id = $1', [req.user.id]);
  const email = rows[0]?.email;
  if (!email) throw new ApiError(404, 'User not found');
  const code = await createOtp(email, 'password_change');
  await sendOtpEmail(email, code);
  res.json({ sent: true, email: maskEmail(email) });
});

// POST /api/users/me/become-owner
// Upgrade a seeker account to an owner (an "owner" can do everything a seeker
// can, plus list properties — so it's just a role promotion on the SAME account,
// keeping their email, favourites, chats, etc.). Idempotent for existing owners;
// admins are never changed.
const becomeOwner = asyncHandler(async (req, res) => {
  const cur = await query('SELECT * FROM users WHERE id = $1', [req.user.id]);
  const me = cur.rows[0];
  if (!me) throw new ApiError(404, 'User not found');
  if (me.role === 'admin') throw new ApiError(403, 'Admin accounts can’t become owners');
  if (me.role === 'owner') return res.json({ user: selfUser(me) }); // already an owner

  const { rows } = await query(
    "UPDATE users SET role = 'owner', updated_at = now() WHERE id = $1 RETURNING *",
    [req.user.id]
  );
  await recordAudit({
    entityType: 'user', entityId: req.user.id, action: 'update',
    actor: req.user, changes: { role: { from: 'seeker', to: 'owner' } }, countsAsEdit: true,
  });
  res.json({ user: selfUser(rows[0]) });
});

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// POST /api/users/me/email-otp  { email }
// Emails a one-time code to the NEW address so we can confirm the user owns it
// before switching their login email.
const sendEmailChangeOtp = asyncHandler(async (req, res) => {
  const email = String(req.body?.email || '').toLowerCase().trim();
  if (!EMAIL_RE.test(email)) throw new ApiError(400, 'Enter a valid email address');

  const me = await query('SELECT email FROM users WHERE id = $1', [req.user.id]);
  if (me.rows[0]?.email === email) throw new ApiError(400, 'That is already your email');

  const taken = await query('SELECT id FROM users WHERE email = $1 AND id <> $2', [email, req.user.id]);
  if (taken.rows[0]) throw new ApiError(409, 'An account with this email already exists');

  const code = await createOtp(email, 'email_change');
  await sendOtpEmail(email, code);
  res.json({ sent: true, email: maskEmail(email) });
});

// PATCH /api/users/me/email  { email, otp }
// Verify the code we sent to the NEW address, then switch the login email.
const changeEmail = asyncHandler(async (req, res) => {
  const email = String(req.body?.email || '').toLowerCase().trim();
  const otp = req.body?.otp;
  if (!EMAIL_RE.test(email)) throw new ApiError(400, 'Enter a valid email address');

  const taken = await query('SELECT id FROM users WHERE email = $1 AND id <> $2', [email, req.user.id]);
  if (taken.rows[0]) throw new ApiError(409, 'An account with this email already exists');

  const ok = await checkOtp(email, 'email_change', otp);
  if (!ok) throw new ApiError(400, 'Enter the verification code we emailed to the new address');

  const { rows } = await query(
    'UPDATE users SET email = $2, updated_at = now() WHERE id = $1 RETURNING *',
    [req.user.id, email]
  );
  await consumeOtp(email, 'email_change');

  await recordAudit({
    entityType: 'user', entityId: req.user.id, action: 'update',
    actor: req.user, changes: { email: { changed: true } }, countsAsEdit: true,
  });

  // The JWT is keyed by user id (not email), so the session stays valid.
  res.json({ user: selfUser(rows[0]) });
});

// POST /api/users/me/phone  (logged-in owner submits their number for verification)
// We only STORE the number here — actual verification happens later when an admin
// calls the owner and confirms (PATCH /users/:id/verify-phone). Re-submitting a
// (possibly changed) number always resets the verified flag so it's re-confirmed.
const submitPhone = asyncHandler(async (req, res) => {
  const digits = String(req.body?.mobile_number || '').replace(/\D/g, '');
  // Kerala/India for now: accept a 10-digit mobile (optionally prefixed with 91).
  const ten = digits.length === 12 && digits.startsWith('91') ? digits.slice(2) : digits;
  if (!/^[6-9]\d{9}$/.test(ten)) {
    throw new ApiError(400, 'Enter a valid 10-digit Indian mobile number');
  }
  const { rows } = await query(
    `UPDATE users
        SET mobile_number = $2, phone_verified = FALSE, phone_verified_at = NULL,
            updated_at = now()
      WHERE id = $1
      RETURNING *`,
    [req.user.id, ten]
  );
  await recordAudit({
    entityType: 'user', entityId: req.user.id, action: 'phone_submit',
    actor: req.user, changes: { mobile_number: ten }, countsAsEdit: true,
  });
  res.json({ user: selfUser(rows[0]) });
});

// If a stored avatar_url points to one of our own uploaded files, pull the
// storage key back out so we can delete the old file. External URLs (Google)
// have no "/uploads/" segment and are left alone.
function keyFromUrl(url) {
  if (!url) return null;
  const marker = '/uploads/';
  const i = url.indexOf(marker);
  return i >= 0 ? url.slice(i + marker.length) : null;
}

// POST /api/users/me/avatar  (multipart: image)
const uploadAvatar = asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(400, 'No image uploaded (field name: "image")');

  // Look up the previous avatar so we can clean up our own old file (if any).
  const existing = await query('SELECT avatar_url FROM users WHERE id = $1', [req.user.id]);
  const oldKey = keyFromUrl(existing.rows[0]?.avatar_url);

  const { key } = await storage.save({
    buffer: req.file.buffer,
    originalName: req.file.originalname,
    mimeType: req.file.mimetype,
    folder: 'avatars',
  });

  // Store the full, ready-to-use URL in the single avatar_url field.
  const { rows } = await query(
    'UPDATE users SET avatar_url = $2, updated_at = now() WHERE id = $1 RETURNING *',
    [req.user.id, storage.url(key)]
  );

  if (oldKey) await storage.delete(oldKey).catch(() => {});

  await recordAudit({
    entityType: 'user', entityId: req.user.id, action: 'avatar_set',
    actor: req.user, changes: { avatar_url: storage.url(key) }, countsAsEdit: true,
  });
  res.json({ user: selfUser(rows[0]) });
});

// GET /api/users  (admin only) — list all users, optional ?role= filter.
const listUsers = asyncHandler(async (req, res) => {
  const { role } = req.query;
  const params = [];
  let where = '';
  if (role) {
    params.push(role);
    where = 'WHERE role = $1';
  }
  const { rows } = await query(
    `SELECT * FROM users ${where} ORDER BY created_at DESC LIMIT 200`,
    params
  );
  // Admin needs the phone number + verification audit trail (adminUser), which
  // the public shape hides.
  res.json({ users: rows.map(adminUser) });
});

// PATCH /api/users/:id/verify-phone  (admin only)
// Confirm an owner's phone AFTER a verification call. Body:
//   { phone_verified?: bool (default true), note?: string, proof_key?: string }
// `proof_key` is an OPTIONAL uploaded file (call recording / screenshot / pdf).
const verifyPhone = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { note, proof_key } = req.body || {};
  const verified = req.body?.phone_verified === undefined ? true : !!req.body.phone_verified;

  const { rows: found } = await query('SELECT mobile_number FROM users WHERE id = $1', [id]);
  if (!found[0]) throw new ApiError(404, 'User not found');
  if (verified && !found[0].mobile_number) {
    throw new ApiError(400, 'This owner has not submitted a phone number yet');
  }

  // Persist the proof file (if any) so the background sweep doesn't delete it.
  if (proof_key) await claimKeys(req.user.id, [proof_key]);

  const { rows } = await query(
    `UPDATE users
        SET phone_verified = $2,
            phone_verified_at = CASE WHEN $2 THEN now() ELSE NULL END,
            phone_verify_note = $3,
            phone_verify_proof_key = $4,
            updated_at = now()
      WHERE id = $1
      RETURNING *`,
    [id, verified, note || null, proof_key || null]
  );
  await recordAudit({
    entityType: 'user', entityId: id, action: 'phone_verify', actor: req.user,
    changes: { phone_verified: verified, note: note || null },
  });
  res.json({ user: adminUser(rows[0]) });
});

// PATCH /api/users/:id/block  (admin only) — body { is_blocked: true/false }.
const setBlocked = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { is_blocked } = req.body || {};
  if (id === req.user.id) throw new ApiError(400, 'You cannot block your own account');

  const { rows } = await query('SELECT role FROM users WHERE id = $1', [id]);
  if (!rows[0]) throw new ApiError(404, 'User not found');
  if (rows[0].role === 'admin') throw new ApiError(403, 'Cannot block an admin account');

  const upd = await query(
    'UPDATE users SET is_blocked = $2, updated_at = now() WHERE id = $1 RETURNING *',
    [id, !!is_blocked]
  );
  await recordAudit({
    entityType: 'user', entityId: id, action: is_blocked ? 'block' : 'unblock', actor: req.user,
  });
  res.json({ user: publicUser(upd.rows[0]) });
});

// DELETE /api/users/:id  (admin only) — can't delete yourself or another admin.
const deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (id === req.user.id) throw new ApiError(400, 'You cannot delete your own account');

  const { rows } = await query('SELECT id, role FROM users WHERE id = $1', [id]);
  const target = rows[0];
  if (!target) throw new ApiError(404, 'User not found');
  if (target.role === 'admin') throw new ApiError(403, 'Cannot delete an admin account');

  await query('DELETE FROM users WHERE id = $1', [id]); // cascades to their data
  res.json({ ok: true });
});

module.exports = {
  getUser, updateMe, sendPasswordOtp, sendEmailChangeOtp, changeEmail, becomeOwner, submitPhone, uploadAvatar,
  listUsers, verifyPhone, deleteUser, setBlocked,
};
