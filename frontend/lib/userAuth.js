// ───────────────────────────────────────────────────────────────────────────
// Auth storage for regular USERS (seekers/owners) who sign in with Google.
// Kept separate from the admin auth (lib/auth.js) so the two never clash.
// The logged-in user's JWT + profile live in the browser's localStorage.
// ───────────────────────────────────────────────────────────────────────────

const TOKEN_KEY = "staymate_user_token";
const USER_KEY = "staymate_user";

export function saveUser(token, user) {
  if (typeof window === "undefined") return;
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function getUserToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function getCurrentUser() {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(USER_KEY);
  return raw ? JSON.parse(raw) : null;
}

export function clearUser() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}
