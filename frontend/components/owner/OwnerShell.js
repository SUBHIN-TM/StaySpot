"use client";

// Shared layout + AUTH GUARD for owner pages. Redirects to /owner/login unless
// the logged-in account has role "owner". Emerald-themed header to keep the
// owner side visually separate from the user side.

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getCurrentUser, getUserToken, clearUser } from "@/lib/userAuth";
import NotificationBell from "@/components/NotificationBell";

function initials(name = "") {
  return (name.trim().split(/\s+/).slice(0, 2).map((p) => p[0]).join("") || "U").toUpperCase();
}

export default function OwnerShell({ active, children }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const u = getCurrentUser();
    if (!u || !getUserToken() || u.role !== "owner") {
      router.replace("/owner/login");
      return;
    }
    setUser(u);
    setReady(true);
  }, [router]);

  function logout() {
    clearUser();
    window.location.assign("/owner/login");
  }

  if (!ready) {
    return <div className="grid min-h-screen place-items-center text-slate-400">Loading…</div>;
  }

  const links = [
    { key: "dashboard", href: "/owner", label: "My properties" },
    { key: "new", href: "/owner/properties/new", label: "Add property" },
  ];

  return (
    <div className="min-h-screen bg-emerald-50/40">
      {/* Header */}
      <header className="border-b border-emerald-100 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <Link href="/owner" className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-600 font-bold text-white">
              S
            </span>
            <span className="font-bold text-slate-900">StayMate</span>
            <span className="rounded bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
              OWNER
            </span>
          </Link>

          <nav className="hidden items-center gap-6 sm:flex">
            {links.map((l) => (
              <Link
                key={l.key}
                href={l.href}
                className={`text-sm font-medium ${
                  active === l.key ? "text-emerald-700" : "text-slate-600 hover:text-emerald-700"
                }`}
              >
                {l.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="hidden items-center gap-1 text-sm font-medium text-emerald-700 hover:underline sm:flex"
            >
              ↗ View public site
            </Link>

            <NotificationBell token={getUserToken()} messagesPath="/messages" />

            {/* Avatar + name */}
            <div className="flex items-center gap-2">
              <span className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-full border-2 border-emerald-500 bg-emerald-600 text-sm font-bold text-white">
                {user?.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={user.avatar_url} alt="" referrerPolicy="no-referrer" className="h-full w-full object-cover" />
                ) : (
                  initials(user?.name)
                )}
              </span>
              <span className="hidden text-sm font-medium capitalize text-slate-700 sm:block">
                {user?.name}
              </span>
            </div>

            <button
              onClick={logout}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Log out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
