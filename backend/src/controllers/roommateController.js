'use strict';

const { query } = require('../config/db');
const { asyncHandler, ApiError } = require('../utils/http');
const { publicUser } = require('../utils/serialize');

async function hydrate(row) {
  const u = await query('SELECT * FROM users WHERE id = $1', [row.user_id]);
  return { ...row, budget: row.budget != null ? Number(row.budget) : null, user: publicUser(u.rows[0]) };
}

// GET /api/roommate-posts
const listPosts = asyncHandler(async (req, res) => {
  const { q, location, user_id } = req.query;
  const page = Math.max(1, parseInt(req.query.page || '1', 10));
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit || '20', 10)));
  const offset = (page - 1) * limit;

  const where = ['is_active = TRUE'];
  const params = [];
  let i = 1;
  if (q) { params.push(`%${q}%`); where.push(`(title ILIKE $${i} OR description ILIKE $${i})`); i++; }
  if (location) { params.push(`%${location}%`); where.push(`preferred_location ILIKE $${i++}`); }
  if (user_id) { params.push(user_id); where.push(`user_id = $${i++}`); }

  params.push(limit, offset);
  const { rows } = await query(
    `SELECT * FROM roommate_posts WHERE ${where.join(' AND ')}
     ORDER BY created_at DESC LIMIT $${i++} OFFSET $${i++}`,
    params
  );
  res.json({ page, limit, posts: await Promise.all(rows.map(hydrate)) });
});

// GET /api/roommate-posts/:id
const getPost = asyncHandler(async (req, res) => {
  const { rows } = await query('SELECT * FROM roommate_posts WHERE id = $1', [req.params.id]);
  if (!rows[0]) throw new ApiError(404, 'Post not found');
  res.json({ post: await hydrate(rows[0]) });
});

// POST /api/roommate-posts
const createPost = asyncHandler(async (req, res) => {
  const { title, description, budget, preferred_location, move_in_date } = req.body || {};
  if (!title || !String(title).trim()) throw new ApiError(400, 'Title is required');
  const { rows } = await query(
    `INSERT INTO roommate_posts (user_id, title, description, budget, preferred_location, move_in_date)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [
      req.user.id,
      String(title).trim(),
      description || null,
      budget != null ? Number(budget) : null,
      preferred_location || null,
      move_in_date || null,
    ]
  );
  res.status(201).json({ post: await hydrate(rows[0]) });
});

// PATCH /api/roommate-posts/:id
const updatePost = asyncHandler(async (req, res) => {
  const owned = await query('SELECT * FROM roommate_posts WHERE id = $1', [req.params.id]);
  if (!owned.rows[0]) throw new ApiError(404, 'Post not found');
  if (owned.rows[0].user_id !== req.user.id && req.user.role !== 'admin')
    throw new ApiError(403, 'Not your post');

  const fields = ['title', 'description', 'budget', 'preferred_location', 'move_in_date', 'is_active'];
  const sets = [];
  const params = [req.params.id];
  let i = 2;
  for (const f of fields) {
    if (req.body[f] !== undefined) { sets.push(`${f} = $${i++}`); params.push(req.body[f]); }
  }
  if (!sets.length) throw new ApiError(400, 'No updatable fields provided');
  sets.push('updated_at = now()');
  const { rows } = await query(
    `UPDATE roommate_posts SET ${sets.join(', ')} WHERE id = $1 RETURNING *`,
    params
  );
  res.json({ post: await hydrate(rows[0]) });
});

// DELETE /api/roommate-posts/:id
const deletePost = asyncHandler(async (req, res) => {
  const owned = await query('SELECT user_id FROM roommate_posts WHERE id = $1', [req.params.id]);
  if (!owned.rows[0]) throw new ApiError(404, 'Post not found');
  if (owned.rows[0].user_id !== req.user.id && req.user.role !== 'admin')
    throw new ApiError(403, 'Not your post');
  await query('DELETE FROM roommate_posts WHERE id = $1', [req.params.id]);
  res.json({ ok: true });
});

module.exports = { listPosts, getPost, createPost, updatePost, deletePost };
