"use client";

// Top navigation bar shown on all public pages.
// When logged in, the right side shows a clickable avatar (with a dropdown for
// Edit profile / Log out). When logged out, it shows a "Log in" button.

import Link from "next/link";
import { useEffect, useState } from "react";
import { getCurrentUser, getUserToken, clearUser, saveUser } from "@/lib/userAuth";
import { apiGet } from "@/lib/api";
import AvatarMenu from "./AvatarMenu";
import NotificationBell from "@/components/NotificationBell";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState(null); // logged-in user (or null)

  // On mount, show the cached user instantly for no flicker, then VALIDATE the
  // token against the backend. localStorage alone can't be trusted — the account
  // may have been deleted, blocked, or the DB switched (e.g. to a server with a
  // different user set), in which case we must clear the stale session.
  useEffect(() => {
    const token = getUserToken();
    if (!token) {
      setUser(null);
      return;
    }
    setUser(getCurrentUser()); // optimistic render from cache
    apiGet("/auth/me", token)
      .then((res) => {
        // Token is valid — refresh the cached profile with the latest data.
        setUser(res.user);
        saveUser(token, res.user);
      })
      .catch(() => {
        // 401 "User no longer exists" / blocked / invalid token — log out.
        clearUser();
        setUser(null);
      });
  }, []);

  // Log out: clear storage and reload so the navbar resets.
  function logout() {
    clearUser();
    window.location.assign("/");
  }

  // Links shown in the centre of the navbar.
  const links = [
    { href: "/", label: "Home" },
    { href: "/properties", label: "Explore" },
    { href: "/roommates", label: "Find roommates" },
    { href: "/owner", label: "For owners" },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand font-bold text-white">
            S
          </span>
          <span className="text-xl font-bold text-slate-900">StayMate</span>
        </Link>

        {/* Desktop links */}
        <ul className="hidden items-center gap-8 md:flex">
          {links.map((l) => (
            <li key={l.href}>
              <Link href={l.href} className="text-sm font-medium text-slate-600 hover:text-brand">
                {l.label}
              </Link>
            </li>
          ))}
        </ul>

        {/* Right side: avatar (logged in) or Log in button, + mobile menu button */}
        <div className="flex items-center gap-2">
          {user ? (
            <>
              <NotificationBell token={getUserToken()} messagesPath="/messages" />
              <AvatarMenu user={user} onLogout={logout} />
            </>
          ) : (
            <Link
              href="/login"
              className="rounded-lg bg-brand px-5 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
            >
              Log in
            </Link>
          )}

          {/* Mobile menu button (for the nav links) */}
          <button
            onClick={() => setOpen(!open)}
            className="rounded-lg p-2 text-slate-700 md:hidden"
            aria-label="Toggle menu"
          >
            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </nav>

      {/* Mobile dropdown — just the nav links */}
      {open && (
        <div className="border-t border-slate-200 bg-white px-4 py-3 md:hidden">
          <ul className="flex flex-col gap-3">
            {links.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="block py-1 text-sm font-medium text-slate-700"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </header>
  );
}
