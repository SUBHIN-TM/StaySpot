'use strict';

/*
 * Attaches demo photos to properties that have none.
 *
 * Photos are fetched from picsum.photos (free placeholder images) and saved
 * through the SAME storage facade the app uses — so today they go to
 * backend/uploads/ + the JSON index, and after you switch STORAGE_DRIVER=contabo
 * they'll go to the bucket with no change to this script.
 *
 * Idempotent: properties that already have images are skipped.
 *
 *   node src/db/seed-images.js
 */

const { pool } = require('../config/db');
const storage = require('../storage');

const IMAGES_PER_PROPERTY = 3;

// Deterministic, distinct photos per property using a stable seed.
function photoUrl(seed) {
  return `https://picsum.photos/seed/${encodeURIComponent(seed)}/900/600`;
}

async function download(url) {
  const res = await fetch(url, { redirect: 'follow' });
  if (!res.ok) throw new Error(`download failed ${res.status} for ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  const mimeType = res.headers.get('content-type') || 'image/jpeg';
  return { buffer: buf, mimeType };
}

async function run() {
  const client = await pool.connect();
  try {
    const props = await client.query('SELECT id, title, property_type FROM properties ORDER BY created_at');
    if (!props.rows.length) {
      console.log('No properties found. Run `npm run db:seed` first.');
      return;
    }

    let added = 0;
    for (const prop of props.rows) {
      const existing = await client.query(
        'SELECT COUNT(*)::int AS n FROM property_images WHERE property_id = $1',
        [prop.id]
      );
      if (existing.rows[0].n > 0) {
        console.log(`• skip   "${prop.title}" (already has ${existing.rows[0].n} image(s))`);
        continue;
      }

      console.log(`▶ adding images to "${prop.title}"…`);
      for (let i = 0; i < IMAGES_PER_PROPERTY; i++) {
        const seed = `${prop.id}-${i}`;
        try {
          const { buffer, mimeType } = await download(photoUrl(seed));
          const { key } = await storage.save({
            buffer,
            originalName: `${seed}.jpg`,
            mimeType,
            folder: 'properties',
          });
          await client.query(
            'INSERT INTO property_images (property_id, image_key, sort_order) VALUES ($1, $2, $3)',
            [prop.id, key, i]
          );
          added++;
          console.log(`    ✓ ${key}`);
        } catch (err) {
          console.warn(`    ! image ${i} failed: ${err.message}`);
        }
      }
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
