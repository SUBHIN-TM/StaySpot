-- Place type = what KIND of property it is (apartment, house, PG, room…), separate
-- from room_type = the sharing arrangement (private / shared room / entire place).
-- Both optional now (NULL = "any / not specified"). CHECK guards allowed values.

ALTER TABLE roommate_posts
  ADD COLUMN IF NOT EXISTS place_type TEXT
  CHECK (place_type IN ('apartment', 'house', 'villa', 'pg', 'hostel', 'room', 'studio'));
