'use strict';

const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/propertyController');
const { requireAuth, requireRole } = require('../middleware/auth');
const { upload, uploadVideo } = require('../middleware/upload');

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

router.post('/:id/images', requireAuth, upload.array('images', 10), ctrl.uploadImages);
router.post('/:id/video', requireAuth, requireRole('owner', 'admin'), uploadVideo.single('video'), ctrl.uploadVideo);
router.patch('/:id/images/order', requireAuth, ctrl.reorderImages);
router.delete('/:id/images/:imageId', requireAuth, ctrl.deleteImage);

module.exports = router;
