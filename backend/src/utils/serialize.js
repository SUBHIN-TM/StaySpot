'use strict';

const storage = require('../storage');

// Public-facing user shape (never leak password_hash).
// NOTE: mobile_number is intentionally NOT here — a phone number must never be
// exposed to the public (it's collected only for admin verification). Use
// selfUser() for the account owner, or adminUser() for the admin panel.
// `phone_verified` is safe to expose: it drives the green ✓ tick by the owner's
// name without revealing the number itself.
function publicUser(u) {
  if (!u) return null;
  return {
    id: u.id,
    email: u.email,
    username: u.username ?? null,
    name: u.name,
    gender: u.gender ?? null,
    occupation: u.occupation ?? null,
    role: u.role,
    is_blocked: u.is_blocked ?? false,
    avatar_url: u.avatar_url ?? null, // single image field (Google pic or uploaded photo URL)
    phone_verified: u.phone_verified ?? false,
    created_at: u.created_at,
  };
}

// The account owner viewing their OWN profile — adds their own phone number
// (so they can see/edit it), which publicUser deliberately omits for everyone else.
function selfUser(u) {
  if (!u) return null;
  return { ...publicUser(u), mobile_number: u.mobile_number ?? null };
}

// Admin view — full contact details plus the phone-verification audit trail.
function adminUser(u) {
  if (!u) return null;
  return {
    ...publicUser(u),
    mobile_number: u.mobile_number ?? null,
    phone_verified_at: u.phone_verified_at ?? null,
    phone_verify_note: u.phone_verify_note ?? null,
    phone_verify_proof_url: u.phone_verify_proof_key ? storage.url(u.phone_verify_proof_key) : null,
    updated_at: u.updated_at ?? null, // for admin "recently edited" sorting
    edit_count: u.edit_count ?? 0,
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

module.exports = { publicUser, selfUser, adminUser, propertyImage };
