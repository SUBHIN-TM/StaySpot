'use strict';

const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/roommateController');
const { requireAuth } = require('../middleware/auth');

router.get('/', ctrl.listPosts);
router.get('/:id', ctrl.getPost);
router.post('/', requireAuth, ctrl.createPost);
router.patch('/:id', requireAuth, ctrl.updatePost);
router.delete('/:id', requireAuth, ctrl.deletePost);

module.exports = router;
