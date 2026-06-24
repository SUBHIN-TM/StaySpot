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

// Read a safe "return to" path from the current URL (?next=/some/page), used so
// login/signup can send the user back to the page they came from. Only relative
// paths (starting with a single "/") are allowed — this blocks open-redirects to
// other sites. Falls back to "/" (home) when there's no valid next.
export function getNextPath(fallback = "/") {
  if (typeof window === "undefined") return fallback;
  const n = new URLSearchParams(window.location.search).get("next");
  return n && n.startsWith("/") && !n.startsWith("//") ? n : fallback;
}
