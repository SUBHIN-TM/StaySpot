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
  const { q, location, user_id, status } = req.query;
  const page = Math.max(1, parseInt(req.query.page || '1', 10));
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit || '20', 10)));
  const offset = (page - 1) * limit;

  const where = [];
  const params = [];
  let i = 1;
  // Status: 'active' or 'closed' filters to one; anything else returns BOTH so
  // seekers can still SEE closed posts (the frontend just disables messaging).
  if (status === 'active') where.push('is_active = TRUE');
  else if (status === 'closed') where.push('is_active = FALSE');
  if (q) { params.push(`%${q}%`); where.push(`(title ILIKE $${i} OR description ILIKE $${i})`); i++; }
  if (location) { params.push(`%${location}%`); where.push(`preferred_location ILIKE $${i++}`); }
  if (user_id) { params.push(user_id); where.push(`user_id = $${i++}`); }

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  params.push(limit, offset);
  const { rows } = await query(
    `SELECT * FROM roommate_posts ${whereSql}
     ORDER BY is_active DESC, created_at DESC LIMIT $${i++} OFFSET $${i++}`,
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

// Allowed values for the new clarifier fields.
const POST_TYPES = ['have_place', 'seeking'];
const BUDGET_BASES = ['per_person', 'total'];
const ROOM_TYPES = ['private', 'shared', 'entire'];
// place_type mirrors the evolving shared property-type list, so it's stored as-is
// (like properties.property_type) rather than validated against a fixed set here.

// POST /api/roommate-posts
const createPost = asyncHandler(async (req, res) => {
  const { title, description, budget, preferred_location, move_in_date, post_type, room_type, place_type, persons, persons_max } = req.body || {};
  if (!title || !String(title).trim()) throw new ApiError(400, 'Title is required');
  if (!POST_TYPES.includes(post_type)) throw new ApiError(400, 'Please choose whether you have a place or are seeking one');
  // room_type & place_type are optional (NULL = "any"); validate only if given.
  const roomVal = ROOM_TYPES.includes(room_type) ? room_type : null;
  const placeVal = place_type ? (String(place_type).trim().toLowerCase() || null) : null;
  if (budget != null && budget !== '' && (!Number.isFinite(Number(budget)) || Number(budget) < 0)) {
    throw new ApiError(400, 'Budget must be 0 or more');
  }
  // "I have a place" posts must say how many people will share — a min (persons)
  // and an optional max (persons_max). Budget is per person.
  const personMin = persons != null && persons !== '' ? parseInt(persons, 10) : null;
  const personMax = persons_max != null && persons_max !== '' ? parseInt(persons_max, 10) : null;
  if (post_type === 'have_place' && (!personMin || personMin < 1)) {
    throw new ApiError(400, 'Tell us how many people will share the place');
  }
  if (personMax != null && personMin != null && personMax < personMin) {
    throw new ApiError(400, 'Maximum people must be greater than or equal to the minimum');
  }
  const { rows } = await query(
    `INSERT INTO roommate_posts
       (user_id, title, description, budget, preferred_location, move_in_date, post_type, budget_basis, room_type, place_type, persons, persons_max)
     VALUES ($1,$2,$3,$4,$5,$6,$7,'per_person',$8,$9,$10,$11) RETURNING *`,
    [
      req.user.id,
      String(title).trim(),
      description || null,
      budget != null && budget !== '' ? Number(budget) : null,
      preferred_location || null,
      move_in_date || null,
      post_type,
      roomVal,
      placeVal,
      personMin,
      personMax,
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

  if (req.body.budget !== undefined && req.body.budget !== '' && req.body.budget !== null && Number(req.body.budget) < 0) {
    throw new ApiError(400, 'Budget must be 0 or more');
  }

  // Validate the enum clarifier fields when present.
  if (req.body.post_type !== undefined && !POST_TYPES.includes(req.body.post_type)) throw new ApiError(400, 'Invalid post type');
  // room_type / place_type may be "" (any) → normalise to null so the CHECK passes.
  if (req.body.room_type === "") req.body.room_type = null;
  if (req.body.place_type === "") req.body.place_type = null;
  if (req.body.room_type != null && !ROOM_TYPES.includes(req.body.room_type)) throw new ApiError(400, 'Invalid room arrangement');

  const fields = ['title', 'description', 'budget', 'preferred_location', 'move_in_date', 'is_active', 'post_type', 'room_type', 'place_type', 'persons', 'persons_max'];
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
