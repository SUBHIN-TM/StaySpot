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

// Local-driver sink for direct uploads (our own "S3 bucket"). Raw body (the
// file bytes). The hard cap matches nginx's client_max_body_size (100M); the
// real admin-configured limit is checked in uploadController.localPut.
// No requireAuth — the signed query string is the credential.
router.put('/local', express.raw({ type: '*/*', limit: '100mb' }), ctrl.localPut);

// Signed delete, used by backends running the "server" driver (dev PCs).
router.delete('/local', ctrl.localDelete);

module.exports = router;
