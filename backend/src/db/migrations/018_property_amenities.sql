-- Amenities (multi-select tags) + furnishing + a few either/or policies that
-- owners can OPTIONALLY set on a listing. All are nullable / empty by default.
--   amenities          : free multi-select checklist (fixed list, see lib/listingMeta.js)
--   furnishing         : unfurnished / semi_furnished / fully_furnished
--   pets_allowed       : allowed / not_allowed
--   electricity_billing: included / separate (metered)
--   preferred_tenant   : any / family / bachelors / students / professionals / girls / boys
--   food_included      : included / not_included  (PG / hostel)
ALTER TABLE properties ADD COLUMN IF NOT EXISTS amenities TEXT[] NOT NULL DEFAULT '{}';

ALTER TABLE properties ADD COLUMN IF NOT EXISTS furnishing TEXT
  CHECK (furnishing IN ('unfurnished', 'semi_furnished', 'fully_furnished'));

ALTER TABLE properties ADD COLUMN IF NOT EXISTS pets_allowed TEXT
  CHECK (pets_allowed IN ('allowed', 'not_allowed'));

ALTER TABLE properties ADD COLUMN IF NOT EXISTS electricity_billing TEXT
  CHECK (electricity_billing IN ('included', 'separate'));

ALTER TABLE properties ADD COLUMN IF NOT EXISTS preferred_tenant TEXT
  CHECK (preferred_tenant IN ('any', 'family', 'bachelors', 'students', 'professionals', 'girls', 'boys'));

ALTER TABLE properties ADD COLUMN IF NOT EXISTS food_included TEXT
  CHECK (food_included IN ('included', 'not_included'));
