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

// GET a JSON resource. Pass a token to send the Authorization header.
export async function apiGet(path, token) {
  const res = await fetch(`${API}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    cache: "no-store", // always fetch fresh data (no caching)
  });
  return handle(res);
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
