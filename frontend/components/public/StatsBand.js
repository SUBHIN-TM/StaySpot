"use client";

// "We're just getting started" — big animated counters. Listings / seekers /
// owners are live numbers from the database (passed in from the server-rendered
// landing page); "Cities" is a static figure. Counts up when scrolled into view.

import { motion } from "motion/react";
import CountUp from "./CountUp";
import { GOLD, SAGE, OLIVE } from "./palette";

export default function StatsBand({ stats = {} }) {
  const { listings = 0, seekers = 0, owners = 0 } = stats;

  const items = [
    { label: "Cities", value: 6 },
    { label: "Live Listings", value: listings },
    { label: "Happy Seekers", value: seekers },
    { label: "Trusted Owners", value: owners },
  ];

  return (
    <section className="py-24 px-6 text-center" style={{ background: "var(--color-cream)" }}>
      <div className="max-w-4xl mx-auto">
        <motion.p initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.5 }} className="text-sm font-bold uppercase tracking-widest mb-3" style={{ color: GOLD }}>
          Our journey
        </motion.p>
        <motion.h2 initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.5 }} transition={{ delay: 0.08 }} className="text-4xl md:text-5xl font-bold mb-3" style={{ color: OLIVE }}>
          We&apos;re Just Getting Started
        </motion.h2>
        <motion.p initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.5 }} transition={{ delay: 0.12 }} className="text-base mb-16" style={{ color: "#5A6B63" }}>
          Building Kerala&apos;s most trusted rental community.
        </motion.p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {items.map((st, i) => (
            <motion.div
              key={st.label}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ delay: 0.2 + i * 0.1 }}
            >
              <div className="text-5xl md:text-6xl font-bold mb-2" style={{ color: SAGE }}>
                <CountUp value={st.value} />
              </div>
              <div className="text-sm" style={{ color: "#7A8A83" }}>{st.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
