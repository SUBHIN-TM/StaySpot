# StayMate

Monorepo for StayMate — "Find your next stay, roommate, or rental space in minutes."

## Structure

```
/backend   Node.js + Express REST API, Socket.io real-time chat, PostgreSQL
/mobile    React Native (Expo, TypeScript) app for Seekers & Owners
/frontend  React.js admin dashboard (planned — not built yet)
```

## Quick start (local)

### 1. Backend

```bash
cd backend
cp .env.example .env          # edit DATABASE_URL + JWT_SECRET
npm install
npm run db:migrate            # create tables
npm run db:seed               # optional demo data
npm run dev                   # starts API + Socket.io on http://localhost:4000
```

You need a local PostgreSQL running and a database created, e.g.:

```sql
CREATE DATABASE staymate;
```

### 2. Mobile

```bash
cd mobile
npm install
npm start                     # Expo dev server; press a/i or scan QR
```

Set the API URL in `mobile/.env` (or `app.config.js`) to your machine's LAN IP,
e.g. `EXPO_PUBLIC_API_URL=http://192.168.1.10:4000`.

## Media storage

Storage is abstracted behind a single interface (`backend/src/storage`).

- `STORAGE_DRIVER=local` (default) — saves files to `backend/uploads/` and records
  metadata in `backend/storage-data/objects.json`. Returns a stable object **key**;
  files are served at `GET /uploads/:key`.
- `STORAGE_DRIVER=contabo` — S3-compatible (Contabo Object Storage). Fill the
  `CONTABO_*` env vars after you purchase the bucket. No app code changes needed —
  the API keeps returning the same key shape.

See `backend/.env.example`.
