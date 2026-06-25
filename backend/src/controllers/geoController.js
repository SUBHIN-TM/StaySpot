'use strict';

// Geography helpers for the property form.
//   GET /api/geo/states            → bundled states + districts (for dropdowns)
//   GET /api/geo/pincode/:pincode  → autofill state/district/areas from a PIN
//
// The pincode lookup proxies the FREE India Post API (api.postalpincode.in, no
// key). We proxy it server-side so we can cache results and normalise the
// district to our canonical spelling.

const { asyncHandler, ApiError } = require('../utils/http');
const geo = require('../config/geo');
const { listByPincode } = require('../services/localities');

// GET /api/geo/states — the bundled dataset (Kerala only for now).
const getStates = asyncHandler(async (req, res) => {
  res.json({ states: geo.listStates(), districts: geo.STATES });
});

// GET /api/geo/localities?pincode=682030 — owner-curated localities for the
// Town/Locality dropdown, scoped to the pincode.
const getLocalities = asyncHandler(async (req, res) => {
  const pincode = String(req.query.pincode || '').trim();
  res.json({ localities: pincode ? await listByPincode(pincode) : [] });
});

// Tiny in-memory cache: pincodes never change, so cache forever for this process.
const pinCache = new Map();

// GET /api/geo/pincode/:pincode
const lookupPincode = asyncHandler(async (req, res) => {
  const pincode = String(req.params.pincode || '').trim();
  if (!/^\d{6}$/.test(pincode)) throw new ApiError(400, 'Pincode must be 6 digits');

  if (pinCache.has(pincode)) return res.json(pinCache.get(pincode));

  // Call the free India Post API with a short timeout so a slow/down service
  // can't hang the request — the form falls back to manual dropdowns.
  let payload = { found: false, pincode, state: null, district: null, areas: [] };
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4000);
    const resp = await fetch(`https://api.postalpincode.in/pincode/${pincode}`, {
      signal: controller.signal,
    });
    clearTimeout(timer);
    const data = await resp.json();
    const entry = Array.isArray(data) ? data[0] : null;

    if (entry && entry.Status === 'Success' && Array.isArray(entry.PostOffice) && entry.PostOffice.length) {
      const offices = entry.PostOffice;
      const state = offices[0].State || null;
      const rawDistrict = offices[0].District || null;
      payload = {
        found: true,
        pincode,
        state,
        // Normalise to our canonical spelling when the state is one we know.
        district: geo.canonicalDistrict(state, rawDistrict) || rawDistrict,
        areas: [...new Set(offices.map((o) => o.Name).filter(Boolean))],
      };
    }
  } catch (err) {
    // Network/timeout/parse failure — return "not found" so the UI degrades
    // gracefully to manual entry. Don't surface a 500 for a flaky third party.
    console.warn('[geo] pincode lookup failed for', pincode, '-', err.message);
  }

  pinCache.set(pincode, payload);
  res.json(payload);
});

module.exports = { getStates, getLocalities, lookupPincode };
