'use strict';

// Storage facade. Controllers import ONLY this module and never care which
// driver is active. Switch drivers with STORAGE_DRIVER in .env.

const env = require('../config/env');
const local = require('./local');
const contabo = require('./contabo');

const drivers = { local, contabo };

const storage = drivers[env.storageDriver] || local;

if (!drivers[env.storageDriver]) {
  console.warn(
    `[storage] Unknown STORAGE_DRIVER "${env.storageDriver}", falling back to "local".`
  );
}

console.log(`[storage] driver = ${storage.driver}`);

module.exports = storage;
