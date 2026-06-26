'use strict';

// Demo data so the app has something to show immediately after setup.
// Idempotent-ish: clears existing demo rows by email/title before inserting.

const { pool } = require('../config/db');
const { hashPassword } = require('../utils/password');

async function seed() {
  const client = await pool.connect();
  try {
    console.log('Seeding demo data…');
    const pass = await hashPassword('password123');

    // Users
    const owner = await client.query(
      `INSERT INTO users (email, password_hash, name, role, gender, occupation, mobile_number)
       VALUES ('owner@demo.com', $1, 'Olivia Owner', 'owner', 'female', 'Landlord', '9000000001')
       ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
       RETURNING id`,
      [pass]
    );
    const seeker = await client.query(
      `INSERT INTO users (email, password_hash, name, role, gender, occupation, mobile_number)
       VALUES ('seeker@demo.com', $1, 'Sam Seeker', 'seeker', 'male', 'Student', '9000000002')
       ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
       RETURNING id`,
      [pass]
    );
    const ownerId = owner.rows[0].id;
    const seekerId = seeker.rows[0].id;

    // Properties — Kerala-based sample listings (canonical district + pincode +
    // town/locality, matching the geo dataset). Seeded as 'approved' so they show
    // on the public pages immediately (new owner-created listings default to
    // 'pending' and need admin approval — but demo data should just appear).
    const samples = [
      { title: 'Cozy 1BHK near Lulu Mall', type: 'apartment', rent: 16000, lat: 10.0274, lng: 76.3080, district: 'Ernakulam', city: 'Edappally', pincode: '682024', address: 'Edappally Toll Junction' },
      { title: 'Shared room for students in Kakkanad', type: 'shared', rent: 6500, lat: 10.0159, lng: 76.3419, district: 'Ernakulam', city: 'Kakkanad', pincode: '682030', address: 'Infopark Road' },
      { title: 'Spacious PG with meals near Technopark', type: 'pg', rent: 8500, lat: 8.5577, lng: 76.8797, district: 'Thiruvananthapuram', city: 'Kazhakkoottam', pincode: '695582', address: 'Technopark Campus Road' },
      { title: 'Modern studio off MG Road', type: 'apartment', rent: 14000, lat: 9.9816, lng: 76.2829, district: 'Ernakulam', city: 'Kochi', pincode: '682011', address: 'MG Road' },
      { title: 'Budget room near Kozhikode Beach', type: 'room', rent: 5500, lat: 11.2588, lng: 75.7804, district: 'Kozhikode', city: 'Kozhikode', pincode: '673032', address: 'Beach Road' },
    ];

    for (const s of samples) {
      const exists = await client.query(
        'SELECT id FROM properties WHERE title = $1 AND owner_id = $2',
        [s.title, ownerId]
      );
      if (exists.rows[0]) continue;
      await client.query(
        `INSERT INTO properties
           (owner_id, title, description, property_type, rent_amount, latitude, longitude,
            address, state, district, city, pincode, approval_status)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,'approved')`,
        [
          ownerId,
          s.title,
          'Well-maintained place with good connectivity. Demo listing.',
          s.type,
          s.rent,
          s.lat,
          s.lng,
          s.address,
          'Kerala',
          s.district,
          s.city,
          s.pincode,
        ]
      );
    }

    // Roommate post
    const rp = await client.query(
      'SELECT id FROM roommate_posts WHERE user_id = $1 AND title = $2',
      [seekerId, 'Looking for a roommate in Kakkanad']
    );
    if (!rp.rows[0]) {
      await client.query(
        `INSERT INTO roommate_posts (user_id, title, description, budget, preferred_location, move_in_date)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          seekerId,
          'Looking for a roommate in Kakkanad',
          'Non-smoker, working professional, clean and friendly.',
          7000,
          'Kakkanad',
          '2026-07-01',
        ]
      );
    }

    console.log('\nDemo accounts (password: password123):');
    console.log('  owner@demo.com  (Property Owner)');
    console.log('  seeker@demo.com (Accommodation Seeker)');
    console.log('\nSeed complete.');
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
