'use strict';

// Contabo Object Storage driver (S3-compatible) — STUB.
//
// Activate by setting STORAGE_DRIVER=contabo and filling the CONTABO_* env vars
// AFTER you purchase the bucket. To finish the integration:
//
//   1. npm install @aws-sdk/client-s3
//   2. Uncomment the implementation below.
//   3. No controller changes needed — this exposes the same interface as the
//      local driver: save() -> { key }, url(key), delete(key).
//
// Until then, selecting this driver throws a clear error at startup so you never
// silently lose uploads.

const env = require('../config/env');

// const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
// const { v4: uuidv4 } = require('uuid');
// const path = require('path');
//
// const s3 = new S3Client({
//   endpoint: env.contabo.endpoint,
//   region: env.contabo.region || 'auto',
//   forcePathStyle: true,
//   credentials: {
//     accessKeyId: env.contabo.accessKey,
//     secretAccessKey: env.contabo.secretKey,
//   },
// });
//
// function buildKey(folder, originalName) {
//   const safeFolder = String(folder || 'misc').replace(/[^a-z0-9/_-]/gi, '');
//   const ext = path.extname(originalName || '').toLowerCase();
//   return `${safeFolder}/${uuidv4()}${ext}`;
// }

const contaboStorage = {
  driver: 'contabo',

  async save(file) {
    throw new Error(
      'Contabo storage driver is not yet configured. Install @aws-sdk/client-s3, ' +
        'uncomment src/storage/contabo.js, and set the CONTABO_* env vars.'
    );
    // const key = buildKey(file.folder, file.originalName);
    // await s3.send(new PutObjectCommand({
    //   Bucket: env.contabo.bucket,
    //   Key: key,
    //   Body: file.buffer,
    //   ContentType: file.mimeType,
    //   ACL: 'public-read',
    // }));
    // return { key };
  },

  url(key) {
    if (!key) return null;
    // When configured, images are served directly from the bucket's public URL.
    return `${env.contabo.publicUrl}/${key}`;
  },

  async delete(key) {
    throw new Error('Contabo storage driver is not yet configured.');
    // await s3.send(new DeleteObjectCommand({ Bucket: env.contabo.bucket, Key: key }));
  },
};

module.exports = contaboStorage;
