'use strict';

// Direct-to-storage upload endpoints.
//
// Old flow (slow): browser -> backend (buffers the whole file in RAM) -> Contabo.
// New flow (fast):  browser asks for a presigned URL, then uploads the file
// STRAIGHT to Contabo. The backend never touches the bytes, so big videos no
// longer tie up server memory or the DB connection while they upload.
//
//   1. POST /uploads/presign  -> { key, uploadUrl, method, headers }
//   2. browser PUTs the file to uploadUrl (Contabo, or the local sink in dev)
//   3. on form submit the key is saved on the property (see propertyController)

const storage = require('../storage');
const { asyncHandler, ApiError } = require('../utils/http');
const { recordPending, removePending } = require('../services/pendingUploads');
const { getSetting } = require('../services/settings');
const ALLOWED = require('../config/uploadTypes');

// Allowed MIME types live in config/uploadTypes.js (edit there to allow/block
// formats). The MAX SIZE is admin-configurable (settings max_image_mb /
// max_video_mb) — see getLimits().
const DEFAULT_MB = { image: 8, video: 50 };

// Read a positive integer MB setting, falling back to the default.
async function maxMb(folder) {
  const key = folder === 'video' ? 'max_video_mb' : 'max_image_mb';
  const n = parseInt(await getSetting(key, String(DEFAULT_MB[folder])), 10);
  return Number.isFinite(n) && n > 0 ? n : DEFAULT_MB[folder];
}

// The current limits, shaped for both validation here and the frontend.
async function getLimits() {
  const [imageMb, videoMb] = await Promise.all([maxMb('image'), maxMb('video')]);
  return {
    image: { allowed: ALLOWED.image, maxMb: imageMb, maxBytes: imageMb * 1024 * 1024 },
    video: { allowed: ALLOWED.video, maxMb: videoMb, maxBytes: videoMb * 1024 * 1024 },
  };
}

// GET /api/uploads/limits — so the browser can validate sizes before uploading.
const limits = asyncHandler(async (req, res) => {
  res.json({ limits: await getLimits() });
});

// POST /api/uploads/presign   body: { folder, fileName, mimeType, size }
// Validate, mint a presigned URL, and record the object as a pending upload.
const presign = asyncHandler(async (req, res) => {
  const { folder, fileName, mimeType, size } = req.body || {};

  if (folder !== 'image' && folder !== 'video') {
    throw new ApiError(400, 'folder must be "image" or "video"');
  }
  const rules = (await getLimits())[folder];
  if (!mimeType || !rules.allowed.includes(mimeType)) {
    throw new ApiError(400, `Unsupported ${folder} type: ${mimeType || 'unknown'}`);
  }
  if (size != null && Number(size) > rules.maxBytes) {
    throw new ApiError(400, `${folder} is too large (max ${rules.maxMb} MB)`);
  }

  const presigned = await storage.presignPut({ folder, originalName: fileName, mimeType });
  await recordPending({
    key: presigned.key,
    ownerId: req.user.id,
    folder,
    mimeType,
  });

  res.json(presigned);
});

// POST /api/uploads/cancel   body: { key }
// The user removed an attachment (or cancelled the form) before submitting.
// Best-effort: delete the orphaned object now instead of waiting for the sweep.
// Idempotent — returns ok even if the key is unknown/already gone.
const cancel = asyncHandler(async (req, res) => {
  const { key } = req.body || {};
  if (!key) throw new ApiError(400, 'key is required');

  const removed = await removePending(req.user.id, key);
  if (removed) await storage.delete(key).catch(() => {});
  res.json({ ok: true });
});

// PUT /api/uploads/local?key=…&sig=…   (local storage driver only)
// Dev-only sink that emulates a presigned URL: the browser PUTs raw bytes here
// and we write them to disk. Authenticated by the HMAC signature in the query
// (see storage/local.js), not a login token. The route uses express.raw(), so
// req.body is a Buffer of the file.
const localPut = asyncHandler(async (req, res) => {
  if (storage.driver !== 'local') throw new ApiError(404, 'Not found');

  const { key, sig } = req.query;
  if (!storage.verifyUploadSig(key, sig)) {
    throw new ApiError(403, 'Invalid or expired upload URL');
  }
  if (!req.body || !req.body.length) throw new ApiError(400, 'Empty upload body');

  await storage.saveAtKey(key, req.body, req.headers['content-type']);
  res.json({ ok: true });
});

module.exports = { presign, cancel, localPut, limits };
