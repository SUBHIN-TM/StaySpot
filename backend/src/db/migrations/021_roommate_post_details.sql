-- Richer roommate posts so viewers instantly understand the listing:
--   post_type    — does the poster HAVE a place (inviting) or are they SEEKING one?
--   budget_basis — is the budget PER PERSON or the TOTAL rent?
--   room_type    — private room, shared room, or an entire place to share.
-- Nullable so existing rows are unaffected; CHECK guards the allowed values
-- (NULL always passes a CHECK, so old posts stay valid).

ALTER TABLE roommate_posts ADD COLUMN IF NOT EXISTS post_type    TEXT CHECK (post_type IN ('have_place', 'seeking'));
ALTER TABLE roommate_posts ADD COLUMN IF NOT EXISTS budget_basis TEXT CHECK (budget_basis IN ('per_person', 'total'));
ALTER TABLE roommate_posts ADD COLUMN IF NOT EXISTS room_type    TEXT CHECK (room_type IN ('private', 'shared', 'entire'));
