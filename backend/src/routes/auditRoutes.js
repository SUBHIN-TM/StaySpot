'use strict';

const express = require('express');
const router = express.Router();
const { getHistory } = require('../controllers/auditController');
const { requireAuth, requireRole } = require('../middleware/auth');

// Admin-only edit history for a user or property.
router.get('/:entityType/:entityId', requireAuth, requireRole('admin'), getHistory);

module.exports = router;
