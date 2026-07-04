"use client";

// Shared layout + AUTH GUARD for owner pages. Redirects to /owner/login unless
// the logged-in account has role "owner". Themed to the site's sage/gold/olive
// palette (with a gold "OWNER" pill) so the owner side feels premium and on-brand
// while still reading as a distinct workspace. Fully responsive: on phones the
// primary nav folds into the avatar dropdown.

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { getCurrentUser, getUserToken, clearUser, saveUser } from "@/lib/userAuth";
import { apiGet } from "@/lib/api";
import NotificationBell from "@/components/NotificationBell";
import OwnerAvatarMenu from "@/components/owner/OwnerAvatarMenu";
import Logo from "@/components/public/Logo";
import { SAGE, GOLD, OLIVE, LINE, CREAM } from "@/components/public/palette";

export default function OwnerShell({ active, children, bgClass }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState(null);

  // Auth guard: never trust localStorage alone. Validate the token against the
  // backend before showing any owner content — the account may have been
  // deleted, blocked, demoted, or the DB switched. Stay on "Loading…" until the
  // server confirms a real owner session.
  useEffect(() => {
    const token = getUserToken();
    const cached = getCurrentUser();
    if (!token || !cached || cached.role !== "owner") {
      clearUser();
      router.replace("/owner/login");
      return;
    }
    apiGet("/auth/me", token)
      .then((res) => {
        if (res.user.role !== "owner") {
          // Token is valid but the account is no longer an owner.
          clearUser();
          router.replace("/owner/login");
          return;
        }
        setUser(res.user);
        saveUser(token, res.user); // refresh cached profile
        setReady(true);
      })
      .catch(() => {
        // 401 "User no longer exists" / blocked / invalid token.
        clearUser();
        router.replace("/owner/login");
      });
  }, [router]);

  function logout() {
    clearUser();
    window.location.assign("/owner/login");
  }

  if (!ready) {
    return (
      <div className="grid min-h-screen place-items-center" style={{ background: CREAM }}>
        <div className="flex items-center gap-3" style={{ color: `${OLIVE}80` }}>
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
          Loading…
        </div>
      </div>
    );
  }

  const links = [
    { key: "dashboard", href: "/owner", label: "My properties" },
    { key: "new", href: "/owner/properties/new", label: "Add property" },
  ];

  return (
    <div className={`min-h-screen ${bgClass || ""}`} style={bgClass ? undefined : { background: CREAM }}>
      {/* Floating, detached "pill" top bar (matches the landing page navbar). */}
      <header className="sticky top-0 z-40 px-3 pt-3 sm:px-4 sm:pt-4">
        <div
          className="mx-auto flex h-14 w-full max-w-6xl items-center gap-4 rounded-full px-4 sm:px-6"
          style={{
            background: "linear-gradient(155deg, rgba(255,255,255,0.92), rgba(255,255,255,0.8))",
            backdropFilter: "blur(22px) saturate(130%)",
            WebkitBackdropFilter: "blur(22px) saturate(130%)",
            border: "1px solid rgba(255,255,255,0.65)",
            boxShadow: "0 16px 44px rgba(30,37,33,0.2), inset 0 1px 0 rgba(255,255,255,0.6)",
          }}
        >
          {/* Logo + OWNER pill */}
          <Link href="/owner" className="flex flex-shrink-0 items-center gap-2">
            <Logo size={28} textClass="text-base" tone="light" />
            <span
              className="rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-[0.12em] text-white"
              style={{
                background: "linear-gradient(135deg, #D4A359, #B07C1E)",
                boxShadow: "0 2px 8px rgba(176,124,30,0.45)",
              }}
            >
              Owner
            </span>
          </Link>

          {/* Desktop nav (centered) */}
          <nav className="hidden flex-1 items-center justify-center gap-7 md:flex">
            {links.map((l) => {
              const on = active === l.key;
              return (
                <Link
                  key={l.key}
                  href={l.href}
                  className="text-sm font-semibold transition-colors"
                  style={{ color: on ? "#9A6B18" : OLIVE }}
                >
                  {l.label}
                </Link>
              );
            })}
          </nav>

          {/* Right cluster */}
          <div className="ml-auto flex items-center gap-2 sm:gap-3 md:ml-0">
            <Link
              href="/"
              className="hidden items-center gap-1.5 text-sm font-semibold transition-opacity hover:opacity-80 lg:flex"
              style={{ color: SAGE }}
            >
              View public site <ExternalLink size={14} />
            </Link>
            <NotificationBell token={getUserToken()} messagesPath="/messages" />
            <OwnerAvatarMenu user={user} onLogout={logout} />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
