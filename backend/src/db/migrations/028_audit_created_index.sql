-- The admin activity feed lists audit entries across ALL entities newest-first,
-- so add a plain created_at index for that global ordering/pagination (the
-- existing index is per-entity).
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs (created_at DESC);
