-- Extra fields owners fill in when listing a property.
ALTER TABLE properties ADD COLUMN IF NOT EXISTS video_key   TEXT;     -- stored video (storage key)
ALTER TABLE properties ADD COLUMN IF NOT EXISTS map_link    TEXT;     -- Google Maps link
ALTER TABLE properties ADD COLUMN IF NOT EXISTS max_persons INTEGER;  -- how many people it fits
ALTER TABLE properties ADD COLUMN IF NOT EXISTS occupancy_status TEXT NOT NULL DEFAULT 'available'
  CHECK (occupancy_status IN ('available', 'partially_occupied', 'occupied'));
