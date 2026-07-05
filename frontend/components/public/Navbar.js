"use client";

// Floating glass "pill" navbar shown on all public pages (matches the design).
// - Transparent over the hero at the top; turns into a solid white pill once
//   you scroll (scroll-aware).
// - Highlights the active tab based on the current URL.
// - When logged in, the right side shows the notification bell + avatar menu;
//   when logged out, it shows a "Login" button.

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Menu, X as XIcon, Home, Compass, Users, Building2, ChevronRight, LogIn, LogOut } from "lucide-react";
import { getCurrentUser, getUserToken, clearUser, saveUser } from "@/lib/userAuth";
import { apiGet } from "@/lib/api";
import AvatarMenu from "./AvatarMenu";
import NotificationBell from "@/components/NotificationBell";
import Logo from "./Logo";
import { SAGE, GOLD, OLIVE, LINE } from "./palette";

export default function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);   // mobile menu open
  const [scrolled, setScrolled] = useState(false);
  const [user, setUser] = useState(null);    // logged-in user (or null)

  // Scroll-aware: solid pill once the user scrolls past the very top.
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 30);
    fn();
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  // Close the mobile drawer once the viewport reaches the desktop breakpoint
  // (Tailwind md = 768px). Otherwise, resizing from mobile to desktop leaves the
  // drawer stuck open on top of the full navbar.
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const fn = (e) => { if (e.matches) setOpen(false); };
    fn(mq);
    mq.addEventListener("change", fn);
    return () => mq.removeEventListener("change", fn);
  }, []);

  // Show the cached user instantly, then validate the token against the backend
  // (it may have been revoked, blocked, or point at a different DB).
  useEffect(() => {
    const token = getUserToken();
    if (!token) {
      setUser(null);
      return;
    }
    setUser(getCurrentUser());
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

  function logout() {
    clearUser();
    window.location.assign("/");
  }

  const links = [
    { href: "/", label: "Home", icon: Home },
    { href: "/properties", label: "Explore", icon: Compass },
    { href: "/roommates", label: "Find Roommates", icon: Users },
    { href: "/owner", label: "For Owners", icon: Building2 },
  ];

  function isActive(href) {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(href + "/");
  }

  // The navbar floats transparently only over the landing hero. On every other
  // page (no full-screen hero) it stays a solid white pill so it's readable.
  const onHero = pathname === "/";
  const solid = scrolled || !onHero;

  // Over the hero the pill gets a consistent dark tint (not near-transparent) so the
  // gold wordmark + white links stay readable against ANY slideshow image.
  const pillBg = solid ? "rgba(255,255,255,0.95)" : "rgba(30,37,33,0.42)";
  const txtCol = solid ? OLIVE : "#ffffff";
  const shadow = solid
    ? "0 10px 48px rgba(30,37,33,0.14)"
    : "0 4px 24px rgba(0,0,0,0.14)";

  return (
    <>
    {/* Plain <header> + CSS .nav-drop (not Framer) so the pill appears at paint
        time with the hero image, instead of waiting for the JS bundle to hydrate. */}
    <header
      className="nav-drop fixed top-0 inset-x-0 z-50 flex justify-center"
      style={{ paddingTop: scrolled ? 10 : 16, transition: "padding 0.3s ease" }}
    >
      <div
        className="flex items-center w-full max-w-5xl mx-4"
        style={{
          background: pillBg,
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          border: "1px solid rgba(255,255,255,0.22)",
          borderRadius: 999,
          boxShadow: shadow,
          padding: scrolled ? "10px 22px" : "14px 26px",
          transition: "all 0.35s ease",
        }}
      >
        {/* Logo */}
        <Link href="/" className="flex flex-shrink-0 items-center">
          <Logo size={30} textClass="text-lg" tone={solid ? "light" : "dark"} />
        </Link>

        {/* Links */}
        <nav className="hidden md:flex items-center gap-6 flex-1 justify-center">
          {links.map((l) => {
            const active = isActive(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className="text-sm font-semibold transition-colors duration-200"
                style={{ color: active ? GOLD : txtCol }}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>

        {/* Right side */}
        <div className="hidden md:flex items-center gap-3 flex-shrink-0 ml-auto">
          {user ? (
            <>
              <NotificationBell token={getUserToken()} messagesPath="/messages" color={solid ? OLIVE : "#ffffff"} />
              <AvatarMenu user={user} onLogout={logout} />
            </>
          ) : (
            <Link
              href="/login"
              className="px-5 py-2 rounded-full text-sm font-semibold transition-colors"
              style={{
                border: `1.5px solid ${solid ? SAGE + "80" : "rgba(255,255,255,0.38)"}`,
                color: solid ? SAGE : "white",
                background: "transparent",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = GOLD;
                e.currentTarget.style.borderColor = GOLD;
                e.currentTarget.style.color = OLIVE;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.borderColor = solid ? SAGE + "80" : "rgba(255,255,255,0.38)";
                e.currentTarget.style.color = solid ? SAGE : "white";
              }}
            >
              Login
            </Link>
          )}
        </div>

        {/* Mobile right cluster: bell + avatar when logged in, then hamburger.
            (Avatar must show on small screens too, not just desktop.) */}
        <div className="flex md:hidden items-center gap-2 ml-auto">
          {user && (
            <>
              <NotificationBell token={getUserToken()} messagesPath="/messages" color={solid ? OLIVE : "#ffffff"} />
              <AvatarMenu user={user} onLogout={logout} />
            </>
          )}
          <button
            onClick={() => setOpen(!open)}
            style={{ color: solid ? OLIVE : "white" }}
            aria-label="Toggle menu"
          >
            {open ? <XIcon size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.97 }}
            transition={{ duration: 0.2 }}
            className="absolute top-20 left-4 right-4 rounded-2xl p-2.5 space-y-1"
            style={{
              background: "rgba(255,255,255,0.98)",
              backdropFilter: "blur(20px)",
              border: `1px solid ${LINE}`,
              boxShadow: "0 24px 70px rgba(30,37,33,0.15)",
            }}
          >
            {links.map((l) => {
              const active = isActive(l.href);
              const Icon = l.icon;
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors"
                  style={{
                    color: active ? SAGE : OLIVE,
                    background: active ? "rgba(74,90,80,0.10)" : "transparent",
                  }}
                >
                  {/* Icon chip: gold-tinted when active, neutral otherwise. */}
                  <span
                    className="grid h-8 w-8 shrink-0 place-items-center rounded-lg"
                    style={{
                      background: active ? SAGE : "var(--color-mist)",
                      color: active ? "#fff" : "#7A8A83",
                    }}
                  >
                    <Icon size={16} />
                  </span>
                  <span className="flex-1">{l.label}</span>
                  <ChevronRight size={16} style={{ color: active ? GOLD : "#C4C0B6" }} />
                </Link>
              );
            })}
            <div className="mt-1.5 pt-2.5" style={{ borderTop: `1px solid ${LINE}` }}>
              {user ? (
                <button
                  onClick={() => { setOpen(false); logout(); }}
                  className="flex w-full items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white transition-transform active:scale-[0.98]"
                  style={{ background: SAGE, boxShadow: `0 8px 22px ${SAGE}44` }}
                >
                  <LogOut size={16} /> Log out
                </button>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className="flex w-full items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white transition-transform active:scale-[0.98]"
                  style={{ background: SAGE, boxShadow: `0 8px 22px ${SAGE}44` }}
                >
                  <LogIn size={16} /> Login
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>

    {/* On non-landing pages there's no full-screen hero behind the fixed pill,
        so reserve space to keep page content from sliding underneath it. */}
    {!onHero && <div aria-hidden style={{ height: 88 }} />}
    </>
  );
}
