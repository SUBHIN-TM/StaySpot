'use strict';

const express = require('express');
const router = express.Router();
const { getUser, updateMe, sendPasswordOtp, sendEmailChangeOtp, changeEmail, becomeOwner, submitPhone, uploadAvatar, listUsers, verifyPhone, deleteMe, deleteUser, setBlocked } =
  require('../controllers/userController');
const { requireAuth, requireRole } = require('../middleware/auth');
const { upload } = require('../middleware/upload');

// Admin: list all users (optional ?role=) — must come before "/:id".
router.get('/', requireAuth, requireRole('admin'), listUsers);

router.patch('/me', requireAuth, updateMe);
router.post('/me/password-otp', requireAuth, sendPasswordOtp); // email a code to authorize a password change
router.post('/me/email-otp', requireAuth, sendEmailChangeOtp); // email a code to the NEW address
router.patch('/me/email', requireAuth, changeEmail); // verify code + switch login email
router.post('/me/become-owner', requireAuth, becomeOwner); // upgrade a seeker account to owner
router.post('/me/phone', requireAuth, submitPhone); // owner submits number for verification
router.post('/me/avatar', requireAuth, upload.single('image'), uploadAvatar);
router.delete('/me', requireAuth, deleteMe); // account owner soft-deletes their own account
router.get('/:id', getUser);
router.patch('/:id/block', requireAuth, requireRole('admin'), setBlocked);
router.patch('/:id/verify-phone', requireAuth, requireRole('admin'), verifyPhone); // admin confirms a call
router.delete('/:id', requireAuth, requireRole('admin'), deleteUser);

module.exports = router;
