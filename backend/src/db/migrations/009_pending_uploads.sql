-- Pending (staged) uploads for the direct-to-storage upload flow.
--
-- New flow: the browser uploads a file straight to object storage (Contabo)
-- using a presigned URL BEFORE the property form is submitted. At that moment
-- the object exists in storage but nothing in the DB references it yet — it is
-- "pending". When the form is submitted we mark the matching rows "claimed".
--
-- Anything left "pending" past the TTL was attached-but-never-submitted (the
-- user cancelled, closed the tab, or crashed) — a background sweep deletes those
-- orphaned objects so we never pay to store files nobody uses.

CREATE TABLE IF NOT EXISTS pending_uploads (
  key         TEXT PRIMARY KEY,                       -- storage object key, e.g. "video/<uuid>.mp4"
  owner_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  folder      TEXT NOT NULL,                          -- 'image' | 'video'
  mime_type   TEXT,
  status      TEXT NOT NULL DEFAULT 'pending'         -- 'pending' (orphan candidate) | 'claimed' (in use)
              CHECK (status IN ('pending', 'claimed')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- The sweep scans by (status, created_at); index it.
CREATE INDEX IF NOT EXISTS idx_pending_uploads_status_created
  ON pending_uploads (status, created_at);

-- How long (minutes) a pending upload may live before the sweep deletes it.
-- Default 60 minutes; admin-configurable from the Settings page.
INSERT INTO settings (key, value) VALUES ('pending_upload_ttl_minutes', '60')
  ON CONFLICT (key) DO NOTHING;
