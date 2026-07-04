-- Number of people sharing (for "I have a place" posts). Budget is per person,
-- so total rent = budget × persons. Nullable so existing rows are unaffected.

ALTER TABLE roommate_posts ADD COLUMN IF NOT EXISTS persons INTEGER CHECK (persons IS NULL OR persons > 0);
