-- StayMate initial schema
-- Safe to run multiple times (IF NOT EXISTS guards).

CREATE EXTENSION IF NOT EXISTS "pgcrypto";  -- gen_random_uuid()

-- ─── users ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email          TEXT NOT NULL UNIQUE,
  password_hash  TEXT NOT NULL,
  name           TEXT NOT NULL,
  mobile_number  TEXT,
  gender         TEXT,                                  -- 'male' | 'female' | 'other' | NULL
  occupation     TEXT,
  profile_image  TEXT,                                  -- storage object key
  role           TEXT NOT NULL DEFAULT 'seeker'
                 CHECK (role IN ('seeker', 'owner', 'admin')),
  is_verified    BOOLEAN NOT NULL DEFAULT FALSE,        -- owner verification (Phase 2)
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── properties ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS properties (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title          TEXT NOT NULL,
  description    TEXT,
  property_type  TEXT NOT NULL DEFAULT 'room'
                 CHECK (property_type IN ('room', 'apartment', 'house', 'pg', 'hostel', 'shared')),
  rent_amount    NUMERIC(12, 2) NOT NULL DEFAULT 0,
  latitude       DOUBLE PRECISION,
  longitude      DOUBLE PRECISION,
  address        TEXT,
  district       TEXT,
  city           TEXT,
  is_available   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_properties_owner ON properties(owner_id);
CREATE INDEX IF NOT EXISTS idx_properties_city ON properties(city);
CREATE INDEX IF NOT EXISTS idx_properties_geo ON properties(latitude, longitude);

-- ─── property_images ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS property_images (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id  UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  image_key    TEXT NOT NULL,                           -- storage object key (Contabo later)
  sort_order   INTEGER NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_property_images_property ON property_images(property_id);

-- ─── roommate_posts ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS roommate_posts (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title              TEXT NOT NULL,
  description        TEXT,
  budget             NUMERIC(12, 2),
  preferred_location TEXT,
  move_in_date       DATE,
  is_active          BOOLEAN NOT NULL DEFAULT TRUE,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_roommate_posts_user ON roommate_posts(user_id);

-- ─── conversations ──────────────────────────────────────────────────────────
-- A conversation is a 1:1 thread between two users, optionally about a property.
-- user_a_id is always the lexicographically smaller UUID so a pair maps to one row.
CREATE TABLE IF NOT EXISTS conversations (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_a_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_b_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  property_id  UUID REFERENCES properties(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (user_a_id <> user_b_id)
);

-- One thread per (pair, property). COALESCE handles the NULL property case.
CREATE UNIQUE INDEX IF NOT EXISTS uq_conversation_pair
  ON conversations (user_a_id, user_b_id, COALESCE(property_id, '00000000-0000-0000-0000-000000000000'::uuid));

-- ─── messages ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS messages (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id  UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  receiver_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  property_id      UUID REFERENCES properties(id) ON DELETE SET NULL,
  content          TEXT NOT NULL,
  is_read          BOOLEAN NOT NULL DEFAULT FALSE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id, created_at);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_unread ON messages(receiver_id) WHERE is_read = FALSE;

-- ─── favorites ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS favorites (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  property_id  UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, property_id)
);

CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites(user_id);

-- ─── notifications ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  message     TEXT,
  type        TEXT NOT NULL DEFAULT 'general',         -- 'message' | 'general' | ...
  status      TEXT NOT NULL DEFAULT 'unread'
              CHECK (status IN ('unread', 'read')),
  data        JSONB,                                    -- arbitrary payload (e.g. conversation_id)
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, status);
