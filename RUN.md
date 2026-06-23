# How to run StayMate

Run things in this order. The **backend must be running first** — the frontend and
mobile app both talk to it.

> Prerequisites: **Node.js** (18+), **PostgreSQL** running locally, and (for mobile)
> the **Expo Go** app on your phone or an emulator.

---

## 1. Backend (start this first) — http://localhost:4000

```bash
cd backend
npm install                 # first time only
cp .env.example .env        # then edit .env (DB URL, JWT, Google, SMTP) — see CLAUDE.md
npm run db:check            # verify the DB is reachable before migrating
npm run db:migrate          # create / update tables (safe to re-run)
npm run db:seed             # optional: demo data
npm run dev                 # starts the API + chat. Keep this terminal open.
```

You need a PostgreSQL database named `staymate`. Create it once:
```sql
CREATE DATABASE staymate;
```
Admin account isn't created by signup — see the SQL snippet in `CLAUDE.md`.

✅ Check: open http://localhost:4000/health → `{"status":"ok"}`

---

## 2. Frontend (web app) — http://localhost:3000

Open a **new terminal** (leave the backend running):

```bash
cd frontend
npm install                 # first time only
# create .env.local with:
#   NEXT_PUBLIC_API_URL=http://localhost:4000
#   NEXT_PUBLIC_GOOGLE_CLIENT_ID=<your google client id>
npm run dev                 # http://localhost:3000
```

Open **http://localhost:3000**. Admin panel is at **/admin**, owner area at **/owner**.

---

## 3. Mobile app (Expo / React Native)

Open another **new terminal** (backend still running):

```bash
cd mobile
npm install                 # first time only
# create .env with your PC's LAN IP (NOT localhost — a phone can't reach localhost):
#   EXPO_PUBLIC_API_URL=http://<your-LAN-IP>:4000      e.g. http://192.168.1.8:4000
npm start                   # opens Expo; scan the QR with Expo Go, or press a / i
```

Find your LAN IP with `ipconfig` (Windows → IPv4 Address).
For images/videos to load on the phone, also set the backend's `PUBLIC_BASE_URL`
to that same LAN IP in `backend/.env`, then restart the backend.

---

## Quick reference

| Part      | Folder      | Command       | URL / how                          |
|-----------|-------------|---------------|------------------------------------|
| Backend   | `backend`   | `npm run dev` | http://localhost:4000              |
| Frontend  | `frontend`  | `npm run dev` | http://localhost:3000              |
| Mobile    | `mobile`    | `npm start`   | Expo Go (scan QR) / emulator       |

Notes:
- The **backend is not a service** — it only runs while its terminal is open.
- PostgreSQL **is** a background service (auto-starts), so the DB is always up.
- More detail, env vars, conventions, and gotchas are in **`CLAUDE.md`**.
```
