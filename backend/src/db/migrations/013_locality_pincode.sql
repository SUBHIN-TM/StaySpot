-- Scope localities to PINCODE (not just district).
--
-- Before: a locality typed for one pincode appeared for every pincode in the
-- whole district. Now each locality belongs to a specific pincode, so it only
-- shows up when that pincode is entered.

ALTER TABLE localities ADD COLUMN IF NOT EXISTS pincode TEXT;

-- Replace the district-scoped uniqueness with pincode-scoped.
DROP INDEX IF EXISTS uq_localities_district_name;
CREATE UNIQUE INDEX IF NOT EXISTS uq_localities_pincode_name
  ON localities (pincode, lower(name));
CREATE INDEX IF NOT EXISTS idx_localities_pincode ON localities (pincode);

-- The previously district-scoped rows have no pincode and were the cause of a
-- locality showing under every pincode. Remove them — the list repopulates as
-- owners add localities against the right pincode. (Properties keep their text.)
DELETE FROM localities WHERE pincode IS NULL;
