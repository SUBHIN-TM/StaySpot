'use strict';

const storage = require('../storage');

// Public-facing user shape (never leak password_hash).
function publicUser(u) {
  if (!u) return null;
  return {
    id: u.id,
    email: u.email,
    username: u.username ?? null,
    name: u.name,
    mobile_number: u.mobile_number ?? null,
    gender: u.gender ?? null,
    occupation: u.occupation ?? null,
    role: u.role,
    is_blocked: u.is_blocked ?? false,
    avatar_url: u.avatar_url ?? null, // single image field (Google pic or uploaded photo URL)
    created_at: u.created_at,
  };
}

// Adds image_url alongside image_key for a property image row.
function propertyImage(img) {
  return {
    id: img.id,
    sort_order: img.sort_order,
    image_key: img.image_key,
    image_url: storage.url(img.image_key),
  };
}

module.exports = { publicUser, propertyImage };
