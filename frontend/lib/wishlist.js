// ───────────────────────────────────────────────────────────────────────────
// Wishlist (favorites) store — a tiny shared client-side store so every heart
// button and the Wishlist page stay in sync without each one fetching on its
// own. Talks to the backend at /api/favorites (list / add / remove).
//
// The set of favorited property IDs is loaded once, cached in memory, and any
// change is broadcast to subscribers (the heart buttons + wishlist page).
// ───────────────────────────────────────────────────────────────────────────

import { apiGet, apiPost, apiDelete } from "./api";
import { getUserToken } from "./userAuth";

let ids = null; // Set<string> of favorited property ids (null = not loaded yet)
let loadingPromise = null; // de-dupes concurrent loads
const listeners = new Set();

function notify() {
  for (const fn of listeners) fn();
}

// Subscribe to changes. Returns an unsubscribe function.
export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

// Load the current user's favorite property IDs once (cached). Logged-out users
// get an empty set. Pass force=true to refetch (e.g. after login).
export function loadWishlist(force = false) {
  const token = getUserToken();
  if (!token) {
    ids = new Set();
    notify();
    return Promise.resolve(ids);
  }
  if (ids && !force) return Promise.resolve(ids);
  if (loadingPromise && !force) return loadingPromise;

  loadingPromise = apiGet("/favorites", token)
    .then((data) => {
      ids = new Set((data.properties || []).map((p) => String(p.id)));
      loadingPromise = null;
      notify();
      return ids;
    })
    .catch(() => {
      ids = new Set();
      loadingPromise = null;
      notify();
      return ids;
    });
  return loadingPromise;
}

// Is this property currently in the wishlist?
export function isFavorited(propertyId) {
  return ids ? ids.has(String(propertyId)) : false;
}

// How many items are in the wishlist (0 if not loaded).
export function wishlistCount() {
  return ids ? ids.size : 0;
}

// Has the wishlist finished loading at least once?
export function wishlistReady() {
  return ids !== null;
}

// Toggle a property in the wishlist. Optimistic: flips locally + notifies first,
// then calls the API and rolls back if it fails. Throws "LOGIN_REQUIRED" when
// the user isn't logged in so callers can redirect to /login.
export async function toggleFavorite(propertyId) {
  const token = getUserToken();
  if (!token) throw new Error("LOGIN_REQUIRED");
  if (!ids) await loadWishlist();

  const key = String(propertyId);
  const wasFav = ids.has(key);

  // Optimistic update.
  if (wasFav) ids.delete(key);
  else ids.add(key);
  notify();

  try {
    if (wasFav) await apiDelete(`/favorites/${propertyId}`, token);
    else await apiPost(`/favorites/${propertyId}`, {}, token);
  } catch (err) {
    // Roll back on failure.
    if (wasFav) ids.add(key);
    else ids.delete(key);
    notify();
    throw err;
  }
  return !wasFav; // new state
}

// Clear the cache (e.g. on logout) so the next load refetches.
export function resetWishlist() {
  ids = null;
  loadingPromise = null;
  notify();
}

// ── Pending wishlist (logged-out → login handoff) ──────────────────────────
// When a logged-out user taps a heart, we remember the property here and send
// them to /login. After they sign in, the login page calls consumePending() to
// actually save it — so they don't have to find the listing again.
const PENDING_KEY = "staymate_pending_wishlist";

export function setPendingWishlist(propertyId) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(PENDING_KEY, String(propertyId));
  } catch {
    /* ignore storage errors */
  }
}

// Called right after a successful login (with the fresh token). If a property
// was pending, add it to the user's favorites and clear it. Returns the id (or
// null). Safe to call when nothing is pending.
export async function consumePendingWishlist(token) {
  if (typeof window === "undefined") return null;
  let id = null;
  try {
    id = localStorage.getItem(PENDING_KEY);
    localStorage.removeItem(PENDING_KEY);
  } catch {
    /* ignore storage errors */
  }
  if (!id || !token) return null;
  try {
    await apiPost(`/favorites/${id}`, {}, token);
    if (ids) {
      ids.add(String(id));
      notify();
    }
  } catch {
    /* if it fails, the user can re-tap the heart on the page they land on */
  }
  return id;
}
