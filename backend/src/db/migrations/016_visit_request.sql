-- Owners can REQUEST a faster field visit to get their property verified.
-- This flags the listing so admins can find who's waiting (Admin → Properties
-- "Visit requested" column) and triggers an admin notification.

ALTER TABLE properties ADD COLUMN IF NOT EXISTS visit_requested    BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS visit_requested_at TIMESTAMPTZ;
