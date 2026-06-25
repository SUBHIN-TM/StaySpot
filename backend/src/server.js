'use strict';

const http = require('http');
const { Server } = require('socket.io');

const env = require('./config/env');
const { createApp } = require('./app');
const { registerChat } = require('./sockets/chat');
const { pool } = require('./config/db');
const { startSweeper } = require('./services/uploadSweeper');

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
