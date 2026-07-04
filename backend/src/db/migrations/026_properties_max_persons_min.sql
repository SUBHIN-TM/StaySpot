-- max_persons must always be at least 1 (never NULL, 0, or blank). Backfill any
-- offending rows to 1, then enforce it with a default, NOT NULL, and a CHECK.

UPDATE properties SET max_persons = 1 WHERE max_persons IS NULL OR max_persons < 1;

ALTER TABLE properties ALTER COLUMN max_persons SET DEFAULT 1;
ALTER TABLE properties ALTER COLUMN max_persons SET NOT NULL;

ALTER TABLE properties DROP CONSTRAINT IF EXISTS properties_max_persons_min;
ALTER TABLE properties ADD CONSTRAINT properties_max_persons_min CHECK (max_persons >= 1);
