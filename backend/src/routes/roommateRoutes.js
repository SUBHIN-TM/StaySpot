'use strict';

const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/roommateController');
const { requireAuth, requireRole } = require('../middleware/auth');

router.get('/', ctrl.listPosts);
// Admin moderation list — MUST be registered before "/:id" so it isn't captured.
router.get('/admin/all', requireAuth, requireRole('admin'), ctrl.listAllPosts);
router.get('/:id', ctrl.getPost);
router.post('/', requireAuth, ctrl.createPost);
router.patch('/:id', requireAuth, ctrl.updatePost);
router.delete('/:id', requireAuth, ctrl.deletePost);

module.exports = router;
