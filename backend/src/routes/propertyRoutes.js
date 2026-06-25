'use strict';

const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/propertyController');
const { requireAuth, requireRole } = require('../middleware/auth');

// Owner: all their own properties (must come BEFORE "/:id" so "mine" isn't an id).
router.get('/mine', requireAuth, ctrl.listMine);
// Admin: every property.
router.get('/all', requireAuth, requireRole('admin'), ctrl.listAll);

// Public reads
router.get('/', ctrl.listProperties);
router.get('/:id', ctrl.getProperty);

// Owner/admin writes
router.post('/', requireAuth, requireRole('owner', 'admin'), ctrl.createProperty);
router.patch('/:id', requireAuth, ctrl.updateProperty);
router.patch('/:id/approval', requireAuth, requireRole('admin'), ctrl.setApproval);
router.delete('/:id', requireAuth, ctrl.deleteProperty);

// Media is uploaded directly to storage by the browser; these just attach keys.
router.post('/:id/images', requireAuth, ctrl.uploadImages);
router.post('/:id/video', requireAuth, requireRole('owner', 'admin'), ctrl.uploadVideo);
router.patch('/:id/images/order', requireAuth, ctrl.reorderImages);
router.delete('/:id/images/:imageId', requireAuth, ctrl.deleteImage);

module.exports = router;
