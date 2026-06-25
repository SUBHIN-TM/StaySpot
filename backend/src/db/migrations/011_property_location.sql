-- Structured location fields for properties.
--
-- Moves from free-text city/district to a canonical model so listings are
-- filterable and trackable:
--   • state    — canonical (locked to 'Kerala' for now; dropdown ready for more)
--   • district — canonical (one of the 14 Kerala districts; validated on save)
--   • pincode  — 6-digit; can autofill state/district via the India Post API
--   • landmark — free-text wayfinding ("near Infopark")
-- The existing `city` column is reused as the free-text Town / Locality, and
-- latitude/longitude/address/map_link stay as they are.

ALTER TABLE properties ADD COLUMN IF NOT EXISTS state    TEXT NOT NULL DEFAULT 'Kerala';
ALTER TABLE properties ADD COLUMN IF NOT EXISTS pincode  TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS landmark TEXT;

-- District is the main geographic filter — index it (state too, for future).
CREATE INDEX IF NOT EXISTS idx_properties_state_district ON properties (state, district);
