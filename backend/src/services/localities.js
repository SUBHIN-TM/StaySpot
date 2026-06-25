'use strict';

// Owner-curated localities per district (see migration 012). Used to populate
// the Town/Locality dropdown and to record new ones owners add via "Other".

const { query, withTransaction } = require('../config/db');

// All known locality names for a district, alphabetical.
async function listByDistrict(district) {
  if (!district) return [];
  const { rows } = await query(
    'SELECT name FROM localities WHERE district = $1 ORDER BY name',
    [district]
  );
  return rows.map((r) => r.name);
}

// Normalise a typed locality so trivial variations don't become duplicates:
// trim the ends and collapse runs of internal whitespace.
function normalizeName(name) {
  return String(name || '').trim().replace(/\s+/g, ' ');
}

// Resolve a locality to its CANONICAL stored form for a district, deduping as we
// go. If a case-insensitive match already exists, return that existing spelling
// (so we never store "Kakkanad" and "kakkanad" as two options). Otherwise insert
// the normalised name and return it. Returns the value to save on the property.
async function resolveLocality(state, district, name) {
  const clean = normalizeName(name);
  if (!district || !clean) return clean || null;

  const existing = await query(
    'SELECT name FROM localities WHERE district = $1 AND lower(name) = lower($2) LIMIT 1',
    [district, clean]
  );
  if (existing.rows[0]) return existing.rows[0].name; // reuse canonical spelling

  await query(
    `INSERT INTO localities (state, district, name)
     VALUES ($1, $2, $3)
     ON CONFLICT (district, lower(name)) DO NOTHING`,
    [state || 'Kerala', district, clean]
  );
  return clean;
}

// ── Admin management (merge / rename / delete) ───────────────────────────────

// List localities with how many (live) properties use each — for the admin tool.
// Optional filter by district and/or a name search.
async function listWithCounts({ district, q } = {}) {
  const where = [];
  const params = [];
  let i = 1;
  if (district) { params.push(district); where.push(`l.district = $${i++}`); }
  if (q) { params.push(`%${q}%`); where.push(`l.name ILIKE $${i++}`); }

  const sql = `
    SELECT l.id, l.state, l.district, l.name,
      (SELECT COUNT(*) FROM properties p
         WHERE p.deleted_at IS NULL
           AND p.district = l.district
           AND lower(p.city) = lower(l.name)) AS property_count
    FROM localities l
    ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
    ORDER BY l.district, l.name`;

  const { rows } = await query(sql, params);
  return rows.map((r) => ({ ...r, property_count: Number(r.property_count) }));
}

// Dry-run for a merge: count how many properties each source would move to the
// target, WITHOUT changing anything. Powers the admin confirmation preview.
async function previewMerge(district, target, sources) {
  const canonicalTarget = normalizeName(target);
  const perSource = [];
  let propertiesAffected = 0;
  let localitiesRemoved = 0;

  for (const raw of sources) {
    const src = normalizeName(raw);
    if (!src || src.toLowerCase() === canonicalTarget.toLowerCase()) continue;
    const cnt = await query(
      `SELECT COUNT(*)::int AS n FROM properties
       WHERE deleted_at IS NULL AND district = $1 AND lower(city) = lower($2)`,
      [district, src]
    );
    perSource.push({ name: src, count: cnt.rows[0].n });
    propertiesAffected += cnt.rows[0].n;

    const exists = await query(
      'SELECT 1 FROM localities WHERE district = $1 AND lower(name) = lower($2)',
      [district, src]
    );
    if (exists.rows[0]) localitiesRemoved += 1;
  }
  return { target: canonicalTarget, perSource, propertiesAffected, localitiesRemoved };
}

// Merge one or more source localities into a target (all within one district):
// repoint every property using a source name to the target, then delete the
// source rows. Idempotent and case-insensitive. Returns how many properties moved.
async function mergeLocalities(district, target, sources) {
  const canonicalTarget = normalizeName(target);
  return withTransaction(async (client) => {
    // Make sure the target locality exists.
    await client.query(
      `INSERT INTO localities (district, name) VALUES ($1, $2)
       ON CONFLICT (district, lower(name)) DO NOTHING`,
      [district, canonicalTarget]
    );

    let propertiesUpdated = 0;
    let removed = 0;
    for (const raw of sources) {
      const src = normalizeName(raw);
      if (!src || src.toLowerCase() === canonicalTarget.toLowerCase()) continue;
      const upd = await client.query(
        `UPDATE properties SET city = $1, updated_at = now()
         WHERE district = $2 AND lower(city) = lower($3)`,
        [canonicalTarget, district, src]
      );
      propertiesUpdated += upd.rowCount;
      const del = await client.query(
        'DELETE FROM localities WHERE district = $1 AND lower(name) = lower($2)',
        [district, src]
      );
      removed += del.rowCount;
    }
    return { propertiesUpdated, removed, target: canonicalTarget };
  });
}

// Rename a locality (fix a typo). Repoints properties from the old name to the
// new one. If the new name already exists in that district, this becomes a merge.
async function renameLocality(id, newName) {
  const clean = normalizeName(newName);
  if (!clean) return null;
  const cur = await query('SELECT district, name FROM localities WHERE id = $1', [id]);
  if (!cur.rows[0]) return null;
  const { district, name: oldName } = cur.rows[0];

  return withTransaction(async (client) => {
    const upd = await client.query(
      `UPDATE properties SET city = $1, updated_at = now()
       WHERE district = $2 AND lower(city) = lower($3)`,
      [clean, district, oldName]
    );
    // Does another row already hold the new name? Then drop this one (merge).
    const clash = await client.query(
      'SELECT id FROM localities WHERE district = $1 AND lower(name) = lower($2) AND id <> $3',
      [district, clean, id]
    );
    if (clash.rows[0]) {
      await client.query('DELETE FROM localities WHERE id = $1', [id]);
    } else {
      await client.query('UPDATE localities SET name = $1 WHERE id = $2', [clean, id]);
    }
    return { propertiesUpdated: upd.rowCount, name: clean };
  });
}

// Delete a locality suggestion. Properties keep their stored text; this just
// removes it from the dropdown going forward.
async function deleteLocality(id) {
  await query('DELETE FROM localities WHERE id = $1', [id]);
}

module.exports = {
  listByDistrict,
  resolveLocality,
  listWithCounts,
  previewMerge,
  mergeLocalities,
  renameLocality,
  deleteLocality,
};
