'use strict';

const { query } = require('../config/db');
const { asyncHandler, ApiError } = require('../utils/http');
const { publicUser, propertyImage } = require('../utils/serialize');

// GET /api/favorites  (current user's saved properties)
const listFavorites = asyncHandler(async (req, res) => {
  const { rows } = await query(
    `SELECT p.*, f.created_at AS favorited_at
     FROM favorites f JOIN properties p ON p.id = f.property_id
     WHERE f.user_id = $1
     ORDER BY f.created_at DESC`,
    [req.user.id]
  );

  const properties = await Promise.all(
    rows.map(async (p) => {
      const [imgs, owner] = await Promise.all([
        query('SELECT * FROM property_images WHERE property_id = $1 ORDER BY sort_order', [p.id]),
        query('SELECT * FROM users WHERE id = $1', [p.owner_id]),
      ]);
      return {
        ...p,
        rent_amount: Number(p.rent_amount),
        images: imgs.rows.map(propertyImage),
        owner: publicUser(owner.rows[0]),
      };
    })
  );
  res.json({ properties });
});

// POST /api/favorites/:propertyId
const addFavorite = asyncHandler(async (req, res) => {
  const prop = await query('SELECT id FROM properties WHERE id = $1', [req.params.propertyId]);
  if (!prop.rows[0]) throw new ApiError(404, 'Property not found');
  await query(
    `INSERT INTO favorites (user_id, property_id) VALUES ($1, $2)
     ON CONFLICT (user_id, property_id) DO NOTHING`,
    [req.user.id, req.params.propertyId]
  );
  res.status(201).json({ ok: true });
});

// DELETE /api/favorites/:propertyId
const removeFavorite = asyncHandler(async (req, res) => {
  await query('DELETE FROM favorites WHERE user_id = $1 AND property_id = $2', [
    req.user.id,
    req.params.propertyId,
  ]);
  res.json({ ok: true });
});

module.exports = { listFavorites, addFavorite, removeFavorite };
