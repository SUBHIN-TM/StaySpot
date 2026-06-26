"use client";

// "Find exactly what you're looking for" — the three real people StayMate serves
// (Seekers, Owners, Roommates). Each card has its own accent colour, a soft
// gradient surface and a hover lift. Reveals on scroll with a small stagger.

import Link from "next/link";
import { motion } from "motion/react";
import { Search, Building2, Users, ArrowRight } from "lucide-react";
import { GOLD, SAGE, OLIVE, LINE } from "./palette";

const EASE = [0.22, 1, 0.36, 1];

const CARDS = [
  {
    icon: Search,
    color: "#5E9275",
    title: "For Seekers",
    sub: "Explore & Discover",
    desc: "Explore admin-checked listings across India, filter by city, budget and property type, save favourites and connect instantly.",
    btn: "Explore Listings",
    href: "/properties",
    bg: "linear-gradient(145deg,#EDF4EF 0%,#E3EDE7 100%)",
  },
  {
    icon: Building2,
    color: SAGE,
    title: "For Owners",
    sub: "List & Manage",
    desc: "Post your room, apartment or PG in minutes, receive verified enquiries and manage conversations from one dashboard.",
    btn: "List Property",
    href: "/owner/signup",
    bg: "linear-gradient(145deg,#EDF1EE 0%,#E5ECE7 100%)",
  },
  {
    icon: Users,
    color: "#6B9A77",
    title: "For Roommates",
    sub: "Match & Connect",
    desc: "Find compatible roommates using preferences, lifestyle and budget before moving in together.",
    btn: "Find Match",
    href: "/roommates",
    bg: "linear-gradient(145deg,#F0F5F1 0%,#E8F0EB 100%)",
  },
];

export default function Audience() {
  return (
    <section className="py-24 px-6" style={{ background: "var(--color-cream)" }}>
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <motion.p
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            className="text-sm font-bold uppercase tracking-widest mb-3"
            style={{ color: GOLD }}
          >
            What we offer
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ delay: 0.08 }}
            className="text-4xl md:text-5xl font-bold"
            style={{ color: OLIVE }}
          >
            Find exactly what<br />you&apos;re looking for
          </motion.h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {CARDS.map((c, i) => {
            const Icon = c.icon;
            return (
              <motion.div
                key={c.title}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ delay: 0.1 + i * 0.12, duration: 0.65, ease: EASE }}
                whileHover={{ y: -10 }}
                className="relative p-8 rounded-3xl overflow-hidden cursor-pointer"
                style={{ background: c.bg, border: `1px solid ${LINE}`, boxShadow: "0 4px 24px rgba(30,37,33,.06)", transition: "box-shadow 0.35s ease" }}
                onMouseEnter={(e) => { e.currentTarget.style.boxShadow = `0 28px 72px rgba(30,37,33,.14), inset 0 0 0 1.5px ${c.color}60`; }}
                onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "0 4px 24px rgba(30,37,33,.06)"; }}
              >
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6" style={{ background: `${c.color}1A` }}>
                  <Icon size={24} color={c.color} />
                </div>
                <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: c.color }}>{c.sub}</p>
                <h3 className="text-2xl font-bold mb-3" style={{ color: OLIVE }}>{c.title}</h3>
                <p className="text-sm leading-relaxed mb-7" style={{ color: "#5A6B63" }}>{c.desc}</p>
                <Link href={c.href}>
                  <motion.span
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.96 }}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold text-white"
                    style={{ background: c.color }}
                  >
                    {c.btn} <ArrowRight size={14} />
                  </motion.span>
                </Link>
                <div className="absolute -bottom-10 -right-10 w-40 h-40 rounded-full" style={{ background: c.color, opacity: 0.08 }} />
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
