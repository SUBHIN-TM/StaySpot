'use strict';

const http = require('http');
const { Server } = require('socket.io');

const env = require('./config/env');
const { createApp } = require('./app');
const { registerChat } = require('./sockets/chat');
const { pool, startKeepWarm } = require('./config/db');
const { startSweeper } = require('./services/uploadSweeper');
const { logError } = require('./utils/logger');

// Last-resort safety net: log async errors instead of letting Node crash the
// whole process (which, behind nginx, shows up as intermittent 502s for EVERY
// request until it restarts). These should be rare — investigate anything logged
// here — but a single stray rejection must not take the server down.
process.on('unhandledRejection', (reason) => {
  console.error('[fatal] unhandledRejection:', reason);
  logError('unhandledRejection', reason);
});
process.on('uncaughtException', (err) => {
  console.error('[fatal] uncaughtException:', err);
  logError('uncaughtException', err);
});

// Try the initial DB handshake a few times before giving up. The remote DB sits
// behind a flaky network that drops ~half of new connections, so a single
// attempt fails far too often — a few retries almost always get through.
async function connectWithRetry(attempts = 8) {
  for (let i = 1; i <= attempts; i++) {
    try {
      await pool.query('SELECT 1');
      return true;
    } catch (err) {
      console.warn(`[db] connect attempt ${i}/${attempts} failed: ${err.message}`);
      if (i < attempts) {
        await new Promise((r) => setTimeout(r, Math.min(500 * i, 3000)));
      }
    }
  }
  return false;
}

async function start() {
  if (await connectWithRetry()) {
    console.log('[db] connected');
  } else {
    // Don't crash — the network/VPS may just be having a blip. Start anyway;
    // every query retries on its own (see config/db.js) and will recover once
    // the connection comes back, instead of leaving the API down.
    console.error('[db] could NOT connect after retries — starting the API anyway.');
    console.error('     The DB looks temporarily unreachable (flaky network/VPS).');
    console.error('     Queries retry per-request and will recover when it returns.');
    console.error('     If this persists, check DATABASE_URL in backend/.env and the DB host.');
  }
  // Keep a connection warm either way so requests skip the slow connect cost
  // (and so we re-establish quickly once a blip clears).
  startKeepWarm();

  const app = createApp();
  const server = http.createServer(app);

  // Fix intermittent 502s from the nginx⇄Node keep-alive race: Node's default
  // keepAliveTimeout (5s) is shorter than nginx's upstream keepalive, so nginx
  // can reuse a socket Node is closing → connection reset → 502. Keep Node's
  // idle timeout LONGER than nginx's (typically 60–75s), and headersTimeout
  // just above it. Also cap total request time so nothing hangs forever.
  server.keepAliveTimeout = 75 * 1000;
  server.headersTimeout = 76 * 1000;
  server.requestTimeout = 30 * 1000;

  const io = new Server(server, {
    cors: { origin: env.corsOrigin === '*' ? true : env.corsOrigin.split(',') },
  });
  // Expose io to REST controllers so HTTP-sent messages also broadcast live.
  app.set('io', io);
  registerChat(io);

  // Periodically delete orphaned (attached-but-never-submitted) uploads.
  startSweeper();

  server.listen(env.port, () => {
    console.log(`\n  StayMate API  →  http://localhost:${env.port}`);
    console.log(`  Health        →  http://localhost:${env.port}/health`);
    console.log(`  Socket.io     →  ws://localhost:${env.port}`);
    console.log(`  Storage       →  ${require('./storage').driver}\n`);
  });

  const shutdown = () => {
    console.log('\nShutting down…');
    io.close();
    server.close(() => pool.end().then(() => process.exit(0)));
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

start();
