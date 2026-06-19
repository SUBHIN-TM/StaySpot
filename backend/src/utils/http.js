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

module.exports = { asyncHandler, ApiError };
