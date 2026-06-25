-- Owner-curated localities, scoped to a district.
--
-- The Town/Locality field is a dropdown per district. Options come from this
-- table; when an owner picks "Other" and types a new name, it's recorded here on
-- save, so it becomes a suggestion for the next owner in that district.
-- (Post-office areas from the pincode API are also offered, but THIS is the
-- canonical, growing list.)

CREATE TABLE IF NOT EXISTS localities (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  state       TEXT NOT NULL DEFAULT 'Kerala',
  district    TEXT NOT NULL,
  name        TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- One row per (district, name) — case-insensitive, so "Kakkanad" / "kakkanad"
-- don't both get stored. Enables ON CONFLICT DO NOTHING on insert.
CREATE UNIQUE INDEX IF NOT EXISTS uq_localities_district_name
  ON localities (district, lower(name));
