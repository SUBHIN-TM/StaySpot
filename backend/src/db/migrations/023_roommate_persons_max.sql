-- People sharing is now a range: `persons` = minimum, `persons_max` = maximum.
-- Nullable so existing rows are unaffected.

ALTER TABLE roommate_posts ADD COLUMN IF NOT EXISTS persons_max INTEGER CHECK (persons_max IS NULL OR persons_max > 0);
