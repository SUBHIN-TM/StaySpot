'use strict';

const { verifyToken } = require('../utils/jwt');
const { ApiError } = require('../utils/http');
const { query } = require('../config/db');

// Extracts a bearer token from the Authorization header.
function getToken(req) {
  const header = req.headers.authorization || '';
  if (header.startsWith('Bearer ')) return header.slice(7).trim();
  return null;
}

// Requires a valid JWT; attaches req.user = { id, role, email }.
async function requireAuth(req, res, next) {
  const token = getToken(req);
  if (!token) return next(new ApiError(401, 'Authentication required'));

  // 1. Verify the token itself. ONLY a genuine token problem (bad signature /
  //    expired) is an auth failure — don't let other errors fall through here.
  let decoded;
  try {
    decoded = verifyToken(token);
  } catch (err) {
    return next(new ApiError(401, 'Invalid or expired session — please log in again'));
  }

  // 2. Look the user up. A DB/network error here is NOT an auth problem, so let
  //    it surface as a real server error instead of a misleading "invalid token"
  //    (which made it look like a fresh login had failed).
  try {
    const { rows } = await query(
      'SELECT id, email, role, name, is_blocked FROM users WHERE id = $1',
      [decoded.sub]
    );
    if (!rows[0]) return next(new ApiError(401, 'User no longer exists'));
    if (rows[0].is_blocked) return next(new ApiError(403, 'Your account has been blocked'));

    req.user = rows[0];
    next();
  } catch (err) {
    return next(err); // e.g. DB unreachable → handled as a 500, not a 401
  }
}

// Restricts a route to specific roles. Use after requireAuth.
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new ApiError(403, 'You do not have permission to do that'));
    }
    next();
  };
}

module.exports = { requireAuth, requireRole, getToken };
