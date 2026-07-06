"use client";

// Adds `class="hydrated"` to <html> once React has hydrated on the client.
// Used purely as a CSS hook: until this class is present, a failsafe rule in
// globals.css forces scroll-entrance content (which Framer Motion ships at
// opacity:0 in the server HTML) to stay VISIBLE, so a user who scrolls before
// hydration never sees blank/white sections. After hydration the flag flips and
// the normal fade-in-on-scroll animations run as usual.

import { useEffect } from "react";

export default function HydrationFlag() {
  useEffect(() => {
    document.documentElement.classList.add("hydrated");
  }, []);
  return null;
}
