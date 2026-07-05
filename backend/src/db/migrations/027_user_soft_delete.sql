-- Account soft-delete for seekers/owners.
-- A non-null deleted_at means the account is gone: it can't log in, and its
-- listings + roommate posts are hidden from the public. We KEEP the row (so the
-- admin can still see the history), but the person can register again from
-- scratch with the same email, as a brand new account.
ALTER TABLE users ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
CREATE INDEX IF NOT EXISTS idx_users_deleted_at ON users (deleted_at);

-- Uniqueness must apply only to LIVE (non-deleted) accounts, so a soft-deleted
-- user frees their email / username / Google link for a completely fresh signup.
-- Drop the original table-level UNIQUE constraints and replace them with partial
-- unique indexes scoped to deleted_at IS NULL.
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_email_key;
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_username_key;
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_google_id_key;

CREATE UNIQUE INDEX IF NOT EXISTS uq_users_email_live     ON users (email)     WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_users_username_live  ON users (username)  WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_users_google_id_live ON users (google_id) WHERE deleted_at IS NULL;
