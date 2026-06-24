"use client";

// Animated number that counts up from 0 to `value` the first time it scrolls
// into view (eased). Used for the live DB stats so they feel alive. Renders the
// final value immediately if motion is reduced / observer is unavailable.

import { useEffect, useRef, useState } from "react";

export default function CountUp({ value = 0, suffix = "+", duration = 1400, className = "" }) {
  const ref = useRef(null);
  const [n, setN] = useState(0);
  const [started, setStarted] = useState(false);

  // Start the count once the element is visible.
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setN(value);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setStarted(true);
          io.disconnect();
        }
      },
      { threshold: 0.4 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [value]);

  // Run the eased count-up animation.
  useEffect(() => {
    if (!started) return;
    let raf;
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3); // ease-out cubic
      setN(Math.round(value * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [started, value, duration]);

  const display = n.toLocaleString("en-IN");
  return (
    <span ref={ref} className={className}>
      {display}
      {value > 0 ? suffix : ""}
    </span>
  );
}
