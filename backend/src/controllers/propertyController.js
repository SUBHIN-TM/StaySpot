'use strict';

const { query, withTransaction } = require('../config/db');
const storage = require('../storage');
const { asyncHandler, ApiError } = require('../utils/http');
const { publicUser, propertyImage } = require('../utils/serialize');

// Assemble a property row with its images + owner summary.
async function hydrate(propertyRow) {
  const [images, owner] = await Promise.all([
    query('SELECT * FROM property_images WHERE property_id = $1 ORDER BY sort_order, created_at', [
      propertyRow.id,
    ]),
    query('SELECT * FROM users WHERE id = $1', [propertyRow.owner_id]),
  ]);
  return {
    ...propertyRow,
    rent_amount: Number(propertyRow.rent_amount),
    images: images.rows.map(propertyImage),
    owner: publicUser(owner.rows[0]),
  };
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
  } = req.query;

  const page = Math.max(1, parseInt(req.query.page || '1', 10));
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit || '20', 10)));
  const offset = (page - 1) * limit;

  const where = ['p.is_available = TRUE'];
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
  }

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
  const { rows } = await query('SELECT * FROM properties WHERE id = $1', [req.params.id]);
  if (!rows[0]) throw new ApiError(404, 'Property not found');
  res.json({ property: await hydrate(rows[0]) });
});

// POST /api/properties  (owner only)
const createProperty = asyncHandler(async (req, res) => {
  const {
    title, description, property_type, rent_amount,
    latitude, longitude, address, district, city,
  } = req.body || {};

  if (!title || !String(title).trim()) throw new ApiError(400, 'Title is required');

  const { rows } = await query(
    `INSERT INTO properties
       (owner_id, title, description, property_type, rent_amount,
        latitude, longitude, address, district, city)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
     RETURNING *`,
    [
      req.user.id,
      String(title).trim(),
      description || null,
      property_type || 'room',
      rent_amount != null ? Number(rent_amount) : 0,
      latitude != null ? Number(latitude) : null,
      longitude != null ? Number(longitude) : null,
      address || null,
      district || null,
      city || null,
    ]
  );
  res.status(201).json({ property: await hydrate(rows[0]) });
});

// Ensure the property exists and belongs to the requester (or requester is admin).
async function loadOwnedProperty(id, user) {
  const { rows } = await query('SELECT * FROM properties WHERE id = $1', [id]);
  const property = rows[0];
  if (!property) throw new ApiError(404, 'Property not found');
  if (property.owner_id !== user.id && user.role !== 'admin') {
    throw new ApiError(403, 'You do not own this property');
  }
  return property;
}

// PATCH /api/properties/:id
const updateProperty = asyncHandler(async (req, res) => {
  await loadOwnedProperty(req.params.id, req.user);
  const fields = [
    'title', 'description', 'property_type', 'rent_amount',
    'latitude', 'longitude', 'address', 'district', 'city', 'is_available',
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
  res.json({ property: await hydrate(rows[0]) });
});

// DELETE /api/properties/:id
const deleteProperty = asyncHandler(async (req, res) => {
  await loadOwnedProperty(req.params.id, req.user);
  const imgs = await query('SELECT image_key FROM property_images WHERE property_id = $1', [
    req.params.id,
  ]);
  await query('DELETE FROM properties WHERE id = $1', [req.params.id]);
  // Best-effort cleanup of stored files.
  await Promise.all(imgs.rows.map((r) => storage.delete(r.image_key).catch(() => {})));
  res.json({ ok: true });
});

// POST /api/properties/:id/images  (multipart: images[] — up to 10)
const uploadImages = asyncHandler(async (req, res) => {
  await loadOwnedProperty(req.params.id, req.user);
  if (!req.files || !req.files.length) throw new ApiError(400, 'No images uploaded (field: "images")');

  const saved = await withTransaction(async (client) => {
    const out = [];
    // Continue sort_order from the current max.
    const max = await client.query(
      'SELECT COALESCE(MAX(sort_order), -1) AS m FROM property_images WHERE property_id = $1',
      [req.params.id]
    );
    let order = max.rows[0].m + 1;
    for (const file of req.files) {
      const { key } = await storage.save({
        buffer: file.buffer,
        originalName: file.originalname,
        mimeType: file.mimetype,
        folder: 'properties',
      });
      const ins = await client.query(
        `INSERT INTO property_images (property_id, image_key, sort_order)
         VALUES ($1, $2, $3) RETURNING *`,
        [req.params.id, key, order++]
      );
      out.push(ins.rows[0]);
    }
    return out;
  });

  res.status(201).json({ images: saved.map(propertyImage) });
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
  res.json({ ok: true });
});

module.exports = {
  listProperties, getProperty, createProperty, updateProperty,
  deleteProperty, uploadImages, deleteImage,
};
