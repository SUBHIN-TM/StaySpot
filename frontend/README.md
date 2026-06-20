# StayMate — Web app (frontend)

The public website + admin dashboard for StayMate. Built with **Next.js 16 (App Router)**,
**JavaScript**, and **Tailwind CSS v4**. It talks to the shared backend API (`/backend`).

## Quick start

```bash
cd frontend
npm install          # first time only
npm run dev          # starts on http://localhost:3000
```

The backend must also be running (see `/backend`): `cd backend && npm run dev` (port 4000).

The API base URL is set in `.env.local`:

```
NEXT_PUBLIC_API_URL=http://localhost:4000
```

## Pages

| URL             | Who          | What                                                      |
|-----------------|--------------|-----------------------------------------------------------|
| `/`             | Users/Owners | Marketing landing page + featured listings (SEO-friendly) |
| `/properties`   | Users        | Browse & search listings (filters via URL query params)   |
| `/admin/login`  | Admin        | Admin sign-in                                             |
| `/admin`        | Admin        | Protected dashboard (listing stats + table)               |

**Admin demo login:** `admin@staymate.com` / `admin123`

## Folder structure (kept simple on purpose)

```
app/
  layout.js            Root layout + site-wide SEO metadata
  page.js              Landing page ("/")
  properties/page.js   Browse/search page
  admin/
    layout.js          Admin wrapper (no public nav; noindex)
    login/page.js      Admin login form
    page.js            Admin dashboard (protected)
components/
  public/              Landing-page sections (Navbar, Hero, FeaturedListings, …)
  admin/AdminShell.js  Sidebar + top bar + auth guard for admin pages
lib/
  api.js               Tiny fetch wrapper for the backend (apiGet / apiPost)
  auth.js              Stores the admin JWT in localStorage
```

## How auth works (admin)

1. `/admin/login` posts to `POST /api/auth/login` on the backend.
2. If the returned user's `role === "admin"`, the JWT + user are saved to `localStorage`.
3. `AdminShell` checks for that token on every admin page and redirects to login if missing.

## Notes

- Public pages are **server components** so listings are rendered into the HTML for SEO.
- Admin pages are **client components** (they read the token and call the API in the browser).
- The brand colour is defined once in `app/globals.css` (`--color-brand`) → use `bg-brand`, `text-brand`.
