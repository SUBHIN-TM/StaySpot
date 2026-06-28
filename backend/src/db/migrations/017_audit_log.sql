-- Edit history / audit trail so admins can monitor owner & user activity
-- (e.g. spot a vulgar/illegal image right after it's added).
--
-- audit_logs   = one row per change, with a before/after diff in `changes`.
-- edit_count   = fast counter on the entity for the admin column/sort/filter.

CREATE TABLE IF NOT EXISTS audit_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL,                    -- 'user' | 'property'
  entity_id   UUID NOT NULL,
  action      TEXT NOT NULL,                    -- 'update' | 'image_add' | 'approval' | …
  actor_id    UUID,                             -- who did it (null = system); not FK so logs survive user deletion
  actor_role  TEXT,                             -- 'owner' | 'seeker' | 'admin'
  changes     JSONB,                            -- { field: { before, after } } or action-specific payload
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_logs(entity_type, entity_id, created_at DESC);

-- "How many times has this been edited" — bumped only on owner/user-initiated edits.
ALTER TABLE users      ADD COLUMN IF NOT EXISTS edit_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS edit_count INTEGER NOT NULL DEFAULT 0;
