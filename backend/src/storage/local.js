'use strict';

// Local storage driver.
// Saves uploaded files to backend/uploads/ and records metadata in a single
// JSON file (backend/storage-data/objects.json). Returns a stable object KEY —
// the same key shape the Contabo driver will use — so swapping drivers later
// requires zero changes in controllers.

const fs = require('fs');
const fsp = require('fs/promises');
const path = require('path');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const env = require('../config/env');

const UPLOAD_DIR = path.resolve(__dirname, '..', '..', 'uploads');
const DATA_DIR = path.resolve(__dirname, '..', '..', 'storage-data');
const INDEX_FILE = path.join(DATA_DIR, 'objects.json');

function ensureDirs() {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(INDEX_FILE)) {
    fs.writeFileSync(INDEX_FILE, JSON.stringify({}, null, 2));
  }
}
ensureDirs();

async function readIndex() {
  try {
    return JSON.parse(await fsp.readFile(INDEX_FILE, 'utf8'));
  } catch {
    return {};
  }
}

async function writeIndex(index) {
  await fsp.writeFile(INDEX_FILE, JSON.stringify(index, null, 2));
}

function extFromName(name = '') {
  const ext = path.extname(name).toLowerCase();
  return /^\.[a-z0-9]{1,5}$/.test(ext) ? ext : '';
}

// Build a key like "properties/2026/ab12cd34.jpg". Folder is sanitised.
function buildKey(folder, originalName) {
  const safeFolder = String(folder || 'misc').replace(/[^a-z0-9/_-]/gi, '').replace(/^\/+|\/+$/g, '');
  return `${safeFolder}/${uuidv4()}${extFromName(originalName)}`;
}

// The local driver has no real presigned URLs, so we emulate them: the browser
// PUTs the file to OUR own /api/uploads/local sink, and we authenticate that
// write with a short HMAC signature over the key (instead of a login token).
// This keeps the frontend's direct-upload flow identical in dev and prod.
function signKey(key) {
  return crypto.createHmac('sha256', env.jwtSecret).update(key).digest('hex');
}

function verifyUploadSig(key, sig) {
  if (!key || !sig) return false;
  const expected = signKey(key);
  // Constant-time compare (both hex strings of equal length).
  return sig.length === expected.length && crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
}

const localStorage = {
  driver: 'local',

  /**
   * Persist a file buffer. Returns { key }.
   * @param {{ buffer: Buffer, originalName?: string, mimeType?: string, folder?: string }} file
   */
  async save(file) {
    const key = buildKey(file.folder, file.originalName);
    const dest = path.join(UPLOAD_DIR, key);
    await fsp.mkdir(path.dirname(dest), { recursive: true });
    await fsp.writeFile(dest, file.buffer);

    const index = await readIndex();
    index[key] = {
      originalName: file.originalName || null,
      mimeType: file.mimeType || 'application/octet-stream',
      size: file.buffer.length,
      createdAt: new Date().toISOString(),
    };
    await writeIndex(index);

    return { key };
  },

  /**
   * Direct-upload flow (local emulation of a presigned URL). Returns a key plus
   * a signed PUT URL pointing at our own /api/uploads/local sink. See signKey().
   * @param {{ folder?: string, originalName?: string, mimeType?: string }} file
   * @returns {Promise<{ key, uploadUrl, method, headers }>}
   */
  async presignPut(file) {
    const key = buildKey(file.folder, file.originalName);
    const sig = signKey(key);
    const uploadUrl =
      `${env.publicBaseUrl}/api/uploads/local` +
      `?key=${encodeURIComponent(key)}&sig=${sig}`;
    const headers = file.mimeType ? { 'Content-Type': file.mimeType } : {};
    return { key, uploadUrl, method: 'PUT', headers };
  },

  /** Validate the HMAC signature on a local direct-upload PUT. */
  verifyUploadSig,

  /**
   * Write a buffer to an EXACT key (used by the local PUT sink — the key was
   * already chosen by presignPut, so we don't generate a new one here).
   */
  async saveAtKey(key, buffer, mimeType) {
    const dest = path.join(UPLOAD_DIR, key);
    await fsp.mkdir(path.dirname(dest), { recursive: true });
    await fsp.writeFile(dest, buffer);

    const index = await readIndex();
    index[key] = {
      originalName: null,
      mimeType: mimeType || 'application/octet-stream',
      size: buffer.length,
      createdAt: new Date().toISOString(),
    };
    await writeIndex(index);
    return { key };
  },

  /** Full public URL the client can load. Served by Express at /uploads/:key. */
  url(key) {
    if (!key) return null;
    return `${env.publicBaseUrl}/uploads/${key}`;
  },

  /** Remove a stored object. Silent if it doesn't exist. */
  async delete(key) {
    if (!key) return;
    const dest = path.join(UPLOAD_DIR, key);
    await fsp.rm(dest, { force: true });
    const index = await readIndex();
    if (index[key]) {
      delete index[key];
      await writeIndex(index);
    }
  },

  /** Absolute path on disk for a key (used by the static file route). */
  absolutePath(key) {
    return path.join(UPLOAD_DIR, key);
  },

  uploadDir: UPLOAD_DIR,
};

module.exports = localStorage;
