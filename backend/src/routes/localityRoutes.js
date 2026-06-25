'use strict';

const express = require('express');
const router = express.Router();
const { getLocalities, mergePreview, merge, rename, remove } = require('../controllers/localityController');
const { requireAuth, requireRole } = require('../middleware/auth');

// Admin-only locality management (merge/rename/delete duplicates).
router.get('/', requireAuth, requireRole('admin'), getLocalities);
router.post('/merge/preview', requireAuth, requireRole('admin'), mergePreview);
router.post('/merge', requireAuth, requireRole('admin'), merge);
router.patch('/:id', requireAuth, requireRole('admin'), rename);
router.delete('/:id', requireAuth, requireRole('admin'), remove);

module.exports = router;
