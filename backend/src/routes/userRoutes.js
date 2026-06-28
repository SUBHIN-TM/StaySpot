'use strict';

const express = require('express');
const router = express.Router();
const { getUser, updateMe, submitPhone, uploadAvatar, listUsers, verifyPhone, deleteUser, setBlocked } =
  require('../controllers/userController');
const { requireAuth, requireRole } = require('../middleware/auth');
const { upload } = require('../middleware/upload');

// Admin: list all users (optional ?role=) — must come before "/:id".
router.get('/', requireAuth, requireRole('admin'), listUsers);

router.patch('/me', requireAuth, updateMe);
router.post('/me/phone', requireAuth, submitPhone); // owner submits number for verification
router.post('/me/avatar', requireAuth, upload.single('image'), uploadAvatar);
router.get('/:id', getUser);
router.patch('/:id/block', requireAuth, requireRole('admin'), setBlocked);
router.patch('/:id/verify-phone', requireAuth, requireRole('admin'), verifyPhone); // admin confirms a call
router.delete('/:id', requireAuth, requireRole('admin'), deleteUser);

module.exports = router;
