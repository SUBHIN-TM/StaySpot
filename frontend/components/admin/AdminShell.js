"use client";

// Shared layout for the logged-in admin pages: a sidebar + top bar.
// Acts as the AUTH GUARD (redirects to /admin/login if not logged in) and is
// responsive — on small screens the sidebar opens as a drawer via a ☰ button.
// Themed to the site's sage/gold/olive palette for a premium, on-brand admin.

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  Building2,
  Users,
  BadgeCheck,
  Handshake,
  MapPin,
  MessageSquare,
  Settings,
  Menu,
  X,
  LogOut,
} from "lucide-react";
import { getToken, getUser, clearAuth, saveAuth } from "@/lib/auth";
import { apiGet } from "@/lib/api";
import NotificationBell from "@/components/NotificationBell";
import Logo from "@/components/public/Logo";
import { SAGE, GOLD, OLIVE, LINE, CREAM } from "@/components/public/palette";

function initials(name = "") {
  return (name.trim().split(/\s+/).slice(0, 2).map((p) => p[0]).join("") || "A").toUpperCase();
}

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
    { key: "dashboard", label: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { key: "properties", label: "Properties", href: "/admin/properties", icon: Building2 },
    { key: "users", label: "Users", href: "/admin/users", icon: Users },
    { key: "owners", label: "Owners", href: "/admin/owners", icon: BadgeCheck },
    { key: "roommates", label: "Roommates", href: "/admin/roommates", icon: Handshake },
    { key: "localities", label: "Localities", href: "/admin/localities", icon: MapPin },
    { key: "messages", label: "Messages", href: "/admin/messages", icon: MessageSquare },
    { key: "settings", label: "Settings", href: "/admin/settings", icon: Settings },
  ];

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

  // The nav links — reused by both the desktop sidebar and the mobile drawer.
  const navLinks = (
    <nav className="mt-6 flex flex-col gap-1">
      {nav.map((item) => {
        const on = active === item.key;
        const Icon = item.icon;
        return (
          <Link
            key={item.key}
            href={item.href}
            onClick={() => setMenuOpen(false)}
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors"
            style={
              on
                ? { background: SAGE, color: "#fff" }
                : { color: "rgba(255,255,255,0.72)" }
            }
            onMouseEnter={(e) => { if (!on) e.currentTarget.style.background = "rgba(255,255,255,0.08)"; }}
            onMouseLeave={(e) => { if (!on) e.currentTarget.style.background = "transparent"; }}
          >
            <Icon size={18} color={on ? "#fff" : GOLD} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  const brand = (
    <Link href="/admin" className="flex items-center gap-2 px-2 py-3" onClick={() => setMenuOpen(false)}>
      <Logo size={26} textClass="text-base" tone="dark" />
      <span
        className="rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wide"
        style={{ background: `${GOLD}26`, color: GOLD }}
      >
        ADMIN
      </span>
    </Link>
  );

  return (
    <div className="flex min-h-screen">
      {/* Desktop sidebar */}
      <aside
        className="hidden w-64 shrink-0 flex-col p-4 md:flex"
        style={{ background: OLIVE, borderRight: `1px solid rgba(255,255,255,0.06)` }}
      >
        {brand}
        {navLinks}
      </aside>

      {/* Mobile drawer + backdrop */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0" style={{ background: "rgba(30,37,33,0.55)" }} onClick={() => setMenuOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-64 p-4 shadow-2xl" style={{ background: OLIVE }}>
            <div className="flex items-center justify-between">
              {brand}
              <button
                onClick={() => setMenuOpen(false)}
                className="rounded-lg p-2 text-white/70 transition-colors hover:bg-white/10"
                aria-label="Close menu"
              >
                <X size={20} />
              </button>
            </div>
            {navLinks}
          </aside>
        </div>
      )}

      {/* Main column */}
      <div className="flex flex-1 flex-col">
        {/* Top bar */}
        <header
          className="sticky top-0 z-30 flex items-center gap-3 px-4 py-3 sm:px-6"
          style={{
            background: "rgba(255,255,255,0.85)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            borderBottom: `1px solid ${LINE}`,
          }}
        >
          {/* Hamburger (mobile only) */}
          <button
            onClick={() => setMenuOpen(true)}
            className="rounded-lg p-2 transition-colors hover:bg-black/5 md:hidden"
            style={{ color: OLIVE }}
            aria-label="Open menu"
          >
            <Menu size={22} />
          </button>

          <span className="font-semibold md:hidden" style={{ color: OLIVE }}>Parppidam Admin</span>

          <div className="ml-auto flex items-center gap-2 sm:gap-4">
            <NotificationBell token={getToken()} messagesPath="/admin/messages" />

            {/* Admin identity + logout */}
            <div className="hidden items-center gap-2 sm:flex">
              <span
                className="grid h-9 w-9 place-items-center rounded-full text-sm font-bold text-white"
                style={{ background: SAGE }}
              >
                {initials(user?.name || user?.email)}
              </span>
              <span className="text-sm font-medium" style={{ color: OLIVE }}>
                {user?.name || user?.email}
              </span>
            </div>
            <button
              onClick={logout}
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors"
              style={{ border: `1px solid ${LINE}`, color: OLIVE }}
              onMouseEnter={(e) => (e.currentTarget.style.background = CREAM)}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <LogOut size={15} /> Log out
            </button>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
