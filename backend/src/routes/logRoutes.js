'use strict';

const express = require('express');
const router = express.Router();
const { viewLog, clearLog } = require('../controllers/logController');

// Access is gated inside the controller (secret key in prod, open in dev), so
// no requireAuth middleware here — you view it straight from a browser URL.
router.get('/', viewLog);
router.delete('/', clearLog);

module.exports = router;
