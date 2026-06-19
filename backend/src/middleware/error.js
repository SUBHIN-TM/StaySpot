'use strict';

const { ApiError } = require('../utils/http');

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

  if (status >= 500) {
    console.error('[error]', err);
  }

  res.status(status).json({
    error: message,
    ...(err.details ? { details: err.details } : {}),
  });
}

module.exports = { notFound, errorHandler };
