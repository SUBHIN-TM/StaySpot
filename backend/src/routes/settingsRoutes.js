'use strict';

const express = require('express');
const router = express.Router();
const { getSettings, updateSettings, flushPending } = require('../controllers/settingsController');
const { requireAuth, requireRole } = require('../middleware/auth');

router.get('/', requireAuth, requireRole('admin'), getSettings);
router.patch('/', requireAuth, requireRole('admin'), updateSettings);
router.post('/flush-pending', requireAuth, requireRole('admin'), flushPending);

module.exports = router;
