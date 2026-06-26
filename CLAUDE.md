# StayMate — project guide (read me first)

> This file is the portable project context. It travels with the repo, so any
> machine/account picking up StayMate has the full picture. Keep it updated when
> architecture, conventions, or major decisions change.
> (The project may be renamed later — "StayMate" is the current working name.)

## What this is
A marketplace to **find rooms, PGs, apartments, rentals AND roommates** ("find your
next stay, roommate, or rental space in minutes"). Kerala-focused (₹, cities like
Kochi/Thiruvananthapuram). Three kinds of people:
- **Seekers** (role `seeker`) — regular users looking for a place or a roommate.
- **Owners** (role `owner`) — list & manage properties.
- **Admin** (role `admin`) — moderates listings/users from an admin panel.

## Monorepo layout
```
/backend    Node.js + Express REST API + Socket.io chat, PostgreSQL  (JS, CommonJS)
/frontend   Next.js 16 (App Router) web app — public site + owner + admin  (JS, Tailwind v4)
/mobile     React Native (Expo, TypeScript) app  (separate; less actively developed here)
```

## Run it (local)
Each part needs its own terminal. **Two services must run for the web app:**
```bash
# 1. Backend  (http://localhost:4000) — NOT a service, start manually
cd backend && npm install && npm run dev

# 2. Frontend (http://localhost:3000)
cd frontend && npm install && npm run dev
```
PostgreSQL must be running with a `staymate` database. Migrations run automatically
via `cd backend && npm run db:migrate` (idempotent, tracked in `_migrations`).
Optional demo data: `npm run db:seed`.

## Environment (recreate on a new machine — `.env` is git-ignored)
**`backend/.env`** (see `backend/.env.example`):
- `DATABASE_URL=postgresql://postgres:<pw>@localhost:5432/staymate`
- `JWT_SECRET`, `JWT_EXPIRES_IN`
- `GOOGLE_CLIENT_ID` — Google OAuth web client (console.cloud.google.com); add
  `http://localhost:3000` to Authorized JavaScript origins.
- `SMTP_HOST / SMTP_PORT / SMTP_USER / SMTP_PASS / MAIL_FROM / MAIL_FROM_NAME` —
  email (currently Brevo). `MAIL_FROM` must be a **verified sender** in Brevo.
- `PUBLIC_BASE_URL` — base URL used to build uploaded-image/video URLs. Use
  `http://localhost:4000` for web-on-this-PC. (For the mobile app on a phone, set it
  to the PC's LAN IP.)
- `STORAGE_DRIVER=local` (files saved to `backend/uploads/`; later swap to `contabo`).

**`frontend/.env.local`**:
- `NEXT_PUBLIC_API_URL=http://localhost:4000`
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID=<same Google client id>`

## Admin account
`register` intentionally blocks the `admin` role, so create an admin directly in SQL
(pgcrypto bcrypt is compatible with the backend's bcryptjs):
```sql
INSERT INTO users (email, username, password_hash, name, role)
VALUES ('admin@staymate.com','admin@staymate.com', crypt('CHOOSE_A_PASSWORD', gen_salt('bf')), 'StayMate Admin', 'admin');
```
Admin login is at `/admin/login` (separate session from regular users).

## Architecture & conventions
- **Keep code simple and readable** — small, commented files; no clever abstractions.
  This is a deliberate project value (the developer wants to follow every line).
- **Backend:** routes → controllers → services; `config/db.js` (pg pool),
  `utils/serialize.js` (`publicUser` never leaks `password_hash`). Auth via JWT;
  `middleware/auth.js` has `requireAuth` + `requireRole`.
- **Frontend:** App Router, mostly JS. Public pages are **server components** (SEO);
  interactive/auth pages are client components. Tailwind v4 (brand colour token
  `--color-brand` in `app/globals.css`; owner side themed **emerald**).
- **Two browser sessions, kept separate:** regular users/owners use
  `lib/userAuth.js` (localStorage keys `staymate_user*`); admin uses `lib/auth.js`
  (`staymate_admin*`). Logging into the owner side overwrites the user session
  (one active session — no clash). Owner pages are role-gated to `owner`.
- **API client:** `frontend/lib/api.js` — `apiGet/apiPost/apiPatch/apiDelete/apiUpload`.

## Features built so far
- **Auth:** Google sign-in + manual signup/login; **email OTP** (real, via Brevo) for
  signup and as a login option; password show/hide; profile edit (name/username/password).
- **Roles:** seeker / owner / admin. Owner area at `/owner` (emerald), admin at `/admin`.
- **Listings:** owners create/edit with images + video + map link + type + persons +
  occupancy status. Public browse `/properties`, full detail page `/properties/[id]`
  (gallery carousel, video, map, contact owner).
- **Structured location (canonical, Kerala):** `state` (locked to Kerala for
  now, but a real field/dropdown so more states can be enabled later), `district`
  (dropdown of the 14 Kerala districts — bundled dataset in `backend/src/config/geo.js`
  + `frontend/lib/geo.js`, validated server-side), `pincode` (6-digit; **autofills
  state+district** via the free India Post API proxied at `GET /api/geo/pincode/:pin`,
  cached), plus `city` (Town/Locality), `landmark`, `address`. **Pincode and District
  are required** (pincode first — it unlocks the District dropdown); town/landmark/
  address stay disabled until a district is chosen. **Town/Locality is a dropdown
  scoped to the PINCODE** (migration 013), sourced from the owner-curated `localities`
  table (keyed by pincode) merged with that pincode's post-office areas; an **"Other"**
  option lets owners type a new locality, recorded against that pincode on save
  (`GET /api/geo/localities?pincode=`). District is the canonical public filter; the
  admin Localities tool merges/renames within a pincode. lat/lng still only set from
  the mobile app (web radius search needs a map pin-picker).
- **Approval workflow:** new listings are `pending` until an admin approves them
  (Admin → Properties → click row → detail modal → Approve/Reject). A **Settings**
  toggle (`auto_approve_listings`) makes new listings publish instantly. Public pages
  show **only approved** listings; owners see each listing's status.
- **Admin panel:** Dashboard, Properties (approve/reject/delete + detail modal),
  Users, Owners (block/unblock + delete), **Localities** (merge/rename/delete to
  dedupe the per-district list), Messages, Settings. Responsive sidebar.
- **Block users:** blocked accounts can't log in or use the API.
- **Chat (REST + polling, Socket.io available):** seeker↔owner, seeker↔seeker
  (roommates), owner↔owner, anyone↔admin (support). `/messages` for users/owners,
  `/admin/messages` for admin. **Notifications** bell with unread badge everywhere.
- **Roommate finder:** `/roommates` (public list), post/edit/delete your own,
  `/roommates/mine`, "Message" the poster.

## Gotchas (things that bite)
- **Next.js 16 is newer than training data.** `params` and `searchParams` are
  **Promises** in server components — must be `await`ed. See `frontend/AGENTS.md`.
- **Image/video URLs** are built from `PUBLIC_BASE_URL`. If images don't load, that
  value is pointing at an unreachable host (e.g. a stale LAN IP) — set it to
  `http://localhost:4000` for local web.
- **Brevo blocks unauthorized IPs** (error `525 5.7.1 Unauthorized IP address`).
  Home IPs are dynamic — re-authorize the current public IP at
  Brevo → Security → Authorized IPs (get IP via `https://api.ipify.org`).
- **OTP is server-side** (table `email_otps`, 10-min expiry). Signup requires a
  verified OTP. Don't reintroduce frontend-only OTP.
- `@react-oauth/google` installed with `--legacy-peer-deps` (React 19 peer range).
- **Uploads are DIRECT-to-storage (presigned URLs), NOT through the backend.** The
  browser asks `POST /api/uploads/presign`, PUTs the file straight to Contabo (or the
  local `/api/uploads/local` sink in dev), then the form submits just the object
  *keys* (`POST /properties/:id/images` `{keys}`, `POST /properties/:id/video`
  `{key}`). The backend never buffers the bytes — this is what fixed slow/hung video
  uploads that used to saturate the VPS and drop the DB connection. Don't reintroduce
  multer/memory buffering for property media (avatars still use it — that's fine).
- **Contabo bucket MUST have a CORS policy** allowing `PUT` from the frontend origin
  with headers `Content-Type` + `x-amz-acl`, or every direct upload fails with a CORS
  error in the browser (the presigned URL itself is valid — it's the bucket rejecting
  the cross-origin PUT). Set it once per bucket via an S3 `PutBucketCors` call.
- **Orphaned uploads** (attached but never submitted) are tracked in `pending_uploads`
  and deleted by a background sweep (`services/uploadSweeper.js`, runs every 5 min).
  TTL is the `pending_upload_ttl_minutes` setting (default 60), editable in Admin →
  Settings, which also has a "Flush pending now" button. Removing an attachment or
  cancelling the form calls `POST /api/uploads/cancel` for instant cleanup.
- **Max upload sizes are admin-configurable** (`max_image_mb`/`max_video_mb` settings,
  defaults 8/50, edited in Admin → Settings). Enforced in the browser before upload
  AND server-side at presign. The form fetches them from `GET /api/uploads/limits`
  and shows a live upload-progress % (XHR, not fetch — only XHR exposes progress).
- Local-driver uploads land in `backend/uploads/`. Contabo is the prod driver
  (`STORAGE_DRIVER=contabo` + `CONTABO_*` env) — same code path, presigned URLs.

## Ops / debugging
- **Error log file:** server faults (5xx), `unhandledRejection`, and
  `uncaughtException` are appended to `backend/logs/error.log` (git-ignored via
  `*.log`, auto-rotates at ~5 MB). View the tail in a browser at
  `GET /api/log-error` (`?lines=300`, `DELETE` to clear). Gated by `LOG_ACCESS_KEY`:
  **must** be set in production (pass `?key=<value>`); open in development.
- **502s behind nginx:** `server.js` sets `keepAliveTimeout`/`headersTimeout`
  (> nginx's, fixes the keep-alive race) and global crash guards. If 502s persist,
  check `/var/log/nginx/error.log` and run the backend under a process manager
  (pm2/systemd) so a crash auto-restarts. See `/api/log-error` for the app-side cause.

## Roadmap / ideas (not yet built)
- **AI roommate compatibility matching** (lifestyle profile + match score + Claude-
  generated "why you match") — top idea, leverages roommate posts + Claude.
- **Trust layer:** verified-property badge + AI scam detection on new listings.
- **Post-move-in retention:** rent/expense split, flat group + chores board.
- **Rename** "StayMate" (candidates discussed: Nestmate, Aangan, Basera) — do a single
  pass across logo text, titles, SEO metadata, email templates when chosen.
- Polish: image lightbox, embedded map, search/filters, instant chat via Socket.io,
  email notifications on new messages.
```
