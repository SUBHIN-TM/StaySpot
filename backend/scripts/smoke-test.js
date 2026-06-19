'use strict';

/*
 * End-to-end smoke test. Run AFTER the server is up (`npm run dev`) and the DB
 * is migrated:  node scripts/smoke-test.js
 *
 * Exercises: register → login → create property → favorite → start chat →
 * real-time message delivery over Socket.io → read receipt.
 */

const { io } = require('socket.io-client');

const BASE = process.env.SMOKE_BASE_URL || 'http://localhost:4000';
const rnd = Math.floor(Math.random() * 1e6);

async function api(path, { method = 'GET', token, body } = {}) {
  const res = await fetch(`${BASE}/api${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`${method} ${path} → ${res.status}: ${data.error || 'error'}`);
  return data;
}

function ok(msg) { console.log(`  ✓ ${msg}`); }

async function main() {
  console.log('\nStayMate backend smoke test →', BASE, '\n');

  // Health
  const health = await fetch(`${BASE}/health`).then((r) => r.json());
  ok(`health: ${health.status} (storage=${health.storage})`);

  // Register owner + seeker
  const owner = await api('/auth/register', {
    method: 'POST',
    body: { email: `owner${rnd}@test.com`, password: 'password123', name: 'Test Owner', role: 'owner' },
  });
  ok(`registered owner (${owner.user.email})`);

  const seeker = await api('/auth/register', {
    method: 'POST',
    body: { email: `seeker${rnd}@test.com`, password: 'password123', name: 'Test Seeker', role: 'seeker' },
  });
  ok(`registered seeker (${seeker.user.email})`);

  // Owner creates a property
  const { property } = await api('/properties', {
    method: 'POST',
    token: owner.token,
    body: {
      title: 'Smoke Test Flat', property_type: 'apartment', rent_amount: 12000,
      latitude: 12.9716, longitude: 77.5946, city: 'Bengaluru', address: 'Test St',
    },
  });
  ok(`owner created property (${property.id})`);

  // Listing visible + radius search
  const list = await api('/properties?lat=12.9716&lng=77.5946&radius_km=5');
  ok(`radius search returned ${list.properties.length} propert${list.properties.length === 1 ? 'y' : 'ies'}`);

  // Seeker favorites it
  await api(`/favorites/${property.id}`, { method: 'POST', token: seeker.token });
  const favs = await api('/favorites', { token: seeker.token });
  ok(`seeker favorites: ${favs.properties.length}`);

  // Seeker starts a conversation about the property
  const conv = await api('/chat/conversations', {
    method: 'POST', token: seeker.token,
    body: { other_user_id: owner.user.id, property_id: property.id },
  });
  ok(`conversation started (${conv.conversation_id})`);

  // ─── Real-time chat over Socket.io ───────────────────────────────────────
  const ownerSock = io(BASE, { auth: { token: owner.token }, transports: ['websocket'] });
  const seekerSock = io(BASE, { auth: { token: seeker.token }, transports: ['websocket'] });

  await Promise.all([
    new Promise((res) => ownerSock.on('connect', res)),
    new Promise((res) => seekerSock.on('connect', res)),
  ]);
  ok('both sockets connected');

  // Owner joins the room and waits for the incoming message.
  await new Promise((res, rej) => {
    ownerSock.emit('conversation:join', { conversationId: conv.conversation_id }, (ack) =>
      ack?.ok ? res() : rej(new Error('owner join failed: ' + ack?.error))
    );
  });
  seekerSock.emit('conversation:join', { conversationId: conv.conversation_id });

  const received = new Promise((res) => ownerSock.on('message:new', res));
  const readReceipt = new Promise((res) => seekerSock.on('message:read', res));

  // Seeker sends a live message.
  const sent = await new Promise((res, rej) => {
    seekerSock.emit(
      'message:send',
      { conversationId: conv.conversation_id, content: 'Hi! Is this place still available?' },
      (ack) => (ack?.ok ? res(ack.message) : rej(new Error('send failed: ' + ack?.error)))
    );
  });
  ok(`seeker sent message (${sent.id})`);

  const delivered = await Promise.race([
    received,
    new Promise((_, rej) => setTimeout(() => rej(new Error('timed out waiting for delivery')), 5000)),
  ]);
  if (delivered.content !== 'Hi! Is this place still available?') throw new Error('delivered content mismatch');
  ok('owner received message in real time');

  // Owner reads it → seeker should get a read receipt.
  ownerSock.emit('message:read', { conversationId: conv.conversation_id });
  await Promise.race([
    readReceipt,
    new Promise((_, rej) => setTimeout(() => rej(new Error('timed out waiting for read receipt')), 5000)),
  ]);
  ok('seeker received read receipt');

  // History via REST
  const history = await api(`/chat/conversations/${conv.conversation_id}/messages`, { token: owner.token });
  ok(`message history has ${history.messages.length} message(s)`);

  // Receiver got a notification
  const notifs = await api('/notifications', { token: owner.token });
  ok(`owner notifications: ${notifs.unread_count} unread`);

  ownerSock.close();
  seekerSock.close();

  console.log('\n✅ ALL CHECKS PASSED — chat works end to end.\n');
  process.exit(0);
}

main().catch((err) => {
  console.error('\n❌ SMOKE TEST FAILED:', err.message, '\n');
  process.exit(1);
});
