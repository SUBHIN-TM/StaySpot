'use strict';

const http = require('http');
const { Server } = require('socket.io');

const env = require('./config/env');
const { createApp } = require('./app');
const { registerChat } = require('./sockets/chat');
const { pool } = require('./config/db');
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

async function start() {
  // Fail fast if the database is unreachable.
  try {
    await pool.query('SELECT 1');
    console.log('[db] connected');
  } catch (err) {
    console.error('[db] connection failed:', err.message);
    console.error('     Check DATABASE_URL in backend/.env and that PostgreSQL is running.');
    process.exit(1);
  }

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
