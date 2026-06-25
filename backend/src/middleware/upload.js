'use strict';

const multer = require('multer');
const { ApiError } = require('../utils/http');
const ALLOWED = require('../config/uploadTypes'); // shared accepted-types config

// Keep files in memory; the storage driver decides where they ultimately land.
// (Property media now uploads directly to storage via presigned URLs — this
// multer path is only used for small avatar images.)
const memory = multer.memoryStorage();

const upload = multer({
  storage: memory,
  limits: { fileSize: 8 * 1024 * 1024 }, // 8 MB per image
  fileFilter(req, file, cb) {
    if (ALLOWED.image.includes(file.mimetype)) return cb(null, true);
    cb(new ApiError(400, `Unsupported image type: ${file.mimetype}`));
  },
});

module.exports = { upload };
