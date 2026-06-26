'use strict';

const { query } = require('../config/db');
const { asyncHandler, ApiError } = require('../utils/http');
const { publicUser } = require('../utils/serialize');

// Shape one review row (joined with its author) for the API.
function shape(r, userRow) {
  return {
    id: r.id,
    rating: r.rating,
    comment: r.comment,
    created_at: r.created_at,
    updated_at: r.updated_at,
    user: publicUser(userRow),
  };
}

// GET /api/reviews  — public list of recent reviews + count/average.
const listReviews = asyncHandler(async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 12, 50);
  const { rows } = await query(
    `SELECT r.*, row_to_json(u) AS author
     FROM reviews r
     JOIN users u ON u.id = r.user_id
     WHERE COALESCE(u.is_blocked, false) = false
     ORDER BY r.updated_at DESC, r.created_at DESC
     LIMIT $1`,
    [limit]
  );

  const reviews = rows.map((r) => shape(r, r.author));

  const agg = await query(
    'SELECT count(*)::int AS n, COALESCE(avg(rating), 0)::numeric(10,2) AS avg FROM reviews'
  );

  res.json({
    reviews,
    count: agg.rows[0].n,
    average: Number(agg.rows[0].avg),
  });
});

// POST /api/reviews  — create or update the current user's review (one each).
const upsertReview = asyncHandler(async (req, res) => {
  const rating = Number(req.body.rating);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw new ApiError(400, 'Rating must be a whole number from 1 to 5.');
  }
  let comment = (req.body.comment || '').trim();
  if (comment.length < 3) throw new ApiError(400, 'Please write a short comment.');
  if (comment.length > 600) comment = comment.slice(0, 600);

  const { rows } = await query(
    `INSERT INTO reviews (user_id, rating, comment)
     VALUES ($1, $2, $3)
     ON CONFLICT (user_id)
     DO UPDATE SET rating = EXCLUDED.rating, comment = EXCLUDED.comment, updated_at = now()
     RETURNING *`,
    [req.user.id, rating, comment]
  );

  const u = await query('SELECT * FROM users WHERE id = $1', [req.user.id]);
  res.status(201).json({ review: shape(rows[0], u.rows[0]) });
});

module.exports = { listReviews, upsertReview };
