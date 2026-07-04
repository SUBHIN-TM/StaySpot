-- Usernames used to default to the FULL email. Convert existing rows whose
-- username is still an email (contains "@") to just the local part (before "@"),
-- keeping usernames unique:
--   • duplicates of the same local part get a numeric suffix (john, john2, john3…)
--   • anything that would still clash with an existing, distinct username is left
--     as-is (the full email) to avoid a unique-constraint violation.

WITH email_usernames AS (
  SELECT id,
         lower(split_part(username, '@', 1)) AS base,
         row_number() OVER (
           PARTITION BY lower(split_part(username, '@', 1))
           ORDER BY created_at, id
         ) AS rn
  FROM users
  WHERE position('@' IN username) > 0
),
targets AS (
  SELECT id,
         CASE WHEN rn = 1 THEN base ELSE base || rn::text END AS new_username
  FROM email_usernames
)
UPDATE users u
SET username = t.new_username,
    updated_at = now()
FROM targets t
WHERE u.id = t.id
  AND NOT EXISTS (
    SELECT 1 FROM users x
    WHERE x.username = t.new_username AND x.id <> u.id
  );
