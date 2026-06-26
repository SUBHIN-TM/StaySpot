"use client";

// Full-screen hero with a slow cross-fading image slider, layered overlays and
// glow orbs (matches the design). Headline, sub-copy, two CTAs and trust pills
// fade up on load. The bottom dots let you jump between slides.

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { ArrowRight, Users, CheckCircle } from "lucide-react";
import { SAGE, GOLD } from "./palette";

const EASE = [0.22, 1, 0.36, 1];

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
    <section className="relative w-full overflow-hidden" style={{ height: "100vh", minHeight: 700 }}>
      {/* Image slider */}
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
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.65, ease: EASE }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 text-sm font-medium"
          style={{ background: `${GOLD}28`, border: `1px solid ${GOLD}55`, color: GOLD, backdropFilter: "blur(12px)" }}
        >
          <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: GOLD }} />
          India&apos;s Most Trusted Rental Platform
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55, duration: 0.95, ease: EASE }}
          className="font-bold leading-none mb-5"
          style={{ fontSize: "clamp(40px,6.5vw,72px)", color: "white", textShadow: "0 4px 28px rgba(0,0,0,.28)", maxWidth: 880 }}
        >
          India&apos;s Friendly Stay &amp;<br />
          <span style={{ color: GOLD }}>Roommate Finder</span>
        </motion.h1>

        {/* Subhead */}
        <motion.p
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.75, duration: 0.6 }}
          className="text-lg md:text-xl font-medium mb-3"
          style={{ color: "rgba(255,255,255,.82)", maxWidth: 560 }}
        >
          Find your next stay, roommate &amp; rental space
        </motion.p>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.88, duration: 0.6 }}
          className="text-sm leading-relaxed mb-8"
          style={{ color: "rgba(255,255,255,.58)", maxWidth: 520 }}
        >
          Browse rooms, PGs, apartments and rentals across India — every listing is admin-checked. Chat owners directly, find compatible roommates, and move in faster. All in one place.
        </motion.p>

        {/* Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0, duration: 0.6 }}
          className="flex flex-wrap gap-4 justify-center mb-7"
        >
          <Link href="/properties">
            <motion.span
              whileHover={{ scale: 1.04, y: -3 }}
              whileTap={{ scale: 0.97 }}
              className="flex items-center gap-2 px-8 py-4 rounded-full font-semibold text-base text-white"
              style={{ background: SAGE, boxShadow: `0 10px 32px ${SAGE}80` }}
            >
              Explore Listings <ArrowRight size={18} />
            </motion.span>
          </Link>
          <Link href="/roommates">
            <motion.span
              whileHover={{ scale: 1.04, y: -3 }}
              whileTap={{ scale: 0.97 }}
              className="flex items-center gap-2 px-8 py-4 rounded-full font-semibold text-base text-white"
              style={{ background: "rgba(255,255,255,.12)", border: "1.5px solid rgba(255,255,255,.32)" }}
            >
              Find a Roommate <Users size={18} />
            </motion.span>
          </Link>
        </motion.div>

        {/* Trust pills */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.12, duration: 0.6 }}
          className="flex flex-wrap gap-3 justify-center"
        >
          {TRUST.map((tag) => (
            <motion.div
              key={tag}
              whileHover={{ scale: 1.05, y: -2 }}
              className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium"
              style={{ background: "rgba(255,255,255,.10)", border: "1px solid rgba(255,255,255,.18)", color: "rgba(255,255,255,.88)", backdropFilter: "blur(8px)" }}
            >
              <CheckCircle size={13} color={GOLD} />
              {tag}
            </motion.div>
          ))}
        </motion.div>
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
