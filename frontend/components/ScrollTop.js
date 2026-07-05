"use client";

// Guarantees every client-side route change starts at the TOP of the page.
// Next's App Router usually does this, but it can be defeated by long pages or
// browser scroll restoration, which left destinations (e.g. /properties) scrolled
// to wherever the user had clicked. This forces the window back to the top on
// each pathname change (anchor / #hash targets are left alone).

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export default function ScrollTop() {
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.location.hash) return; // don't fight in-page anchor targets
    // rAF so it runs after the new page paints (beats any late layout shift).
    requestAnimationFrame(() => window.scrollTo(0, 0));
  }, [pathname]);

  return null;
}
