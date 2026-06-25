'use strict';

// Contabo Object Storage driver (S3-compatible).
//
// Exposes the SAME interface as the local driver — save() -> { key },
// url(key), delete(key) — so controllers never care which driver is active.
// Switch on with STORAGE_DRIVER=contabo and the CONTABO_* env vars in .env.
//
// Object keys are organised by folder, e.g. "image/<uuid>.jpg",
// "video/<uuid>.mp4" — the folder is passed by the controller in file.folder.

const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const env = require('../config/env');

// Presigned PUT URLs expire after 10 minutes — long enough to upload a video,
// short enough that a leaked URL is useless soon after.
const PRESIGN_EXPIRES_SECONDS = 10 * 60;

// Contabo is S3-compatible but NOT AWS: it needs a custom endpoint and
// path-style URLs (bucket in the path, not the hostname).
const s3 = new S3Client({
  endpoint: env.contabo.endpoint,
  region: env.contabo.region || 'auto',
  forcePathStyle: true,
  credentials: {
    accessKeyId: env.contabo.accessKey,
    secretAccessKey: env.contabo.secretKey,
  },
});

function extFromName(name = '') {
  const ext = path.extname(name).toLowerCase();
  return /^\.[a-z0-9]{1,5}$/.test(ext) ? ext : '';
}

// Build a key like "image/ab12cd34.jpg". Folder is sanitised.
function buildKey(folder, originalName) {
  const safeFolder = String(folder || 'misc')
    .replace(/[^a-z0-9/_-]/gi, '')
    .replace(/^\/+|\/+$/g, '');
  return `${safeFolder}/${uuidv4()}${extFromName(originalName)}`;
}

const contaboStorage = {
  driver: 'contabo',

  /**
   * Upload a file buffer to the bucket. Returns { key }.
   * @param {{ buffer: Buffer, originalName?: string, mimeType?: string, folder?: string }} file
   */
  async save(file) {
    const key = buildKey(file.folder, file.originalName);
    await s3.send(
      new PutObjectCommand({
        Bucket: env.contabo.bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimeType || 'application/octet-stream',
        ACL: 'public-read', // bucket must allow public read for these URLs to work
      })
    );
    return { key };
  },

  /**
   * Direct-upload flow: hand the browser a presigned URL so it uploads the file
   * straight to Contabo (the backend never touches the bytes). Returns the key
   * plus everything the browser needs to PUT the file.
   *
   * The browser MUST send back the headers we return here verbatim — they are
   * part of what the signature covers, so a mismatch is rejected by Contabo.
   * @param {{ folder?: string, originalName?: string, mimeType?: string }} file
   * @returns {Promise<{ key, uploadUrl, method, headers }>}
   */
  async presignPut(file) {
    const key = buildKey(file.folder, file.originalName);
    const contentType = file.mimeType || 'application/octet-stream';
    const command = new PutObjectCommand({
      Bucket: env.contabo.bucket,
      Key: key,
      ContentType: contentType,
      ACL: 'public-read', // signed in — the browser must echo x-amz-acl below
    });
    const uploadUrl = await getSignedUrl(s3, command, { expiresIn: PRESIGN_EXPIRES_SECONDS });
    return {
      key,
      uploadUrl,
      method: 'PUT',
      headers: { 'Content-Type': contentType, 'x-amz-acl': 'public-read' },
    };
  },

  /** Full public URL the client can load (CONTABO_PUBLIC_URL + key). */
  url(key) {
    if (!key) return null;
    return `${env.contabo.publicUrl}/${key}`;
  },

  /** Remove a stored object. Silent if it doesn't exist. */
  async delete(key) {
    if (!key) return;
    await s3.send(new DeleteObjectCommand({ Bucket: env.contabo.bucket, Key: key }));
  },
};

module.exports = contaboStorage;
