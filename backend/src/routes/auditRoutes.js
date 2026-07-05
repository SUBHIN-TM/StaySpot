'use strict';

const express = require('express');
const router = express.Router();
const { getHistory, listActivity } = require('../controllers/auditController');
const { requireAuth, requireRole } = require('../middleware/auth');

// Admin-only GLOBAL activity feed (all users/owners/listings). Registered before
// the param route so "/" isn't captured by "/:entityType/:entityId".
router.get('/', requireAuth, requireRole('admin'), listActivity);
// Admin-only edit history for a single user or property.
router.get('/:entityType/:entityId', requireAuth, requireRole('admin'), getHistory);

module.exports = router;
