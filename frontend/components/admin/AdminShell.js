"use client";

// Shared layout for the logged-in admin pages: a sidebar + top bar.
// Acts as the AUTH GUARD (redirects to /admin/login if not logged in) and is
// responsive — on small screens the sidebar opens as a drawer via a ☰ button.

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getToken, getUser, clearAuth, saveAuth } from "@/lib/auth";
import { apiGet } from "@/lib/api";
import NotificationBell from "@/components/NotificationBell";

export default function AdminShell({ active, children }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false); // mobile drawer

  // Auth guard: validate the token against the backend before showing the admin
  // panel. localStorage alone can't be trusted — the account may have been
  // deleted, demoted, or the DB switched. Stay on "Loading…" until the server
  // confirms a real admin session.
  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.replace("/admin/login");
      return;
    }
    apiGet("/auth/me", token)
      .then((res) => {
        if (res.user.role !== "admin") {
          // Valid token but not an admin — don't expose the admin panel.
          clearAuth();
          router.replace("/admin/login");
          return;
        }
        setUser(res.user);
        saveAuth(token, res.user); // refresh cached profile
        setReady(true);
      })
      .catch(() => {
        // 401 "User no longer exists" / invalid token.
        clearAuth();
        router.replace("/admin/login");
      });
  }, [router]);

  function logout() {
    clearAuth();
    router.replace("/admin/login");
  }

  const nav = [
    { key: "dashboard", label: "Dashboard", href: "/admin" },
    { key: "properties", label: "Properties", href: "/admin/properties" },
    { key: "users", label: "Users", href: "/admin/users" },
    { key: "owners", label: "Owners", href: "/admin/owners" },
    { key: "messages", label: "Messages", href: "/admin/messages" },
    { key: "settings", label: "Settings", href: "/admin/settings" },
  ];

  if (!ready) {
    return <div className="grid min-h-screen place-items-center text-slate-400">Loading…</div>;
  }

  // The nav links — reused by both the desktop sidebar and the mobile drawer.
  const navLinks = (
    <nav className="mt-6 flex flex-col gap-1">
      {nav.map((item) => (
        <Link
          key={item.key}
          href={item.href}
          onClick={() => setMenuOpen(false)}
          className={`rounded-lg px-3 py-2 text-sm font-medium ${
            active === item.key ? "bg-brand text-white" : "text-slate-300 hover:bg-slate-800"
          }`}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );

  const brand = (
    <div className="flex items-center gap-2 px-2 py-3">
      <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand font-bold text-white">S</span>
      <span className="font-bold text-white">StayMate Admin</span>
    </div>
  );

  return (
    <div className="flex min-h-screen">
      {/* Desktop sidebar */}
      <aside className="hidden w-60 shrink-0 flex-col bg-slate-900 p-4 text-slate-200 md:flex">
        {brand}
        {navLinks}
      </aside>

      {/* Mobile drawer + backdrop */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMenuOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-64 bg-slate-900 p-4 text-slate-200 shadow-xl">
            <div className="flex items-center justify-between">
              {brand}
              <button
                onClick={() => setMenuOpen(false)}
                className="rounded-lg p-2 text-slate-300 hover:bg-slate-800"
                aria-label="Close menu"
              >
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 5l10 10M15 5L5 15" strokeLinecap="round" />
                </svg>
              </button>
            </div>
            {navLinks}
          </aside>
        </div>
      )}

      {/* Main column */}
      <div className="flex flex-1 flex-col">
        {/* Top bar */}
        <header className="flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-4 sm:px-6">
          {/* Hamburger (mobile only) */}
          <button
            onClick={() => setMenuOpen(true)}
            className="rounded-lg p-2 text-slate-700 hover:bg-slate-100 md:hidden"
            aria-label="Open menu"
          >
            <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
            </svg>
          </button>

          <span className="font-semibold text-slate-900 md:hidden">StayMate Admin</span>

          <div className="ml-auto flex items-center gap-3 sm:gap-4">
            <NotificationBell token={getToken()} messagesPath="/admin/messages" />
            <span className="hidden text-sm text-slate-600 sm:block">{user?.name || user?.email}</span>
            <button
              onClick={logout}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Log out
            </button>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
