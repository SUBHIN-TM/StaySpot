-- Trust layer: owner PHONE verification (admin-confirmed by a call) and
-- property FIELD VISIT (our team physically went and checked the place).
--
-- Two separate, distinct signals:
--   • users.phone_verified   → drives the green ✓ tick next to the owner's name.
--   • properties.field_visited → drives the "Verified" shield on the listing card.
-- The owner's mobile_number column already exists (001_init).

-- 1. Owner phone verification (set by an admin AFTER a verification call).
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_verified         BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_verified_at      TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_verify_note      TEXT;        -- admin's note (e.g. what was confirmed)
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_verify_proof_key TEXT;        -- optional proof file (call recording / screenshot / pdf)

-- 2. Property field visit (set by an admin after the team visits the place).
ALTER TABLE properties ADD COLUMN IF NOT EXISTS field_visited          BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS field_visit_at         TIMESTAMPTZ;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS field_visit_remarks    TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS field_visit_proof_keys JSONB NOT NULL DEFAULT '[]'; -- [key, …] of proof files (photos/video/audio)
