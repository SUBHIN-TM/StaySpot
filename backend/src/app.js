'use strict';

const express = require('express');
const cors = require('cors');
const path = require('path');

const env = require('./config/env');
const routes = require('./routes');
const storage = require('./storage');
const { notFound, errorHandler } = require('./middleware/error');

function createApp() {
  const app = express();

  app.use(
    cors({
      origin: env.corsOrigin === '*' ? true : env.corsOrigin.split(',').map((s) => s.trim()),
    })
  );
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Health check
  app.get('/health', (req, res) => res.json({ status: 'ok', storage: storage.driver }));

  // Serve locally-stored uploads when the local driver is active.
  // (With the Contabo driver, images are served directly from the bucket URL.)
  if (storage.driver === 'local') {
    app.use(
      '/uploads',
      express.static(storage.uploadDir, {
        fallthrough: false,
        maxAge: '7d',
      })
    );
  }

  app.use('/api', routes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}

module.exports = { createApp };
