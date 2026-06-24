-- Soft delete for properties. Instead of removing the row (and losing its
-- images, chats and history), we mark WHEN it was deleted. NULL = active,
-- a timestamp = deleted. Every listing query filters on deleted_at IS NULL,
-- so a deleted property simply disappears from the public site, the owner's
-- dashboard and the admin panel — but can still be restored later.
ALTER TABLE properties ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Speeds up the "active only" filter used by every property listing query.
CREATE INDEX IF NOT EXISTS idx_properties_deleted_at ON properties (deleted_at);
