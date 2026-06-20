-- Google sign-in support.
-- Google users have no password, so password_hash must become optional.
-- We also store the Google account id and the profile picture URL.

ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id  TEXT UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
