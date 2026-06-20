'use strict';

const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/messageController');
const { requireAuth } = require('../middleware/auth');

router.use(requireAuth);
router.post('/support', ctrl.startSupport);
router.post('/conversations', ctrl.startConversation);
router.get('/conversations', ctrl.getConversations);
router.get('/conversations/:id/messages', ctrl.getMessages);
router.post('/conversations/:id/messages', ctrl.postMessage);
router.post('/conversations/:id/read', ctrl.readConversation);

module.exports = router;
