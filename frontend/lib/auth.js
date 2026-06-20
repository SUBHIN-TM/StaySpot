// ───────────────────────────────────────────────────────────────────────────
// Simple auth storage for the admin area.
// We keep the logged-in admin's JWT token + basic info in the browser's
// localStorage. This is the easiest approach for a dashboard SPA.
// (These functions only run in the browser — guard against server rendering.)
// ───────────────────────────────────────────────────────────────────────────

const TOKEN_KEY = "staymate_admin_token";
const USER_KEY = "staymate_admin_user";

// Save the token + user after a successful login.
export function saveAuth(token, user) {
  if (typeof window === "undefined") return;
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

// Read the saved token (or null if not logged in).
export function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

// Read the saved admin user object (or null).
export function getUser() {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(USER_KEY);
  return raw ? JSON.parse(raw) : null;
}

// Clear everything on logout.
export function clearAuth() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}
