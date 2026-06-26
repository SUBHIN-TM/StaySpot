'use strict';

const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/reviewController');
const { requireAuth } = require('../middleware/auth');

router.get('/', ctrl.listReviews); // public
router.post('/', requireAuth, ctrl.upsertReview); // logged-in users only

module.exports = router;
