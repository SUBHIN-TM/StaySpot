'use strict';

const express = require('express');
const router = express.Router();
const { getStates, getLocalities, lookupPincode } = require('../controllers/geoController');
const { requireAuth } = require('../middleware/auth');

// Reference data for the property form — any logged-in user (owners) may read.
router.get('/states', requireAuth, getStates);
router.get('/localities', requireAuth, getLocalities);
router.get('/pincode/:pincode', requireAuth, lookupPincode);

module.exports = router;
