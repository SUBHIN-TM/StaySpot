'use strict';

const express = require('express');
const router = express.Router();
const { getStats } = require('../controllers/statsController');

// Public landing-page stats (no auth).
router.get('/', getStats);

module.exports = router;
