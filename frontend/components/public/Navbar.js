"use client";

// Top navigation bar shown on all public pages.
// - Sunset palette (matches the landing page).
// - Highlights the active tab based on the current URL (Home lights up on "/").
// - When logged in, the right side shows a clickable avatar (with a dropdown for
//   Edit profile / Log out). When logged out, it shows a "Log in" button.

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { getCurrentUser, getUserToken, clearUser, saveUser } from "@/lib/userAuth";
import { apiGet } from "@/lib/api";
import AvatarMenu from "./AvatarMenu";
import NotificationBell from "@/components/NotificationBell";

export default function Navbar() {
  const pathname = usePathname();
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
        setUser(res.user);
        saveUser(token, res.user);
      })
      .catch(() => {
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

  // The "/" tab is active only on the exact landing page; the others are active
  // on their section and any sub-page (e.g. /properties/123 → Explore active).
  function isActive(href) {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(href + "/");
  }

  return (
    <header className="sticky top-0 z-50 border-b border-ink/10 bg-cream/80 backdrop-blur-md">
      <nav className="mx-auto flex max-w-[1440px] items-center justify-between px-4 py-3.5 sm:px-6 lg:px-10">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-sun via-coral to-grape font-black text-white shadow-md shadow-coral/30">
            S
          </span>
          <span className="text-xl font-black tracking-tight text-ink">StayMate</span>
        </Link>

        {/* Desktop links */}
        <ul className="hidden items-center gap-1 md:flex">
          {links.map((l) => {
            const active = isActive(l.href);
            return (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                    active
                      ? "bg-gradient-to-r from-sun/15 via-coral/15 to-grape/15 text-grape"
                      : "text-ink/60 hover:bg-ink/5 hover:text-ink"
                  }`}
                >
                  {l.label}
                </Link>
              </li>
            );
          })}
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
              className="rounded-full bg-gradient-to-r from-sun via-coral to-grape px-5 py-2 text-sm font-semibold text-white shadow-md shadow-coral/30 transition hover:shadow-lg hover:shadow-coral/40"
            >
              Log in
            </Link>
          )}

          {/* Mobile menu button (for the nav links) */}
          <button
            onClick={() => setOpen(!open)}
            className="rounded-lg p-2 text-ink md:hidden"
            aria-label="Toggle menu"
          >
            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </nav>

      {/* Mobile dropdown — just the nav links (with active highlight) */}
      {open && (
        <div className="border-t border-ink/10 bg-cream px-4 py-3 md:hidden">
          <ul className="flex flex-col gap-1">
            {links.map((l) => {
              const active = isActive(l.href);
              return (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    onClick={() => setOpen(false)}
                    className={`block rounded-xl px-3 py-2 text-sm font-semibold transition ${
                      active
                        ? "bg-gradient-to-r from-sun/15 via-coral/15 to-grape/15 text-grape"
                        : "text-ink/70 hover:bg-ink/5"
                    }`}
                  >
                    {l.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </header>
  );
}
