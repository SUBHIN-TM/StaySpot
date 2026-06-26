'use strict';

const express = require('express');
const router = express.Router();

router.use('/auth', require('./authRoutes'));
router.use('/users', require('./userRoutes'));
router.use('/properties', require('./propertyRoutes'));
router.use('/uploads', require('./uploadRoutes'));
router.use('/geo', require('./geoRoutes'));
router.use('/localities', require('./localityRoutes'));
router.use('/log-error', require('./logRoutes'));
router.use('/roommate-posts', require('./roommateRoutes'));
router.use('/favorites', require('./favoriteRoutes'));
router.use('/reviews', require('./reviewRoutes'));
router.use('/chat', require('./chatRoutes'));
router.use('/notifications', require('./notificationRoutes'));
router.use('/settings', require('./settingsRoutes'));
router.use('/stats', require('./statsRoutes'));

router.get('/', (req, res) => res.json({ name: 'StayMate API', version: '1.0.0' }));

module.exports = router;
