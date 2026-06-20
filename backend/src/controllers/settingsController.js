'use strict';

const { asyncHandler } = require('../utils/http');
const { getAllSettings, setSetting } = require('../services/settings');

// GET /api/settings  (admin) — current settings as a flat object.
const getSettings = asyncHandler(async (req, res) => {
  res.json({ settings: await getAllSettings() });
});

// PATCH /api/settings  (admin) — update known settings.
const updateSettings = asyncHandler(async (req, res) => {
  const { auto_approve_listings } = req.body || {};
  if (auto_approve_listings !== undefined) {
    await setSetting('auto_approve_listings', auto_approve_listings ? 'true' : 'false');
  }
  res.json({ settings: await getAllSettings() });
});

module.exports = { getSettings, updateSettings };
