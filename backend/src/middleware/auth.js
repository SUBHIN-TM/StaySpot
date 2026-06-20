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
  try {
    const token = getToken(req);
    if (!token) throw new ApiError(401, 'Authentication required');

    const decoded = verifyToken(token);
    const { rows } = await query(
      'SELECT id, email, role, name, is_blocked FROM users WHERE id = $1',
      [decoded.sub]
    );
    if (!rows[0]) throw new ApiError(401, 'User no longer exists');
    if (rows[0].is_blocked) throw new ApiError(403, 'Your account has been blocked');

    req.user = rows[0];
    next();
  } catch (err) {
    if (err instanceof ApiError) return next(err);
    return next(new ApiError(401, 'Invalid or expired token'));
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
