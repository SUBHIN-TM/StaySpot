'use strict';

const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/uploadController');
const { requireAuth, requireRole } = require('../middleware/auth');

// Current max upload sizes, so the browser can validate before uploading.
router.get('/limits', requireAuth, requireRole('owner', 'admin'), ctrl.limits);

// Mint a presigned upload URL (owners/admins attaching property media).
router.post('/presign', requireAuth, requireRole('owner', 'admin'), ctrl.presign);

// Cancel a still-pending upload (attachment removed before submit).
router.post('/cancel', requireAuth, ctrl.cancel);

// Local-driver-only sink for direct uploads in dev. Raw body (the file bytes);
// limit a touch above the 50 MB video cap. No requireAuth — the signed query
// string is the credential (see uploadController.localPut).
router.put('/local', express.raw({ type: '*/*', limit: '60mb' }), ctrl.localPut);

module.exports = router;
