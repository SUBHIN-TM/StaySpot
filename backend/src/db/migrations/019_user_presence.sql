-- Lightweight presence: track when a user was last seen (bumped by the auth
-- middleware on authenticated requests, throttled to ~once a minute). Used to
-- show a green "online" dot in chat. Admin is always treated as online in the UI.

ALTER TABLE users ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ;
