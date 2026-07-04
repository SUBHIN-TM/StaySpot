'use strict';

const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/messageController');
const { requireAuth, requireRole } = require('../middleware/auth');

router.use(requireAuth);

// Admin oversight: read every conversation on the platform (monitoring only).
router.get('/admin/conversations', requireRole('admin'), ctrl.getAllConversations);
router.get('/admin/conversations/:id/messages', requireRole('admin'), ctrl.getMessagesAsAdmin);

router.post('/support', ctrl.startSupport);
router.post('/conversations', ctrl.startConversation);
router.get('/conversations', ctrl.getConversations);
router.get('/conversations/:id/messages', ctrl.getMessages);
router.post('/conversations/:id/messages', ctrl.postMessage);
router.post('/conversations/:id/read', ctrl.readConversation);

module.exports = router;
