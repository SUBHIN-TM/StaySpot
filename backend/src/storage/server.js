'use strict';

// "Server" storage driver: files live in the uploads/ folder of OUR VPS backend,
// even when this backend runs somewhere else (e.g. a dev PC).
//
// The VPS backend runs the "local" driver (files on its own disk). This driver
// talks to it over HTTP, using the same HMAC signatures (keyed by JWT_SECRET,
// so both backends MUST share the same JWT_SECRET):
//   - presignPut -> a signed PUT URL on the VPS (/api/uploads/local)
//   - save       -> we PUT the buffer to that same URL ourselves (avatars)
//   - url        -> <UPLOAD_SERVER_URL>/uploads/<key>
//   - delete     -> signed DELETE /api/uploads/local on the VPS
//
// Turn on with STORAGE_DRIVER=server and UPLOAD_SERVER_URL in .env.

const env = require('../config/env');
const { buildKey, signKey, signDelete } = require('./local');

const base = env.uploadServerUrl;

function sinkUrl(key, sig) {
  return `${base}/api/uploads/local?key=${encodeURIComponent(key)}&sig=${sig}`;
}

// Throw a readable error when the VPS rejects a request.
async function check(res, what) {
  if (res.ok) return;
  const text = await res.text().catch(() => '');
  throw new Error(`[storage:server] ${what} failed: ${res.status} ${text}`);
}

const serverStorage = {
  driver: 'server',

  /**
   * Upload a file buffer to the VPS. Returns { key }.
   * @param {{ buffer: Buffer, originalName?: string, mimeType?: string, folder?: string }} file
   */
  async save(file) {
    const key = buildKey(file.folder, file.originalName);
    const res = await fetch(sinkUrl(key, signKey(key)), {
      method: 'PUT',
      headers: { 'Content-Type': file.mimeType || 'application/octet-stream' },
      body: file.buffer,
    });
    await check(res, `upload ${key}`);
    return { key };
  },

  /**
   * Direct-upload flow: the browser PUTs the file straight to the VPS.
   * @param {{ folder?: string, originalName?: string, mimeType?: string }} file
   * @returns {Promise<{ key, uploadUrl, method, headers }>}
   */
  async presignPut(file) {
    const key = buildKey(file.folder, file.originalName);
    const headers = file.mimeType ? { 'Content-Type': file.mimeType } : {};
    return { key, uploadUrl: sinkUrl(key, signKey(key)), method: 'PUT', headers };
  },

  /** Full public URL the client can load (served by the VPS backend). */
  url(key) {
    if (!key) return null;
    return `${base}/uploads/${key}`;
  },

  /** Remove a stored object on the VPS. Silent if it doesn't exist. */
  async delete(key) {
    if (!key) return;
    const res = await fetch(sinkUrl(key, signDelete(key)), { method: 'DELETE' });
    await check(res, `delete ${key}`);
  },
};

module.exports = serverStorage;
