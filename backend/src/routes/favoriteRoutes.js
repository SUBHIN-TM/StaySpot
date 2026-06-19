'use strict';

const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/favoriteController');
const { requireAuth } = require('../middleware/auth');

router.use(requireAuth);
router.get('/', ctrl.listFavorites);
router.post('/:propertyId', ctrl.addFavorite);
router.delete('/:propertyId', ctrl.removeFavorite);

module.exports = router;
