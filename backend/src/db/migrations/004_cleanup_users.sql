-- Trim the users table:
--  • Merge the two image fields into one  → keep `avatar_url`, drop `profile_image`.
--  • Drop `is_verified` (owner-badge idea, not used yet).
ALTER TABLE users DROP COLUMN IF EXISTS profile_image;
ALTER TABLE users DROP COLUMN IF EXISTS is_verified;
