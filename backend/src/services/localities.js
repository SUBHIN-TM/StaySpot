'use strict';

// Owner-curated localities, scoped to a PINCODE (see migrations 012 & 013). Used
// to populate the Town/Locality dropdown for the entered pincode and to record
// new ones owners add via "Other". District/state are kept for display only.

const { query, withTransaction } = require('../config/db');

// Normalise a typed locality so trivial variations don't become duplicates:
// trim, collapse internal whitespace, and Capitalize The First Letter of each
// word (so "kakkanad" / "north paravur" become "Kakkanad" / "North Paravur").
function normalizeName(name) {
  return String(name || '')
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

// All known locality names for a pincode, alphabetical.
async function listByPincode(pincode) {
  if (!pincode) return [];
  const { rows } = await query(
    'SELECT name FROM localities WHERE pincode = $1 ORDER BY name',
    [pincode]
  );
  return rows.map((r) => r.name);
}

// Resolve a locality to its CANONICAL stored form for a PINCODE, deduping as we
// go. If a case-insensitive match exists for that pincode, return the existing
// spelling; otherwise insert it. Returns the value to save on the property.
async function resolveLocality(state, district, pincode, name) {
  const clean = normalizeName(name);
  if (!pincode || !clean) return clean || null;

  const existing = await query(
    'SELECT name FROM localities WHERE pincode = $1 AND lower(name) = lower($2) LIMIT 1',
    [pincode, clean]
  );
  if (existing.rows[0]) return existing.rows[0].name; // reuse canonical spelling

  await query(
    `INSERT INTO localities (state, district, pincode, name)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (pincode, lower(name)) DO NOTHING`,
    [state || 'Kerala', district || null, pincode, clean]
  );
  return clean;
}

// ── Admin management (merge / rename / delete), scoped per pincode ────────────

// List localities with how many (live) properties use each — for the admin tool.
// Optional filters by district and/or pincode and/or a name search.
async function listWithCounts({ district, pincode, q } = {}) {
  const where = [];
  const params = [];
  let i = 1;
  if (district) { params.push(district); where.push(`l.district = $${i++}`); }
  if (pincode) { params.push(pincode); where.push(`l.pincode = $${i++}`); }
  if (q) { params.push(`%${q}%`); where.push(`l.name ILIKE $${i++}`); }

  const sql = `
    SELECT l.id, l.state, l.district, l.pincode, l.name,
      (SELECT COUNT(*) FROM properties p
         WHERE p.deleted_at IS NULL
           AND p.pincode = l.pincode
           AND lower(p.city) = lower(l.name)) AS property_count
    FROM localities l
    ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
    ORDER BY l.district, l.pincode, l.name`;

  const { rows } = await query(sql, params);
  return rows.map((r) => ({ ...r, property_count: Number(r.property_count) }));
}

// Dry-run for a merge within ONE pincode: count how many properties each source
// would move to the target, without changing anything.
async function previewMerge(pincode, target, sources) {
  const canonicalTarget = normalizeName(target);
  const perSource = [];
  let propertiesAffected = 0;
  let localitiesRemoved = 0;

  for (const raw of sources) {
    const src = normalizeName(raw);
    if (!src || src.toLowerCase() === canonicalTarget.toLowerCase()) continue;
    const cnt = await query(
      `SELECT COUNT(*)::int AS n FROM properties
       WHERE deleted_at IS NULL AND pincode = $1 AND lower(city) = lower($2)`,
      [pincode, src]
    );
    perSource.push({ name: src, count: cnt.rows[0].n });
    propertiesAffected += cnt.rows[0].n;

    const exists = await query(
      'SELECT 1 FROM localities WHERE pincode = $1 AND lower(name) = lower($2)',
      [pincode, src]
    );
    if (exists.rows[0]) localitiesRemoved += 1;
  }
  return { target: canonicalTarget, perSource, propertiesAffected, localitiesRemoved };
}

// Merge one or more source localities into a target within ONE pincode: repoint
// every property (in that pincode) using a source name to the target, then
// delete the source rows.
async function mergeLocalities(pincode, target, sources) {
  const canonicalTarget = normalizeName(target);
  return withTransaction(async (client) => {
    // Reuse the district/state of an existing row for this pincode for the target.
    const ref = await client.query(
      'SELECT district, state FROM localities WHERE pincode = $1 LIMIT 1',
      [pincode]
    );
    const district = ref.rows[0] ? ref.rows[0].district : null;
    const state = (ref.rows[0] && ref.rows[0].state) || 'Kerala';
    await client.query(
      `INSERT INTO localities (state, district, pincode, name) VALUES ($1, $2, $3, $4)
       ON CONFLICT (pincode, lower(name)) DO NOTHING`,
      [state, district, pincode, canonicalTarget]
    );

    let propertiesUpdated = 0;
    let removed = 0;
    for (const raw of sources) {
      const src = normalizeName(raw);
      if (!src || src.toLowerCase() === canonicalTarget.toLowerCase()) continue;
      const upd = await client.query(
        `UPDATE properties SET city = $1, updated_at = now()
         WHERE pincode = $2 AND lower(city) = lower($3)`,
        [canonicalTarget, pincode, src]
      );
      propertiesUpdated += upd.rowCount;
      const del = await client.query(
        'DELETE FROM localities WHERE pincode = $1 AND lower(name) = lower($2)',
        [pincode, src]
      );
      removed += del.rowCount;
    }
    return { propertiesUpdated, removed, target: canonicalTarget };
  });
}

// Rename a locality (fix a typo). Repoints properties (in that pincode) from the
// old name to the new one. If the new name already exists there, this merges.
async function renameLocality(id, newName) {
  const clean = normalizeName(newName);
  if (!clean) return null;
  const cur = await query('SELECT pincode, name FROM localities WHERE id = $1', [id]);
  if (!cur.rows[0]) return null;
  const { pincode, name: oldName } = cur.rows[0];

  return withTransaction(async (client) => {
    const upd = await client.query(
      `UPDATE properties SET city = $1, updated_at = now()
       WHERE pincode = $2 AND lower(city) = lower($3)`,
      [clean, pincode, oldName]
    );
    const clash = await client.query(
      'SELECT id FROM localities WHERE pincode = $1 AND lower(name) = lower($2) AND id <> $3',
      [pincode, clean, id]
    );
    if (clash.rows[0]) {
      await client.query('DELETE FROM localities WHERE id = $1', [id]);
    } else {
      await client.query('UPDATE localities SET name = $1 WHERE id = $2', [clean, id]);
    }
    return { propertiesUpdated: upd.rowCount, name: clean };
  });
}

// Delete a locality suggestion. Properties keep their stored text.
async function deleteLocality(id) {
  await query('DELETE FROM localities WHERE id = $1', [id]);
}

module.exports = {
  listByPincode,
  resolveLocality,
  listWithCounts,
  previewMerge,
  mergeLocalities,
  renameLocality,
  deleteLocality,
};
