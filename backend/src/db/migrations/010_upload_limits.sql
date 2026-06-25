-- Admin-configurable maximum upload sizes (megabytes), enforced both in the
-- browser (before upload) and on the backend (at presign time). Defaults match
-- the original hard-coded multer limits.

INSERT INTO settings (key, value) VALUES ('max_image_mb', '8')
  ON CONFLICT (key) DO NOTHING;
INSERT INTO settings (key, value) VALUES ('max_video_mb', '50')
  ON CONFLICT (key) DO NOTHING;
