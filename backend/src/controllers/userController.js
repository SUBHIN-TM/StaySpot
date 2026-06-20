'use strict';

const { query } = require('../config/db');
const storage = require('../storage');
const { hashPassword } = require('../utils/password');
const { asyncHandler, ApiError } = require('../utils/http');
const { publicUser } = require('../utils/serialize');

// GET /api/users/:id  (public profile)
const getUser = asyncHandler(async (req, res) => {
  const { rows } = await query('SELECT * FROM users WHERE id = $1', [req.params.id]);
  if (!rows[0]) throw new ApiError(404, 'User not found');
  res.json({ user: publicUser(rows[0]) });
});

// PATCH /api/users/me  (update own profile)
// Editable: name, username, password (all optional — only sent fields change).
const updateMe = asyncHandler(async (req, res) => {
  const { name, username, password, gender, occupation } = req.body || {};

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

  // If changing the password, validate and hash it.
  let password_hash = null;
  if (password) {
    if (String(password).length < 6)
      throw new ApiError(400, 'Password must be at least 6 characters');
    password_hash = await hashPassword(String(password));
  }

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
  res.json({ user: publicUser(rows[0]) });
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

  res.json({ user: publicUser(rows[0]) });
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
  res.json({ users: rows.map(publicUser) });
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

module.exports = { getUser, updateMe, uploadAvatar, listUsers, deleteUser, setBlocked };
