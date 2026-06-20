'use strict';

const express = require('express');
const router = express.Router();
const { register, login, otpLogin, sendOtp, verifyOtp, me, googleAuth } =
  require('../controllers/authController');
const { requireAuth } = require('../middleware/auth');

router.post('/send-otp', sendOtp);
router.post('/verify-otp', verifyOtp);
router.post('/register', register);
router.post('/login', login);
router.post('/otp-login', otpLogin);
router.post('/google', googleAuth);
router.get('/me', requireAuth, me);

module.exports = router;
