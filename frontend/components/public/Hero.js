"use client";

// Full-screen hero with a slow cross-fading image slider, layered overlays and
// glow orbs (matches the design). Headline, sub-copy, two CTAs and trust pills
// rise up on load. The bottom dots let you jump between slides.
//
// PERF NOTE: the entrance animations are PURE CSS (.rise in globals.css), NOT
// Framer Motion. Framer sets opacity:0 in the server HTML and only reveals the
// element after the JS bundle hydrates, which made the navbar + text pop in
// seconds after the background image (very visible on mobile). CSS keyframes run
// at paint time, so the copy now appears together with the image.

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Users, CheckCircle } from "lucide-react";
import { SAGE, GOLD } from "./palette";

// Hero slideshow images (premium interiors).
const HERO_IMGS = [
  { src: "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=1920&h=1080&fit=crop&auto=format", alt: "Luxury bedroom suite" },
  { src: "https://images.unsplash.com/photo-1556912172-45b7abe8b7e1?w=1920&h=1080&fit=crop&auto=format", alt: "Loft luxury living room" },
  { src: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1920&h=1080&fit=crop&auto=format", alt: "Modern living room with large windows" },
  { src: "https://images.unsplash.com/photo-1722605090433-41d1183a792d?w=1920&h=1080&fit=crop&auto=format", alt: "Premium kitchen" },
  { src: "https://images.unsplash.com/photo-1776095582810-0200c3b3c97d?w=1920&h=1080&fit=crop&auto=format", alt: "Balcony city view" },
  { src: "https://images.unsplash.com/photo-1750420556288-d0e32a6f517b?w=1920&h=1080&fit=crop&auto=format", alt: "Styled modern bedroom" },
];

const TRUST = ["No login to browse", "Email-verified accounts", "Chat owners directly"];

export default function Hero() {
  const [slide, setSlide] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setSlide((s) => (s + 1) % HERO_IMGS.length), 5000);
    return () => clearInterval(id);
  }, []);

  return (
    <section
      className="relative w-full overflow-hidden"
      style={{
        height: "100vh",
        minHeight: 700,
        // Dark branded base so the hero is never a blank WHITE box before the
        // (remote) slideshow image downloads — it shows a deep olive backdrop that
        // the image simply fades in over.
        background: "linear-gradient(160deg, #1E2521 0%, #2A332C 100%)",
      }}
    >
      {/* Image slider. First slide loads eager + high priority so the hero paints
          ASAP; the rest lazy-load so they don't compete on first render. */}
      {HERO_IMGS.map((img, i) => (
        <div
          key={i}
          className="absolute inset-0"
          style={{ opacity: i === slide ? 1 : 0, transition: "opacity 1s ease-in-out", zIndex: 0 }}
        >
          <img
            src={img.src}
            alt={img.alt}
            className="w-full h-full object-cover"
            loading={i === 0 ? "eager" : "lazy"}
            fetchPriority={i === 0 ? "high" : "low"}
            decoding="async"
          />
        </div>
      ))}

      {/* Overlays */}
      <div className="absolute inset-0 z-10" style={{ background: "linear-gradient(180deg,rgba(30,37,33,.22) 0%,rgba(30,37,33,.52) 55%,rgba(30,37,33,.88) 100%)" }} />
      <div className="absolute inset-0 z-10" style={{ background: "radial-gradient(ellipse at center,transparent 30%,rgba(30,37,33,.38) 100%)" }} />

      {/* Glow orbs */}
      <div className="absolute z-10 pointer-events-none" style={{ top: "18%", left: "7%", width: 480, height: 480, borderRadius: "50%", background: `radial-gradient(circle,${GOLD}1A 0%,transparent 65%)`, animation: "glow-pulse 8s ease-in-out infinite" }} />
      <div className="absolute z-10 pointer-events-none" style={{ bottom: "18%", right: "6%", width: 360, height: 360, borderRadius: "50%", background: `radial-gradient(circle,${SAGE}30 0%,transparent 65%)`, animation: "glow-pulse 10s ease-in-out infinite 3s" }} />

      {/* Content */}
      <div className="relative z-20 h-full flex flex-col justify-center items-center text-center px-6 pt-24">
        {/* Pill badge */}
        <div
          className="rise inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 text-sm font-semibold"
          style={{ animationDelay: "0.1s", background: "transparent", border: `1px solid ${GOLD}66`, color: GOLD }}
        >
          <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: GOLD }} />
          Kerala&apos;s Most Trusted Rental Platform
        </div>

        {/* Headline */}
        <h1
          className="rise font-bold leading-none mb-5"
          style={{ animationDelay: "0.2s", fontSize: "clamp(40px,6.5vw,72px)", color: "white", textShadow: "0 4px 28px rgba(0,0,0,.28)", maxWidth: 880 }}
        >
          Kerala&apos;s Friendly Stay &amp;<br />
          <span style={{ color: GOLD }}>Roommate Finder</span>
        </h1>

        {/* Subhead */}
        <p
          className="rise whitespace-nowrap text-[13px] sm:text-lg md:text-xl font-medium mb-3"
          style={{ animationDelay: "0.32s", color: "rgba(255,255,255,.82)", maxWidth: 560 }}
        >
          Find your next stay, roommate &amp; rental space
        </p>

        <p
          className="rise hidden sm:block text-sm leading-relaxed mb-8"
          style={{ animationDelay: "0.42s", color: "rgba(255,255,255,.58)", maxWidth: 520 }}
        >
          Browse rooms, PGs, apartments and rentals across Kerala, every listing is admin-checked. Chat owners directly, find compatible roommates, and move in faster. All in one place.
        </p>

        {/* Buttons */}
        <div
          className="rise flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 justify-center items-stretch sm:items-center mb-7 w-full max-w-xs sm:max-w-none"
          style={{ animationDelay: "0.52s" }}
        >
          <Link href="/properties" className="w-full sm:w-auto">
            <span
              className="flex items-center justify-center gap-2 px-6 py-3.5 sm:px-8 sm:py-4 rounded-full font-semibold text-base text-white transition-transform duration-200 hover:-translate-y-0.5 hover:scale-[1.04] active:scale-95"
              style={{ background: SAGE, boxShadow: `0 10px 32px ${SAGE}80` }}
            >
              Explore Listings <ArrowRight size={18} />
            </span>
          </Link>
          <Link href="/roommates" className="w-full sm:w-auto">
            <span
              className="flex items-center justify-center gap-2 px-6 py-3.5 sm:px-8 sm:py-4 rounded-full font-semibold text-base text-white transition-transform duration-200 hover:-translate-y-0.5 hover:scale-[1.04] active:scale-95"
              style={{ background: "rgba(255,255,255,.12)", border: "1.5px solid rgba(255,255,255,.32)" }}
            >
              Find a Roommate <Users size={18} />
            </span>
          </Link>
        </div>

        {/* Trust pills */}
        <div
          className="rise flex flex-wrap gap-2 sm:gap-3 justify-center max-w-xs sm:max-w-none"
          style={{ animationDelay: "0.62s" }}
        >
          {TRUST.map((tag) => (
            <div
              key={tag}
              className="flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-transform duration-200 hover:-translate-y-0.5 hover:scale-105"
              style={{ background: "rgba(255,255,255,.10)", border: "1px solid rgba(255,255,255,.18)", color: "rgba(255,255,255,.88)", backdropFilter: "blur(8px)" }}
            >
              <CheckCircle size={13} color={GOLD} />
              {tag}
            </div>
          ))}
        </div>
      </div>

      {/* Slide dots */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-2">
        {HERO_IMGS.map((_, i) => (
          <button
            key={i}
            onClick={() => setSlide(i)}
            aria-label={`Go to slide ${i + 1}`}
            style={{ width: i === slide ? 26 : 8, height: 8, borderRadius: 999, background: i === slide ? GOLD : "rgba(255,255,255,.35)", transition: "all 0.35s ease", border: "none", cursor: "pointer" }}
          />
        ))}
      </div>
    </section>
  );
}
