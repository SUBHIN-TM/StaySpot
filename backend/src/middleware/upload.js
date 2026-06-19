'use strict';

const multer = require('multer');
const { ApiError } = require('../utils/http');

// Keep files in memory; the storage driver decides where they ultimately land.
const memory = multer.memoryStorage();

const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

const upload = multer({
  storage: memory,
  limits: { fileSize: 8 * 1024 * 1024 }, // 8 MB per image
  fileFilter(req, file, cb) {
    if (ALLOWED.includes(file.mimetype)) return cb(null, true);
    cb(new ApiError(400, `Unsupported image type: ${file.mimetype}`));
  },
});

module.exports = { upload };
