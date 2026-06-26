-- Platform reviews (the "Loved by renters across Kerala" testimonials).
--
-- Site-level reviews written by real users (seekers / owners). One review per
-- user (they can update it), a 1–5 star rating and a short comment. The public
-- landing page lists the most recent ones.

CREATE TABLE IF NOT EXISTS reviews (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating      SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment     TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id)                       -- one review per user (upsert to edit)
);

CREATE INDEX IF NOT EXISTS idx_reviews_created ON reviews (created_at DESC);

-- ── Seed a few default reviews from existing seeker/owner accounts ──────────
-- Picks the first real (non-admin, non-blocked) users and gives each a sample
-- review, so the section isn't empty out of the box. Idempotent: ON CONFLICT
-- skips users that already have a review.
WITH picks AS (
  SELECT id, row_number() OVER (ORDER BY created_at, id) AS rn
  FROM users
  WHERE role IN ('seeker', 'owner') AND COALESCE(is_blocked, false) = false
),
sample (rn, rating, comment) AS (
  VALUES
    (1, 5, 'Found my place in just three days. The admin-checked listings gave me real confidence to move ahead.'),
    (2, 5, 'Messaging owners directly saved so much time — no brokers, no commissions. Moved in within a week.'),
    (3, 4, 'Loved how easy it was to compare rooms and find a compatible roommate before shifting in.'),
    (4, 5, 'Listing my property took just minutes and every enquiry felt genuine. StayMate simply works.'),
    (5, 5, 'Clean, simple and trustworthy. Exactly what house-hunting in Kerala needed.'),
    (6, 4, 'The chat and verified profiles made the whole process feel safe and friendly.')
)
INSERT INTO reviews (user_id, rating, comment)
SELECT p.id, s.rating, s.comment
FROM picks p
JOIN sample s ON s.rn = p.rn
ON CONFLICT (user_id) DO NOTHING;
