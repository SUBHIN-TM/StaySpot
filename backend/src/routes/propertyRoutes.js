'use strict';

const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/propertyController');
const { requireAuth, requireRole } = require('../middleware/auth');
const { upload } = require('../middleware/upload');

// Public reads
router.get('/', ctrl.listProperties);
router.get('/:id', ctrl.getProperty);

// Owner/admin writes
router.post('/', requireAuth, requireRole('owner', 'admin'), ctrl.createProperty);
router.patch('/:id', requireAuth, ctrl.updateProperty);
router.delete('/:id', requireAuth, ctrl.deleteProperty);

router.post('/:id/images', requireAuth, upload.array('images', 10), ctrl.uploadImages);
router.delete('/:id/images/:imageId', requireAuth, ctrl.deleteImage);

module.exports = router;
