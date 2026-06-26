"use client";

// Global top navigation progress bar — instant "it's loading" feedback so
// clicking a link/button never feels stuck while the next page loads.
// Zero dependencies, lives once in the root layout.
//
// How it works:
//  • A capture-phase click listener spots clicks on internal <a>/<Link>
//    elements and starts the bar. It also catches browser back/forward
//    (popstate) and programmatic navigations that call startNavProgress().
//  • When the new route commits, usePathname/useSearchParams change and we
//    finish the bar.
//  • Fast (prefetched) navigations resolve before the short reveal delay, so
//    the bar never even shows — no annoying flash on instant pages.

import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

const REVEAL_DELAY = 120; // ms before showing — skips flicker on instant nav
const TRICKLE_MS = 300; // how often the bar creeps forward while waiting
const SAFETY_MS = 12000; // force-finish if a navigation never resolves

export default function NavProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [progress, setProgress] = useState(0); // 0–100 (0 = hidden)
  const [visible, setVisible] = useState(false);

  // Timers + in-flight flag kept in refs so the listeners stay stable.
  const revealTimer = useRef(null);
  const trickleTimer = useRef(null);
  const safetyTimer = useRef(null);
  const fadeTimer = useRef(null);
  const activeRef = useRef(false);

  function start() {
    if (activeRef.current) return; // a navigation is already in flight
    activeRef.current = true;
    clearTimeout(fadeTimer.current);
    // Wait a beat before revealing so instant navigations show nothing.
    revealTimer.current = setTimeout(() => {
      setVisible(true);
      setProgress(8);
      // Creep forward, slowing as it nears ~90% (it never reaches 100 on its
      // own — only a completed navigation snaps it to the finish).
      trickleTimer.current = setInterval(() => {
        setProgress((p) => (p < 90 ? p + Math.max(1, (90 - p) * 0.12) : p));
      }, TRICKLE_MS);
    }, REVEAL_DELAY);
    safetyTimer.current = setTimeout(finish, SAFETY_MS);
  }

  function finish() {
    if (!activeRef.current) return;
    activeRef.current = false;
    clearTimeout(revealTimer.current);
    clearInterval(trickleTimer.current);
    clearTimeout(safetyTimer.current);
    // If the bar was actually shown, snap to 100% then fade; otherwise it
    // stays at 0 (hidden) and the fade is a no-op.
    setProgress((p) => (p > 0 ? 100 : 0));
    fadeTimer.current = setTimeout(() => {
      setVisible(false);
      setProgress(0);
    }, 240);
  }

  // Wire up the click / back-forward / manual triggers once.
  useEffect(() => {
    function onClick(e) {
      // Only plain left-clicks without modifier keys (let new-tab etc. pass).
      if (
        e.defaultPrevented ||
        e.button !== 0 ||
        e.metaKey ||
        e.ctrlKey ||
        e.shiftKey ||
        e.altKey
      )
        return;
      const a = e.target.closest && e.target.closest("a");
      if (!a) return;
      const href = a.getAttribute("href");
      if (!href) return;
      if (a.target && a.target !== "_self") return; // opens elsewhere
      if (a.hasAttribute("download")) return;
      if (href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:"))
        return;
      let dest;
      try {
        dest = new URL(href, window.location.href);
      } catch {
        return;
      }
      if (dest.origin !== window.location.origin) return; // external link
      // Same page (ignoring hash) → no real navigation.
      if (
        dest.pathname === window.location.pathname &&
        dest.search === window.location.search
      )
        return;
      start();
    }

    function onManualStart() {
      start();
    }

    document.addEventListener("click", onClick, true); // capture, before React
    window.addEventListener("popstate", onManualStart);
    window.addEventListener("navprogress:start", onManualStart);
    return () => {
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("popstate", onManualStart);
      window.removeEventListener("navprogress:start", onManualStart);
      clearTimeout(revealTimer.current);
      clearInterval(trickleTimer.current);
      clearTimeout(safetyTimer.current);
      clearTimeout(fadeTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // The new route has committed → finish (no-op if nothing was in flight).
  useEffect(() => {
    finish();
  }, [pathname, searchParams]);

  return (
    <div
      aria-hidden="true"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        height: 3,
        width: `${progress}%`,
        zIndex: 9999,
        background: "linear-gradient(90deg, #4A5A50, #D4A359)",
        boxShadow: "0 0 10px rgba(212,163,89,.7), 0 0 4px rgba(74,90,80,.6)",
        borderRadius: "0 3px 3px 0",
        opacity: visible ? 1 : 0,
        transition: "width .2s ease, opacity .3s ease",
        pointerEvents: "none",
      }}
    />
  );
}
