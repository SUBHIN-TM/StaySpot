'use strict';

const { query } = require('../config/db');
const storage = require('../storage');
const { asyncHandler, ApiError } = require('../utils/http');
const { publicUser } = require('../utils/serialize');

// GET /api/users/:id  (public profile)
const getUser = asyncHandler(async (req, res) => {
  const { rows } = await query('SELECT * FROM users WHERE id = $1', [req.params.id]);
  if (!rows[0]) throw new ApiError(404, 'User not found');
  res.json({ user: publicUser(rows[0]) });
});

// PATCH /api/users/me  (update own profile)
const updateMe = asyncHandler(async (req, res) => {
  const { name, gender, occupation, mobile_number } = req.body || {};

  const { rows } = await query(
    `UPDATE users SET
       name          = COALESCE($2, name),
       gender        = COALESCE($3, gender),
       occupation    = COALESCE($4, occupation),
       mobile_number = COALESCE($5, mobile_number),
       updated_at    = now()
     WHERE id = $1
     RETURNING *`,
    [req.user.id, name ?? null, gender ?? null, occupation ?? null, mobile_number ?? null]
  );
  res.json({ user: publicUser(rows[0]) });
});

// POST /api/users/me/avatar  (multipart: image)
const uploadAvatar = asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(400, 'No image uploaded (field name: "image")');

  // Remove previous avatar from storage if any.
  const existing = await query('SELECT profile_image FROM users WHERE id = $1', [req.user.id]);
  const oldKey = existing.rows[0]?.profile_image;

  const { key } = await storage.save({
    buffer: req.file.buffer,
    originalName: req.file.originalname,
    mimeType: req.file.mimetype,
    folder: 'avatars',
  });

  const { rows } = await query(
    'UPDATE users SET profile_image = $2, updated_at = now() WHERE id = $1 RETURNING *',
    [req.user.id, key]
  );

  if (oldKey) await storage.delete(oldKey).catch(() => {});

  res.json({ user: publicUser(rows[0]) });
});

module.exports = { getUser, updateMe, uploadAvatar };
