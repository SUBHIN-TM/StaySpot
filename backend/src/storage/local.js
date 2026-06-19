'use strict';

// Local storage driver.
// Saves uploaded files to backend/uploads/ and records metadata in a single
// JSON file (backend/storage-data/objects.json). Returns a stable object KEY —
// the same key shape the Contabo driver will use — so swapping drivers later
// requires zero changes in controllers.

const fs = require('fs');
const fsp = require('fs/promises');
const path = require('path');
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
