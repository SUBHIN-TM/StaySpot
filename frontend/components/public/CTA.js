"use client";

// Final call-to-action band before the footer. Warm cream panel with a soft gold
// glow and floating house/building decorations.

import Link from "next/link";
import { motion } from "motion/react";
import { Home, Building2, ArrowRight } from "lucide-react";
import { GOLD, SAGE, OLIVE, LINE } from "./palette";

const EASE = [0.22, 1, 0.36, 1];

export default function CTA() {
  return (
    <section className="py-24 px-6" style={{ background: "var(--color-cream)" }}>
      <div className="max-w-4xl mx-auto">
        <div
          className="relative overflow-hidden rounded-3xl p-12 md:p-20 text-center"
          style={{ background: "linear-gradient(145deg,#F5F0E8 0%,#EDE5D5 60%,#E4DBC8 100%)", border: `1px solid ${LINE}`, boxShadow: "0 28px 90px rgba(30,37,33,.10)" }}
        >
          <div className="absolute inset-0 pointer-events-none" style={{ background: `radial-gradient(ellipse at 50% -10%,${GOLD}28 0%,transparent 55%)` }} />

          {/* Floating decorations */}
          <div className="absolute right-10 top-6 pointer-events-none" style={{ animation: "floatSlow 8s ease-in-out infinite", opacity: 0.1 }}>
            <Home size={96} color={SAGE} />
          </div>
          <div className="absolute left-8 bottom-6 pointer-events-none" style={{ animation: "floatSlow 11s ease-in-out infinite 2.5s", opacity: 0.08 }}>
            <Building2 size={64} color={GOLD} />
          </div>

          <div className="relative z-10">
            <motion.div
              initial={{ opacity: 0, scale: 0.88 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.6, ease: EASE }}
              className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
              style={{ background: `${SAGE}18`, border: `1.5px solid ${SAGE}30` }}
            >
              <Home size={28} color={SAGE} />
            </motion.div>

            <motion.h2 initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.5 }} transition={{ delay: 0.1 }} className="text-4xl md:text-5xl font-bold mb-4" style={{ color: OLIVE }}>
              Ready to Find Your<br /><span style={{ color: SAGE }}>Perfect Stay?</span>
            </motion.h2>

            <motion.p initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.5 }} transition={{ delay: 0.14 }} className="text-base mb-8" style={{ color: "#5A6B63" }}>
              Join thousands discovering rooms, rentals and roommates across India.
            </motion.p>

            <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.5 }} transition={{ delay: 0.18 }} className="flex flex-wrap gap-4 justify-center">
              <Link href="/properties">
                <motion.span whileHover={{ scale: 1.04, y: -3 }} whileTap={{ scale: 0.97 }} className="flex items-center gap-2 px-8 py-4 rounded-full font-semibold text-white" style={{ background: SAGE, boxShadow: `0 10px 28px ${SAGE}55` }}>
                  Explore Listings <ArrowRight size={18} />
                </motion.span>
              </Link>
              <Link href="/owner/signup">
                <motion.span whileHover={{ scale: 1.04, y: -3 }} whileTap={{ scale: 0.97 }} className="flex items-center gap-2 px-8 py-4 rounded-full font-semibold" style={{ border: `1.5px solid ${SAGE}`, color: SAGE, background: "white" }}>
                  Get Started
                </motion.span>
              </Link>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
