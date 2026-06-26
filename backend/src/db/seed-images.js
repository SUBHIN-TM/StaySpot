'use strict';

/*
 * Attaches demo photos to properties.
 *
 * Photos are real INTERIOR shots (bedrooms / living rooms / apartments /
 * kitchens) chosen by property type, fetched from loremflickr (free, no key,
 * tag-based) and saved through the SAME storage facade the app uses — so today
 * they go to backend/uploads/ + the JSON index, and after you switch
 * STORAGE_DRIVER=contabo they'll go to the bucket with no change to this script.
 *
 * Why tags? The old version used picsum.photos, which serves RANDOM images
 * (you'd get animals, cars, landscapes…). Tagging by room type keeps every
 * photo on-theme for a rentals site.
 *
 * Usage:
 *   node src/db/seed-images.js            # add images to properties that have none
 *   node src/db/seed-images.js --replace  # re-do the DEMO listings' images
 *                                          # (deletes their old photos first)
 *
 * --replace is scoped to the demo owner (owner@demo.com) so it can never wipe
 * real owners' uploaded photos. Idempotent without --replace: properties that
 * already have images are skipped.
 */

const { pool } = require('../config/db');
const storage = require('../storage');

const IMAGES_PER_PROPERTY = 3;
const DEMO_OWNER_EMAIL = 'owner@demo.com';

// Three interior tags per property type → a varied, on-theme set per listing
// (e.g. an apartment gets apartment + lounge + kitchen). Only tags that
// reliably resolve on loremflickr are used — some words (livingroom, interior,
// dormitory, bathroom…) return HTTP 500 there, so we avoid them. 'lounge' is
// our living-room stand-in; FALLBACK_TAG is a known-good last resort.
const FALLBACK_TAG = 'bedroom';
const TAGS_BY_TYPE = {
  apartment: ['apartment', 'lounge', 'kitchen'],
  house: ['house', 'lounge', 'bedroom'],
  room: ['bedroom', 'studio', 'sofa'],
  pg: ['bedroom', 'hostel', 'lounge'],
  hostel: ['hostel', 'bedroom', 'lounge'],
  shared: ['bedroom', 'lounge', 'apartment'],
};
const DEFAULT_TAGS = ['apartment', 'bedroom', 'lounge'];

// Stable positive integer from a string, used as loremflickr's `lock` so each
// property keeps the SAME photos across re-runs (deterministic, not random).
function lockFrom(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h % 100000;
}

// A room photo for the given tag, pinned by `lock` so it's deterministic.
function photoUrl(tag, lock) {
  return `https://loremflickr.com/900/600/${encodeURIComponent(tag)}?lock=${lock}`;
}

async function download(url) {
  const res = await fetch(url, { redirect: 'follow' });
  if (!res.ok) throw new Error(`download failed ${res.status} for ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  const mimeType = res.headers.get('content-type') || 'image/jpeg';
  return { buffer: buf, mimeType };
}

// Fetch one photo for `tag`; if loremflickr hiccups (occasional 500 / rate
// limit), retry once and then fall back to a known-good tag so the slot is
// never left empty.
async function fetchPhoto(tag, lock) {
  const attempts = [
    [tag, lock],
    [tag, lock + 1],
    [FALLBACK_TAG, lock],
  ];
  let lastErr;
  for (const [t, l] of attempts) {
    try {
      return { ...(await download(photoUrl(t, l))), tag: t };
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr;
}

// Add IMAGES_PER_PROPERTY interior photos to one property. Returns how many
// were actually attached.
async function addImages(client, prop) {
  const tags = TAGS_BY_TYPE[prop.property_type] || DEFAULT_TAGS;
  let added = 0;
  for (let i = 0; i < IMAGES_PER_PROPERTY; i++) {
    const tag = tags[i % tags.length];
    const lock = lockFrom(`${prop.id}-${i}`);
    try {
      const { buffer, mimeType, tag: usedTag } = await fetchPhoto(tag, lock);
      const { key } = await storage.save({
        buffer,
        originalName: `${prop.id}-${i}.jpg`,
        mimeType,
        folder: 'properties',
      });
      await client.query(
        'INSERT INTO property_images (property_id, image_key, sort_order) VALUES ($1, $2, $3)',
        [prop.id, key, i]
      );
      added++;
      console.log(`    ✓ ${usedTag.padEnd(10)} ${key}`);
    } catch (err) {
      console.warn(`    ! image ${i} (${tag}) failed: ${err.message}`);
    }
  }
  return added;
}

// Remove all existing images of a property (storage files + DB rows).
async function clearImages(client, propId) {
  const rows = await client.query(
    'SELECT image_key FROM property_images WHERE property_id = $1',
    [propId]
  );
  for (const r of rows.rows) {
    try {
      await storage.delete(r.image_key);
    } catch (err) {
      console.warn(`    ! could not delete file ${r.image_key}: ${err.message}`);
    }
  }
  await client.query('DELETE FROM property_images WHERE property_id = $1', [propId]);
  return rows.rowCount;
}

async function run() {
  const replace = process.argv.includes('--replace');
  const client = await pool.connect();
  try {
    let props;
    if (replace) {
      // Only the demo owner's listings — never touch real uploads.
      props = await client.query(
        `SELECT p.id, p.title, p.property_type
           FROM properties p
           JOIN users u ON u.id = p.owner_id
          WHERE u.email = $1
          ORDER BY p.created_at`,
        [DEMO_OWNER_EMAIL]
      );
      if (!props.rows.length) {
        console.log(`No properties found for ${DEMO_OWNER_EMAIL}. Run \`npm run db:seed\` first.`);
        return;
      }
      console.log(`Replacing images for ${props.rows.length} demo listing(s)…\n`);
    } else {
      props = await client.query(
        'SELECT id, title, property_type FROM properties ORDER BY created_at'
      );
      if (!props.rows.length) {
        console.log('No properties found. Run `npm run db:seed` first.');
        return;
      }
    }

    let added = 0;
    for (const prop of props.rows) {
      const existing = await client.query(
        'SELECT COUNT(*)::int AS n FROM property_images WHERE property_id = $1',
        [prop.id]
      );

      if (replace) {
        if (existing.rows[0].n > 0) {
          const removed = await clearImages(client, prop.id);
          console.log(`♻ replacing "${prop.title}" (removed ${removed} old image(s))`);
        } else {
          console.log(`▶ adding images to "${prop.title}"…`);
        }
        added += await addImages(client, prop);
        continue;
      }

      if (existing.rows[0].n > 0) {
        console.log(`• skip   "${prop.title}" (already has ${existing.rows[0].n} image(s))`);
        continue;
      }
      console.log(`▶ adding images to "${prop.title}"…`);
      added += await addImages(client, prop);
    }

    console.log(`\nDone. Added ${added} image(s) across ${props.rows.length} propert${props.rows.length === 1 ? 'y' : 'ies'}.`);
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch((err) => {
  console.error('seed-images failed:', err.message);
  process.exit(1);
});
