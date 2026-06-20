-- Add a username for manual sign-up. Optional + unique.
-- For Google users and manual users we default it to the email address.
ALTER TABLE users ADD COLUMN IF NOT EXISTS username TEXT UNIQUE;
