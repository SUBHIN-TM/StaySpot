'use strict';

const express = require('express');
const router = express.Router();
const { getUser, updateMe, uploadAvatar, listUsers, deleteUser, setBlocked } =
  require('../controllers/userController');
const { requireAuth, requireRole } = require('../middleware/auth');
const { upload } = require('../middleware/upload');

// Admin: list all users (optional ?role=) — must come before "/:id".
router.get('/', requireAuth, requireRole('admin'), listUsers);

router.patch('/me', requireAuth, updateMe);
router.post('/me/avatar', requireAuth, upload.single('image'), uploadAvatar);
router.get('/:id', getUser);
router.patch('/:id/block', requireAuth, requireRole('admin'), setBlocked);
router.delete('/:id', requireAuth, requireRole('admin'), deleteUser);

module.exports = router;
