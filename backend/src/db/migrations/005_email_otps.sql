-- Stores short-lived email verification codes (OTPs) for signup + OTP-login.
-- One active code per (email, purpose); it's overwritten on resend and deleted
-- once used or when it expires.
CREATE TABLE IF NOT EXISTS email_otps (
  email       TEXT        NOT NULL,
  purpose     TEXT        NOT NULL,            -- 'signup' | 'login'
  code        TEXT        NOT NULL,
  expires_at  TIMESTAMPTZ NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (email, purpose)
);
