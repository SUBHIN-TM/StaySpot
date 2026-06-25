// Bundled canonical geography for the property form (mirrors the backend's
// config/geo.js). Kerala only for now — the State picker is locked, but kept as
// a field so more states can be switched on later without reworking the form.

export const STATES = {
  Kerala: [
    "Thiruvananthapuram",
    "Kollam",
    "Pathanamthitta",
    "Alappuzha",
    "Kottayam",
    "Idukki",
    "Ernakulam",
    "Thrissur",
    "Palakkad",
    "Malappuram",
    "Kozhikode",
    "Wayanad",
    "Kannur",
    "Kasaragod",
  ],
};

export const DEFAULT_STATE = "Kerala";
export const STATE_LIST = Object.keys(STATES);

export function districtsOf(state) {
  return STATES[state] || [];
}
