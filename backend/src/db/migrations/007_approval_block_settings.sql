-- Block/unblock users, property approval workflow, and an app settings table.

-- 1. Users can be blocked by an admin.
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN NOT NULL DEFAULT FALSE;

-- 2. Properties need admin approval before they're public.
ALTER TABLE properties ADD COLUMN IF NOT EXISTS approval_status TEXT NOT NULL DEFAULT 'pending'
  CHECK (approval_status IN ('pending', 'approved', 'rejected'));
-- Keep already-existing listings visible (treat them as approved).
UPDATE properties SET approval_status = 'approved' WHERE approval_status = 'pending';

-- 3. Simple key/value app settings (e.g. auto-approve toggle).
CREATE TABLE IF NOT EXISTS settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
INSERT INTO settings (key, value) VALUES ('auto_approve_listings', 'false')
  ON CONFLICT (key) DO NOTHING;
