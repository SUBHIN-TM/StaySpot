// ───────────────────────────────────────────────────────────────────────────
// Tiny API helper for talking to the StayMate backend.
// Used by both server components (landing page) and client components (admin).
// Keep it simple: just thin wrappers around fetch().
// ───────────────────────────────────────────────────────────────────────────

// Where the backend lives. Set in .env.local (NEXT_PUBLIC_API_URL).
export const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

// All REST routes live under /api on the backend.
const API = `${API_BASE}/api`;

// Build a full image URL from a stored object key (e.g. "abc123.jpg").
export function imageUrl(key) {
  if (!key) return null;
  if (key.startsWith("http")) return key; // already a full URL
  return `${API_BASE}/uploads/${key}`;
}

// How many extra tries a GET gets when the *connection* fails (not when the
// server returns an HTTP error), plus a per-attempt timeout. This guards
// against the classic intermittent failure of server-side fetches: Next's
// fetch (undici) reuses a pooled keep-alive socket that the backend has since
// closed, so the request dies with ECONNRESET / "fetch failed". A retry opens
// a fresh socket and almost always succeeds — which is why the empty-state was
// only showing up *sometimes*.
const GET_RETRIES = 2;
const GET_TIMEOUT_MS = 6000;

// True only for transient connection/timeout failures that are worth retrying.
// HTTP errors (thrown by handle() with a status message) are deterministic and
// must NOT be retried.
function isTransient(err) {
  if (!err) return false;
  if (err.name === "AbortError") return true; // our own timeout fired
  if (err instanceof TypeError) return true; // undici wraps socket errors here
  const code = err.cause?.code || err.code;
  return ["ECONNRESET", "ECONNREFUSED", "UND_ERR_SOCKET", "ETIMEDOUT", "EPIPE"].includes(
    code
  );
}

// GET a JSON resource. Pass a token to send the Authorization header.
// Safe to retry because GET is idempotent (unlike POST/PATCH/DELETE below).
export async function apiGet(path, token) {
  let lastErr;
  for (let attempt = 0; attempt <= GET_RETRIES; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), GET_TIMEOUT_MS);
    try {
      const res = await fetch(`${API}${path}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        cache: "no-store", // always fetch fresh data (no caching)
        signal: controller.signal,
      });
      clearTimeout(timer);
      return await handle(res); // HTTP errors throw here and are NOT retried
    } catch (err) {
      clearTimeout(timer);
      lastErr = err;
      if (!isTransient(err) || attempt === GET_RETRIES) break;
      // Brief backoff, then try again on a fresh connection.
      await new Promise((r) => setTimeout(r, 150 * (attempt + 1)));
    }
  }
  throw lastErr;
}

// POST JSON to the backend. Pass a token for protected routes.
export async function apiPost(path, body, token) {
  const res = await fetch(`${API}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  return handle(res);
}

// PATCH JSON (used to update the profile).
export async function apiPatch(path, body, token) {
  const res = await fetch(`${API}${path}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  return handle(res);
}

// DELETE a resource.
export async function apiDelete(path, token) {
  const res = await fetch(`${API}${path}`, {
    method: "DELETE",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  return handle(res);
}

// Upload files (multipart/form-data). Pass a FormData object.
// Don't set Content-Type — the browser adds the correct multipart boundary.
export async function apiUpload(path, formData, token) {
  const res = await fetch(`${API}${path}`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });
  return handle(res);
}

// Direct-to-storage upload. `presigned` is the object returned by
// POST /uploads/presign — { uploadUrl, method, headers }. The file's bytes go
// straight to object storage (Contabo), or the local sink in dev.
//
// Uses XMLHttpRequest (not fetch) because only XHR exposes upload progress.
// `onProgress` is called with a 0–100 percentage as the file uploads.
export function uploadToPresignedUrl(presigned, file, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open(presigned.method || "PUT", presigned.uploadUrl);
    for (const [k, v] of Object.entries(presigned.headers || {})) {
      xhr.setRequestHeader(k, v);
    }
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else reject(new Error(`Upload failed (${xhr.status})`));
    };
    xhr.onerror = () => reject(new Error("Upload failed (network or CORS)"));
    xhr.send(file);
  });
}

// Shared response handler: parse JSON and throw a readable error on failure.
async function handle(res) {
  let data = null;
  try {
    data = await res.json();
  } catch {
    // some responses (e.g. 204) have no body — that's fine
  }
  if (!res.ok) {
    const message = (data && (data.message || data.error)) || `Request failed (${res.status})`;
    throw new Error(message);
  }
  return data;
}
