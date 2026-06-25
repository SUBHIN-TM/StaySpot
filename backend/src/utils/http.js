'use strict';

// Wraps an async route handler so thrown errors reach the Express error handler.
function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

// A thrown ApiError produces a clean JSON response with the right status code.
class ApiError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

// Reject if a promise doesn't settle within `ms`. Used to put a hard ceiling on
// calls to flaky externals (e.g. Google token verification) so a slow upstream
// can't hang a request forever (which would surface as a gateway 502/504).
function withTimeout(promise, ms, message = 'Operation timed out') {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new ApiError(504, message)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

module.exports = { asyncHandler, ApiError, withTimeout };
