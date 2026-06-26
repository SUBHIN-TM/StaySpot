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
import { Home, Menu, X as XIcon } from "lucide-react";
import { getCurrentUser, getUserToken, clearUser, saveUser } from "@/lib/userAuth";
import { apiGet } from "@/lib/api";
import AvatarMenu from "./AvatarMenu";
import NotificationBell from "@/components/NotificationBell";
import { SAGE, GOLD, OLIVE, LINE } from "./palette";

const EASE = [0.22, 1, 0.36, 1];

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
    { href: "/", label: "Home" },
    { href: "/properties", label: "Explore" },
    { href: "/roommates", label: "Find Roommates" },
    { href: "/owner", label: "For Owners" },
  ];

  function isActive(href) {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(href + "/");
  }

  // The navbar floats transparently only over the landing hero. On every other
  // page (no full-screen hero) it stays a solid white pill so it's readable.
  const onHero = pathname === "/";
  const solid = scrolled || !onHero;

  const pillBg = solid ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.10)";
  const txtCol = solid ? OLIVE : "rgba(255,255,255,0.92)";
  const shadow = solid
    ? "0 10px 48px rgba(30,37,33,0.14)"
    : "0 4px 24px rgba(0,0,0,0.14)";

  return (
    <>
    <motion.header
      className="fixed top-0 inset-x-0 z-50 flex justify-center"
      initial={{ y: -90, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.75, ease: EASE }}
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
        <Link href="/" className="flex items-center gap-2 flex-shrink-0">
          <span className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: SAGE }}>
            <Home size={14} color="white" />
          </span>
          <span className="font-bold text-base" style={{ color: solid ? OLIVE : "white" }}>
            StayMate
          </span>
        </Link>

        {/* Links */}
        <nav className="hidden md:flex items-center gap-6 flex-1 justify-center">
          {links.map((l) => {
            const active = isActive(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className="text-sm font-medium transition-opacity duration-200 hover:opacity-100"
                style={{ color: active ? GOLD : txtCol, opacity: active ? 1 : 0.72 }}
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
              <NotificationBell token={getUserToken()} messagesPath="/messages" />
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

        {/* Hamburger */}
        <button
          className="md:hidden ml-auto"
          onClick={() => setOpen(!open)}
          style={{ color: solid ? OLIVE : "white" }}
          aria-label="Toggle menu"
        >
          {open ? <XIcon size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.97 }}
            transition={{ duration: 0.2 }}
            className="absolute top-20 left-4 right-4 rounded-2xl p-4 space-y-1"
            style={{
              background: "rgba(255,255,255,0.97)",
              backdropFilter: "blur(20px)",
              border: `1px solid ${LINE}`,
              boxShadow: "0 24px 70px rgba(30,37,33,0.15)",
            }}
          >
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="block px-4 py-3 rounded-xl text-sm font-medium"
                style={{ color: isActive(l.href) ? SAGE : OLIVE }}
              >
                {l.label}
              </Link>
            ))}
            <div className="pt-2" style={{ borderTop: `1px solid ${LINE}` }}>
              {user ? (
                <button
                  onClick={() => { setOpen(false); logout(); }}
                  className="w-full py-3 rounded-xl text-sm font-semibold text-white"
                  style={{ background: SAGE }}
                >
                  Log out
                </button>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className="block text-center w-full py-3 rounded-xl text-sm font-semibold text-white"
                  style={{ background: SAGE }}
                >
                  Login
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>

    {/* On non-landing pages there's no full-screen hero behind the fixed pill,
        so reserve space to keep page content from sliding underneath it. */}
    {!onHero && <div aria-hidden style={{ height: 88 }} />}
    </>
  );
}
