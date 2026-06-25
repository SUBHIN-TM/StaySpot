'use strict';

// ── Canonical geography (bundled dataset — no external API) ──────────────────
// Single source of truth for the State/District dropdowns and for validating
// what owners submit. Kerala only for now; add more states here later and the
// dropdowns + validation pick them up automatically.

const STATES = {
  Kerala: [
    'Thiruvananthapuram',
    'Kollam',
    'Pathanamthitta',
    'Alappuzha',
    'Kottayam',
    'Idukki',
    'Ernakulam',
    'Thrissur',
    'Palakkad',
    'Malappuram',
    'Kozhikode',
    'Wayanad',
    'Kannur',
    'Kasaragod',
  ],
};

const DEFAULT_STATE = 'Kerala';

function listStates() {
  return Object.keys(STATES);
}

function districtsOf(state) {
  return STATES[state] || [];
}

// Case-insensitive match → returns the canonical spelling, or null. Used to
// normalise both owner input and values that come back from the pincode API.
function canonicalDistrict(state, district) {
  if (!district) return null;
  const want = String(district).trim().toLowerCase();
  return districtsOf(state).find((d) => d.toLowerCase() === want) || null;
}

function isValidState(state) {
  return Object.prototype.hasOwnProperty.call(STATES, state);
}

module.exports = {
  STATES,
  DEFAULT_STATE,
  listStates,
  districtsOf,
  canonicalDistrict,
  isValidState,
};
