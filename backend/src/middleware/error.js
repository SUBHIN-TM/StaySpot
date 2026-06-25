'use strict';

const { ApiError } = require('../utils/http');
const { logError } = require('../utils/logger');

// 404 for unmatched routes.
function notFound(req, res, next) {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
}

// Central error handler. Must have 4 args for Express to treat it as such.
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  let status = err.status || 500;
  let message = err.message || 'Internal server error';

  // Postgres unique-violation -> 409
  if (err.code === '23505') {
    status = 409;
    message = 'A record with these details already exists';
  }
  // Postgres FK violation -> 400
  if (err.code === '23503') {
    status = 400;
    message = 'Referenced record does not exist';
  }

  // Only real server faults (5xx) are worth logging to the file — 4xx are
  // expected client mistakes (bad input, wrong password) and would be noise.
  if (status >= 500) {
    console.error('[error]', err);
    logError(`${req.method} ${req.originalUrl}`, err);
  }

  res.status(status).json({
    error: message,
    ...(err.details ? { details: err.details } : {}),
  });
}

module.exports = { notFound, errorHandler };
