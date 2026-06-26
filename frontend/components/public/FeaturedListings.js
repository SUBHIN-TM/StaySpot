"use client";

// "Featured Places" — the latest real listings from the database (passed in from
// the server-rendered landing page). Cards reveal on scroll with a stagger; the
// card visuals live in the shared PropertyCard component.

import Link from "next/link";
import { motion } from "motion/react";
import { ArrowRight } from "lucide-react";
import PropertyCard from "./PropertyCard";
import { GOLD, OLIVE, SAGE } from "./palette";

const EASE = [0.22, 1, 0.36, 1];

export default function FeaturedListings({ properties = [] }) {
  return (
    <section className="py-24 px-6" style={{ background: "var(--color-mist)" }}>
      <div className="max-w-6xl mx-auto">
        <div className="flex items-end justify-between mb-12">
          <div>
            <motion.p
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.6 }}
              className="text-sm font-bold uppercase tracking-widest mb-2"
              style={{ color: GOLD }}
            >
              Handpicked for you
            </motion.p>
            <motion.h2
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.6 }}
              transition={{ delay: 0.08 }}
              className="text-4xl font-bold"
              style={{ color: OLIVE }}
            >
              Featured Places
            </motion.h2>
          </div>
          <Link
            href="/properties"
            className="hidden md:flex items-center gap-1 text-sm font-semibold hover:gap-2 transition-all"
            style={{ color: SAGE }}
          >
            View all <ArrowRight size={15} />
          </Link>
        </div>

        {properties.length === 0 ? (
          <p
            className="rounded-3xl border border-dashed p-12 text-center"
            style={{ borderColor: "rgba(30,37,33,.2)", background: "white", color: "rgba(30,37,33,.5)" }}
          >
            No listings to show yet. Start the backend and seed it
            (<code className="rounded px-1.5 py-0.5" style={{ background: "var(--color-mist)" }}>npm run db:seed</code>{" "}
            in the backend folder) to see live properties here.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.15 }}
                transition={{ delay: 0.06 + (i % 3) * 0.08, duration: 0.6, ease: EASE }}
              >
                <PropertyCard property={p} />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
