'use strict';

const { query, withTransaction } = require('../config/db');
const storage = require('../storage');
const { asyncHandler, ApiError } = require('../utils/http');
const { publicUser, propertyImage } = require('../utils/serialize');
const { getBool } = require('../services/settings');
const { claimKeys } = require('../services/pendingUploads');
const { resolveLocality } = require('../services/localities');
const { recordAudit, diffChanges } = require('../services/audit');
const geo = require('../config/geo');

// Validate + normalise the canonical location fields from a request body.
// Returns { state, district, pincode } with the district in its canonical
// spelling. Throws ApiError(400) on bad input. Free-text fields (city/locality,
// landmark, address) are not validated here.
function normalizeLocation(body) {
  const state = body.state || geo.DEFAULT_STATE;
  if (!geo.isValidState(state)) throw new ApiError(400, `Unknown state: ${state}`);

  let district = null;
  if (body.district) {
    district = geo.canonicalDistrict(state, body.district);
    if (!district) throw new ApiError(400, `Invalid district for ${state}: ${body.district}`);
  }

  let pincode = null;
  if (body.pincode != null && body.pincode !== '') {
    pincode = String(body.pincode).trim();
    if (!/^\d{6}$/.test(pincode)) throw new ApiError(400, 'Pincode must be 6 digits');
  }

  return { state, district, pincode };
}

// Assemble a property row with its images + owner summary.
// `forAdmin` exposes the internal field-visit proof/remarks; the public version
// strips them (only the `field_visited` flag is public — it drives the badge).
async function hydrate(propertyRow, { forAdmin = false } = {}) {
  const [images, owner] = await Promise.all([
    query('SELECT * FROM property_images WHERE property_id = $1 ORDER BY sort_order, created_at', [
      propertyRow.id,
    ]),
    query('SELECT * FROM users WHERE id = $1', [propertyRow.owner_id]),
  ]);
  const data = {
    ...propertyRow,
    rent_amount: Number(propertyRow.rent_amount),
    video_url: propertyRow.video_key ? storage.url(propertyRow.video_key) : null,
    images: images.rows.map(propertyImage),
    owner: publicUser(owner.rows[0]), // includes owner.phone_verified, never the number
  };

  // Field-visit proof + remarks are internal — only admins may see them.
  if (forAdmin) {
    const keys = Array.isArray(propertyRow.field_visit_proof_keys)
      ? propertyRow.field_visit_proof_keys
      : [];
    data.field_visit_proof_urls = keys.map((k) => storage.url(k));
  } else {
    delete data.field_visit_remarks;
    delete data.field_visit_proof_keys;
  }
  return data;
}

// GET /api/properties
// Query params: q, city, district, property_type, min_rent, max_rent,
//               lat, lng, radius_km (radius search), owner_id, page, limit
const listProperties = asyncHandler(async (req, res) => {
  const {
    q,
    city,
    district,
    property_type,
    min_rent,
    max_rent,
    lat,
    lng,
    radius_km,
    owner_id,
    occupancy_status,
    furnishing,
    amenities,
    sort,
  } = req.query;

  const page = Math.max(1, parseInt(req.query.page || '1', 10));
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit || '20', 10)));
  const offset = (page - 1) * limit;

  // Public list shows only available, admin-approved AND not-deleted listings.
  const where = ['p.deleted_at IS NULL', 'p.is_available = TRUE', "p.approval_status = 'approved'"];
  const params = [];
  let i = 1;

  if (q) {
    params.push(`%${q}%`);
    where.push(`(p.title ILIKE $${i} OR p.description ILIKE $${i} OR p.address ILIKE $${i})`);
    i++;
  }
  if (city) { params.push(city); where.push(`p.city ILIKE $${i++}`); }
  if (district) { params.push(district); where.push(`p.district ILIKE $${i++}`); }
  if (property_type) { params.push(property_type); where.push(`p.property_type = $${i++}`); }
  if (min_rent) { params.push(Number(min_rent)); where.push(`p.rent_amount >= $${i++}`); }
  if (max_rent) { params.push(Number(max_rent)); where.push(`p.rent_amount <= $${i++}`); }
  if (owner_id) { params.push(owner_id); where.push(`p.owner_id = $${i++}`); }
  if (occupancy_status) { params.push(occupancy_status); where.push(`p.occupancy_status = $${i++}`); }
  if (furnishing) { params.push(furnishing); where.push(`p.furnishing = $${i++}`); }

  // Amenities: comma-separated list; keep listings that have ALL of them
  // (Postgres array containment, p.amenities @> selected).
  const amenityList = String(amenities || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  if (amenityList.length) {
    params.push(amenityList);
    where.push(`p.amenities @> $${i++}::text[]`);
  }

  // Radius search via the Haversine formula (km). Requires lat, lng, radius_km.
  let distanceSelect = '';
  let orderBy = 'p.created_at DESC';
  const hasGeo = lat && lng && radius_km;
  if (hasGeo) {
    const latNum = Number(lat);
    const lngNum = Number(lng);
    const radius = Number(radius_km);
    params.push(latNum, lngNum); // $lat, $lng
    const latIdx = i++;
    const lngIdx = i++;
    distanceSelect = `,
      (6371 * acos(
        cos(radians($${latIdx})) * cos(radians(p.latitude)) *
        cos(radians(p.longitude) - radians($${lngIdx})) +
        sin(radians($${latIdx})) * sin(radians(p.latitude))
      )) AS distance_km`;
    where.push('p.latitude IS NOT NULL AND p.longitude IS NOT NULL');
    params.push(radius);
    where.push(`(6371 * acos(
        cos(radians($${latIdx})) * cos(radians(p.latitude)) *
        cos(radians(p.longitude) - radians($${lngIdx})) +
        sin(radians($${latIdx})) * sin(radians(p.latitude))
      )) <= $${i++}`);
    orderBy = 'distance_km ASC';
  } else if (sort === 'price_low') {
    orderBy = 'p.rent_amount ASC, p.created_at DESC';
  } else if (sort === 'price_high') {
    orderBy = 'p.rent_amount DESC, p.created_at DESC';
  }
  // (default stays newest-first: p.created_at DESC)

  params.push(limit, offset);
  const sql = `
    SELECT p.*${distanceSelect}
    FROM properties p
    WHERE ${where.join(' AND ')}
    ORDER BY ${orderBy}
    LIMIT $${i++} OFFSET $${i++}`;

  const { rows } = await query(sql, params);
  const data = await Promise.all(rows.map(hydrate));
  res.json({ page, limit, count: data.length, properties: data });
});

// GET /api/properties/:id
const getProperty = asyncHandler(async (req, res) => {
  const { rows } = await query(
    'SELECT * FROM properties WHERE id = $1 AND deleted_at IS NULL',
    [req.params.id]
  );
  if (!rows[0]) throw new ApiError(404, 'Property not found');
  res.json({ property: await hydrate(rows[0]) });
});

// GET /api/properties/all  (admin: every property, incl. unavailable)
// ?include_deleted=1 also returns soft-deleted listings (each keeps its
// deleted_at so the admin UI can flag them).
const listAll = asyncHandler(async (req, res) => {
  const includeDeleted = ['1', 'true', 'yes'].includes(
    String(req.query.include_deleted || '').toLowerCase()
  );
  const where = includeDeleted ? '' : 'WHERE deleted_at IS NULL';
  const { rows } = await query(
    `SELECT * FROM properties ${where} ORDER BY created_at DESC LIMIT 200`
  );
  const data = await Promise.all(rows.map((r) => hydrate(r, { forAdmin: true })));
  res.json({ properties: data });
});

// GET /api/properties/mine  (owner: ALL their properties, incl. unavailable)
const listMine = asyncHandler(async (req, res) => {
  const { rows } = await query(
    'SELECT * FROM properties WHERE owner_id = $1 AND deleted_at IS NULL ORDER BY created_at DESC',
    [req.user.id]
  );
  const data = await Promise.all(rows.map(hydrate));
  res.json({ properties: data });
});

// POST /api/properties  (owner only)
const createProperty = asyncHandler(async (req, res) => {
  const {
    title, description, property_type, rent_amount,
    latitude, longitude, address, city,
    map_link, max_persons, occupancy_status, landmark,
    furnishing, pets_allowed, electricity_billing, preferred_tenant, food_included,
  } = req.body || {};

  if (!title || !String(title).trim()) throw new ApiError(400, 'Title is required');

  // Amenities is a free multi-select list — keep only non-empty strings.
  // The policy/furnishing fields are optional single-selects: '' means "not set".
  const amenities = Array.isArray(req.body?.amenities)
    ? req.body.amenities.filter((a) => typeof a === 'string' && a.trim())
    : [];
  const orNull = (v) => (v === '' || v == null ? null : v);

  // Numbers can't be negative.
  const rent = rent_amount != null && rent_amount !== '' ? Number(rent_amount) : 0;
  if (!Number.isFinite(rent) || rent < 0) throw new ApiError(400, 'Rent must be 0 or more');
  const persons = max_persons != null && max_persons !== '' ? parseInt(max_persons, 10) : null;
  if (persons != null && (!Number.isFinite(persons) || persons < 0)) {
    throw new ApiError(400, 'Max persons must be 0 or more');
  }

  // Canonical location (state/district/pincode) — validated + normalised.
  const { state, district, pincode } = normalizeLocation(req.body || {});
  if (!pincode) throw new ApiError(400, 'Pincode is required');
  if (!district) throw new ApiError(400, 'District is required');

  // Canonicalise the locality (dedupes case/whitespace, reuses an existing one).
  // Scoped to the pincode so it only appears under that pincode.
  const cityValue = city ? await resolveLocality(state, district, pincode, city) : null;

  // If the admin enabled auto-approval, new listings go live immediately —
  // BUT only for phone-verified owners. An unverified owner's listing always
  // stays "pending" (it can't be approved until they're verified anyway), so
  // auto-approve never bypasses the trust gate.
  const autoApprove = await getBool('auto_approve_listings', false);
  const ownerRow = await query('SELECT phone_verified FROM users WHERE id = $1', [req.user.id]);
  const ownerVerified = !!ownerRow.rows[0]?.phone_verified;
  const approval = autoApprove && ownerVerified ? 'approved' : 'pending';

  const { rows } = await query(
    `INSERT INTO properties
       (owner_id, title, description, property_type, rent_amount,
        latitude, longitude, address, state, district, city, pincode, landmark,
        map_link, max_persons, occupancy_status, approval_status,
        amenities, furnishing, pets_allowed, electricity_billing, preferred_tenant, food_included)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,
             $18,$19,$20,$21,$22,$23)
     RETURNING *`,
    [
      req.user.id,
      String(title).trim(),
      description || null,
      property_type || 'room',
      rent,
      latitude != null ? Number(latitude) : null,
      longitude != null ? Number(longitude) : null,
      address || null,
      state,
      district,
      cityValue,
      pincode,
      landmark || null,
      map_link || null,
      persons,
      occupancy_status || 'available',
      approval,
      amenities,
      orNull(furnishing),
      orNull(pets_allowed),
      orNull(electricity_billing),
      orNull(preferred_tenant),
      orNull(food_included),
    ]
  );

  res.status(201).json({ property: await hydrate(rows[0]) });
});

// PATCH /api/properties/:id/approval  (admin) — approve / reject / reset.
// A listing can only be APPROVED (made public) once its owner's phone has been
// verified — this is the gate the admin must clear first.
const setApproval = asyncHandler(async (req, res) => {
  const { approval_status } = req.body || {};
  if (!['approved', 'rejected', 'pending'].includes(approval_status)) {
    throw new ApiError(400, 'approval_status must be approved, rejected, or pending');
  }

  const existing = await query(
    'SELECT owner_id, approval_status FROM properties WHERE id = $1 AND deleted_at IS NULL',
    [req.params.id]
  );
  if (!existing.rows[0]) throw new ApiError(404, 'Property not found');

  if (approval_status === 'approved') {
    const owner = await query('SELECT phone_verified FROM users WHERE id = $1', [
      existing.rows[0].owner_id,
    ]);
    if (!owner.rows[0]?.phone_verified) {
      throw new ApiError(400, 'Verify the owner’s phone before approving this listing');
    }
  }

  const { rows } = await query(
    'UPDATE properties SET approval_status = $2, updated_at = now() WHERE id = $1 RETURNING *',
    [req.params.id, approval_status]
  );
  // Audit (admin moderation — doesn't count toward the owner's edit_count).
  await recordAudit({
    entityType: 'property', entityId: req.params.id, action: 'approval', actor: req.user,
    changes: { approval_status: { before: existing.rows[0].approval_status, after: approval_status } },
  });
  res.json({ property: await hydrate(rows[0], { forAdmin: true }) });
});

// PATCH /api/properties/:id/field-visit  (admin)
// Record that our team physically visited the place. Body:
//   { field_visited?: bool (default true), remarks?: string, proof_keys?: [key, …] }
// Proof files (photos / video / audio) are uploaded direct-to-storage first;
// here we just attach their keys (claimed so the sweep leaves them alone).
const setFieldVisit = asyncHandler(async (req, res) => {
  const { remarks } = req.body || {};
  const visited = req.body?.field_visited === undefined ? true : !!req.body.field_visited;
  const proofKeys = Array.isArray(req.body?.proof_keys) ? req.body.proof_keys.filter(Boolean) : [];

  const existing = await query(
    'SELECT id FROM properties WHERE id = $1 AND deleted_at IS NULL',
    [req.params.id]
  );
  if (!existing.rows[0]) throw new ApiError(404, 'Property not found');

  const updated = await withTransaction(async (client) => {
    const exec = (text, params) => client.query(text, params);
    if (proofKeys.length) await claimKeys(req.user.id, proofKeys, exec);
    const { rows } = await client.query(
      `UPDATE properties
          SET field_visited = $2,
              field_visit_at = CASE WHEN $2 THEN now() ELSE NULL END,
              field_visit_remarks = $3,
              field_visit_proof_keys = $4::jsonb,
              visit_requested = CASE WHEN $2 THEN FALSE ELSE visit_requested END,
              updated_at = now()
        WHERE id = $1
        RETURNING *`,
      [req.params.id, visited, remarks || null, JSON.stringify(proofKeys)]
    );
    return rows[0];
  });

  await recordAudit({
    entityType: 'property', entityId: req.params.id, action: 'field_visit', actor: req.user,
    changes: { field_visited: visited, remarks: remarks || null, proof_count: proofKeys.length },
  });
  res.json({ property: await hydrate(updated, { forAdmin: true }) });
});

// POST /api/properties/:id/request-visit  (owner)
// Owner asks us to prioritise the field visit that earns the "Verified" badge.
// Flags the listing and notifies every admin. Idempotent.
const requestVisit = asyncHandler(async (req, res) => {
  const property = await loadOwnedProperty(req.params.id, req.user);
  // Already visited/verified — nothing to request.
  if (property.field_visited) {
    return res.json({ property: await hydrate(property) });
  }

  const { rows } = await query(
    `UPDATE properties
        SET visit_requested = TRUE, visit_requested_at = now(), updated_at = now()
      WHERE id = $1
      RETURNING *`,
    [req.params.id]
  );

  // Notify all admins (best-effort — don't fail the request if this hiccups).
  try {
    const [owner, admins] = await Promise.all([
      query('SELECT name FROM users WHERE id = $1', [req.user.id]),
      query("SELECT id FROM users WHERE role = 'admin'"),
    ]);
    const ownerName = owner.rows[0]?.name || 'An owner';
    for (const a of admins.rows) {
      await query(
        `INSERT INTO notifications (user_id, title, message, type, data)
         VALUES ($1, $2, $3, 'general', $4)`,
        [
          a.id,
          'Field visit requested',
          `${ownerName} requested verification for "${property.title}"`,
          JSON.stringify({ property_id: property.id }),
        ]
      );
    }
  } catch (err) {
    console.error('visit-request notification failed:', err.message);
  }

  await recordAudit({
    entityType: 'property', entityId: property.id, action: 'visit_request',
    actor: req.user, countsAsEdit: true,
  });
  res.json({ property: await hydrate(rows[0]) });
});

// Ensure the property exists and belongs to the requester (or requester is admin).
async function loadOwnedProperty(id, user) {
  const { rows } = await query(
    'SELECT * FROM properties WHERE id = $1 AND deleted_at IS NULL',
    [id]
  );
  const property = rows[0];
  if (!property) throw new ApiError(404, 'Property not found');
  if (property.owner_id !== user.id && user.role !== 'admin') {
    throw new ApiError(403, 'You do not own this property');
  }
  return property;
}

// PATCH /api/properties/:id
const updateProperty = asyncHandler(async (req, res) => {
  const owned = await loadOwnedProperty(req.params.id, req.user);

  // Numbers can't be negative.
  if (req.body.rent_amount !== undefined && req.body.rent_amount !== '' && Number(req.body.rent_amount) < 0) {
    throw new ApiError(400, 'Rent must be 0 or more');
  }
  if (req.body.max_persons !== undefined && req.body.max_persons !== '' && req.body.max_persons !== null && Number(req.body.max_persons) < 0) {
    throw new ApiError(400, 'Max persons must be 0 or more');
  }

  // Validate/normalise any canonical location fields being changed, and write
  // the normalised values back so the generic field loop persists them.
  if (req.body.state !== undefined || req.body.district !== undefined || req.body.pincode !== undefined) {
    const norm = normalizeLocation(req.body);
    if (req.body.state !== undefined) req.body.state = norm.state;
    if (req.body.district !== undefined) req.body.district = norm.district;
    if (req.body.pincode !== undefined) req.body.pincode = norm.pincode;
  }

  // Canonicalise the locality (dedupe) before it's written, scoped to the pincode
  // it'll end up with (the one being set, or the existing one).
  if (req.body.city) {
    const dist = req.body.district !== undefined ? req.body.district : owned.district;
    const st = req.body.state !== undefined ? req.body.state : owned.state;
    const pin = req.body.pincode !== undefined ? req.body.pincode : owned.pincode;
    if (pin) req.body.city = await resolveLocality(st, dist, pin, req.body.city);
  }

  // Amenities/policy normalisation: '' on a single-select means "not set" → NULL
  // (so it doesn't break the CHECK constraints), and amenities must be a clean
  // string array.
  for (const f of ['furnishing', 'pets_allowed', 'electricity_billing', 'preferred_tenant', 'food_included']) {
    if (req.body[f] === '') req.body[f] = null;
  }
  if (req.body.amenities !== undefined) {
    req.body.amenities = Array.isArray(req.body.amenities)
      ? req.body.amenities.filter((a) => typeof a === 'string' && a.trim())
      : [];
  }

  const fields = [
    'title', 'description', 'property_type', 'rent_amount',
    'latitude', 'longitude', 'address', 'state', 'district', 'city', 'pincode',
    'landmark', 'is_available', 'map_link', 'max_persons', 'occupancy_status',
    'amenities', 'furnishing', 'pets_allowed', 'electricity_billing', 'preferred_tenant', 'food_included',
  ];
  const sets = [];
  const params = [req.params.id];
  let i = 2;
  for (const f of fields) {
    if (req.body[f] !== undefined) {
      sets.push(`${f} = $${i++}`);
      params.push(req.body[f]);
    }
  }
  if (!sets.length) throw new ApiError(400, 'No updatable fields provided');
  sets.push('updated_at = now()');

  const { rows } = await query(
    `UPDATE properties SET ${sets.join(', ')} WHERE id = $1 RETURNING *`,
    params
  );

  // Audit: log the field-level before/after diff for admin review.
  const changes = diffChanges(owned, req.body, fields);
  if (Object.keys(changes).length) {
    await recordAudit({
      entityType: 'property', entityId: req.params.id, action: 'update',
      actor: req.user, changes, countsAsEdit: true,
    });
  }

  res.json({ property: await hydrate(rows[0]) });
});

// DELETE /api/properties/:id
// Soft delete: we DON'T remove the row or its image/video files. We just stamp
// deleted_at so it disappears from every listing (public, owner, admin) while
// staying recoverable. (loadOwnedProperty already 404s on an already-deleted one.)
const deleteProperty = asyncHandler(async (req, res) => {
  await loadOwnedProperty(req.params.id, req.user);
  await query(
    'UPDATE properties SET deleted_at = now(), updated_at = now() WHERE id = $1',
    [req.params.id]
  );
  await recordAudit({
    entityType: 'property', entityId: req.params.id, action: 'delete', actor: req.user,
  });
  res.json({ ok: true });
});

// POST /api/properties/:id/images   body: { keys: [storageKey, …] }
// The browser already uploaded the files straight to storage (see uploadController);
// here we just attach the resulting object keys to the property. No bytes pass
// through this request, so the transaction only does fast DB work.
const uploadImages = asyncHandler(async (req, res) => {
  await loadOwnedProperty(req.params.id, req.user);
  const keys = Array.isArray(req.body.keys) ? req.body.keys.filter(Boolean) : [];
  if (!keys.length) throw new ApiError(400, 'No image keys provided (field: "keys")');

  const saved = await withTransaction(async (client) => {
    const exec = (text, params) => client.query(text, params);
    // Claim the objects so the orphan sweep leaves them alone (atomic with the inserts).
    await claimKeys(req.user.id, keys, exec);

    // Continue sort_order from the current max.
    const max = await client.query(
      'SELECT COALESCE(MAX(sort_order), -1) AS m FROM property_images WHERE property_id = $1',
      [req.params.id]
    );
    let order = max.rows[0].m + 1;
    const out = [];
    for (const key of keys) {
      const ins = await client.query(
        `INSERT INTO property_images (property_id, image_key, sort_order)
         VALUES ($1, $2, $3) RETURNING *`,
        [req.params.id, key, order++]
      );
      out.push(ins.rows[0]);
    }
    return out;
  });

  await recordAudit({
    entityType: 'property', entityId: req.params.id, action: 'image_add', actor: req.user,
    changes: { count: keys.length, urls: keys.map((k) => storage.url(k)) }, countsAsEdit: true,
  });
  res.status(201).json({ images: saved.map(propertyImage) });
});

// POST /api/properties/:id/video   body: { key: storageKey }
// The browser already uploaded the video straight to storage; attach its key.
const uploadVideo = asyncHandler(async (req, res) => {
  const property = await loadOwnedProperty(req.params.id, req.user);
  const key = req.body && req.body.key;
  if (!key) throw new ApiError(400, 'No video key provided (field: "key")');

  const oldKey = property.video_key;
  const updated = await withTransaction(async (client) => {
    const exec = (text, params) => client.query(text, params);
    await claimKeys(req.user.id, [key], exec);
    const { rows } = await client.query(
      'UPDATE properties SET video_key = $2, updated_at = now() WHERE id = $1 RETURNING *',
      [req.params.id, key]
    );
    return rows[0];
  });

  // Drop the previous video file after the swap commits (best-effort).
  if (oldKey && oldKey !== key) await storage.delete(oldKey).catch(() => {});
  await recordAudit({
    entityType: 'property', entityId: req.params.id, action: 'video_set', actor: req.user,
    changes: { url: storage.url(key) }, countsAsEdit: true,
  });
  res.status(201).json({ property: await hydrate(updated) });
});

// DELETE /api/properties/:id/images/:imageId
const deleteImage = asyncHandler(async (req, res) => {
  await loadOwnedProperty(req.params.id, req.user);
  const { rows } = await query(
    'DELETE FROM property_images WHERE id = $1 AND property_id = $2 RETURNING image_key',
    [req.params.imageId, req.params.id]
  );
  if (!rows[0]) throw new ApiError(404, 'Image not found');
  await storage.delete(rows[0].image_key).catch(() => {});
  await recordAudit({
    entityType: 'property', entityId: req.params.id, action: 'image_remove', actor: req.user,
    changes: { image_id: req.params.imageId, image_key: rows[0].image_key }, countsAsEdit: true,
  });
  res.json({ ok: true });
});

// PATCH /api/properties/:id/images/order  body: { order: [imageId, …] }
// Re-numbers sort_order to match the given order. Index 0 = the cover photo
// (shown first to seekers). Ids not belonging to this property are ignored.
const reorderImages = asyncHandler(async (req, res) => {
  await loadOwnedProperty(req.params.id, req.user);
  const order = Array.isArray(req.body.order) ? req.body.order : [];
  if (!order.length) throw new ApiError(400, 'No image order provided (field: "order")');

  await withTransaction(async (client) => {
    for (let i = 0; i < order.length; i++) {
      await client.query(
        'UPDATE property_images SET sort_order = $1 WHERE id = $2 AND property_id = $3',
        [i, order[i], req.params.id]
      );
    }
  });

  const { rows } = await query(
    'SELECT * FROM property_images WHERE property_id = $1 ORDER BY sort_order, created_at',
    [req.params.id]
  );
  res.json({ images: rows.map(propertyImage) });
});

module.exports = {
  listProperties, listAll, listMine, getProperty, createProperty, updateProperty,
  setApproval, setFieldVisit, requestVisit, deleteProperty, uploadImages, uploadVideo, deleteImage, reorderImages,
};
