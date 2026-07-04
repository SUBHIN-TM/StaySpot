"use client";

// Shared layout + AUTH GUARD for owner pages. Redirects to /owner/login unless
// the logged-in account has role "owner". Themed to the site's sage/gold/olive
// palette (with a gold "OWNER" pill) so the owner side feels premium and on-brand
// while still reading as a distinct workspace. Fully responsive: on phones the
// primary nav folds into the avatar dropdown.

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Home } from "lucide-react";
import { getCurrentUser, getUserToken, clearUser, saveUser } from "@/lib/userAuth";
import { apiGet } from "@/lib/api";
import NotificationBell from "@/components/NotificationBell";
import OwnerAvatarMenu from "@/components/owner/OwnerAvatarMenu";
import { SAGE, GOLD, OLIVE, LINE, CREAM } from "@/components/public/palette";

export default function OwnerShell({ active, children }) {
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
    <div className="min-h-screen" style={{ background: CREAM }}>
      {/* Sticky top bar */}
      <header
        className="sticky top-0 z-40"
        style={{
          background: "rgba(255,255,255,0.85)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          borderBottom: `1px solid ${LINE}`,
        }}
      >
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:px-6">
          {/* Logo + OWNER pill */}
          <Link href="/owner" className="flex flex-shrink-0 items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-full" style={{ background: SAGE }}>
              <Home size={15} color="white" />
            </span>
            <span className="font-bold" style={{ color: OLIVE }}>StayMate</span>
            <span
              className="rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wide"
              style={{ background: `${GOLD}26`, color: "#9A6B18" }}
            >
              OWNER
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
                  className="text-sm font-medium transition-opacity hover:opacity-100"
                  style={{ color: on ? GOLD : OLIVE, opacity: on ? 1 : 0.72 }}
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
              className="hidden items-center gap-1 text-sm font-medium transition-opacity hover:opacity-80 lg:flex"
              style={{ color: SAGE }}
            >
              View public site ↗
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
