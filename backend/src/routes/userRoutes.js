'use strict';

const express = require('express');
const router = express.Router();
const { getUser, updateMe, uploadAvatar } = require('../controllers/userController');
const { requireAuth } = require('../middleware/auth');
const { upload } = require('../middleware/upload');

router.patch('/me', requireAuth, updateMe);
router.post('/me/avatar', requireAuth, upload.single('image'), uploadAvatar);
router.get('/:id', getUser);

module.exports = router;
