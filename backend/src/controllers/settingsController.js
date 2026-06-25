'use strict';

const { asyncHandler, ApiError } = require('../utils/http');
const { getAllSettings, setSetting } = require('../services/settings');
const { flushPendingUploads, countPending } = require('../services/uploadSweeper');

// GET /api/settings  (admin) — current settings + live pending-upload count.
const getSettings = asyncHandler(async (req, res) => {
  res.json({
    settings: await getAllSettings(),
    pendingUploads: await countPending(),
  });
});

// PATCH /api/settings  (admin) — update known settings.
const updateSettings = asyncHandler(async (req, res) => {
  const { auto_approve_listings, pending_upload_ttl_minutes } = req.body || {};

  if (auto_approve_listings !== undefined) {
    await setSetting('auto_approve_listings', auto_approve_listings ? 'true' : 'false');
  }

  if (pending_upload_ttl_minutes !== undefined) {
    const n = parseInt(pending_upload_ttl_minutes, 10);
    if (!Number.isFinite(n) || n < 1) {
      throw new ApiError(400, 'pending_upload_ttl_minutes must be a positive number of minutes');
    }
    await setSetting('pending_upload_ttl_minutes', String(n));
  }

  // Max upload sizes in MB (1–1024). Enforced in the browser and at presign.
  for (const key of ['max_image_mb', 'max_video_mb']) {
    if (req.body[key] !== undefined) {
      const n = parseInt(req.body[key], 10);
      if (!Number.isFinite(n) || n < 1 || n > 1024) {
        throw new ApiError(400, `${key} must be between 1 and 1024 (MB)`);
      }
      await setSetting(key, String(n));
    }
  }

  res.json({
    settings: await getAllSettings(),
    pendingUploads: await countPending(),
  });
});

// POST /api/settings/flush-pending  (admin) — delete every pending upload now.
const flushPending = asyncHandler(async (req, res) => {
  const result = await flushPendingUploads();
  res.json({ ...result, pendingUploads: await countPending() });
});

module.exports = { getSettings, updateSettings, flushPending };
