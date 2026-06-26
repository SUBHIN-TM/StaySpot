"use client";

// 4-step "how it works" timeline as a vertical, colour-graded list (matches the
// design). Reflects the real flow: browse without an account, sign up only to
// chat, talk to owners/roommates, move in.

import { motion } from "motion/react";
import { Search, UserCheck, MessageCircle, Key } from "lucide-react";
import { GOLD, SAGE, OLIVE } from "./palette";

const EASE = [0.22, 1, 0.36, 1];

const STEPS = [
  { n: "01", I: Search, t: "Search & Filter", d: "Explore listings by city, type and budget — or find roommates. No account needed to browse." },
  { n: "02", I: UserCheck, t: "Sign Up in Seconds", d: "Create an account with Google or email — verified by a one-time code (OTP)." },
  { n: "03", I: MessageCircle, t: "Chat Directly", d: "Message owners or potential roommates in-app. Ask questions, share details and arrange a visit." },
  { n: "04", I: Key, t: "Move In", d: "Pick the place that fits, agree the terms and settle into your new home." },
];

const STEP_COLORS = [GOLD, SAGE, "#7B9E87", "#8B7355"];

export default function HowItWorks() {
  return (
    <section className="py-24 px-6" style={{ background: "var(--color-cream)" }}>
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-16">
          <motion.p
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            className="text-sm font-bold uppercase tracking-widest mb-3"
            style={{ color: GOLD }}
          >
            Simple process
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ delay: 0.08 }}
            className="text-4xl font-bold"
            style={{ color: OLIVE }}
          >
            Find Your Stay in<br />Four Simple Steps
          </motion.h2>
        </div>

        <div className="space-y-5">
          {STEPS.map((step, i) => {
            const Icon = step.I;
            return (
              <motion.div
                key={step.n}
                initial={{ opacity: 0, x: -32 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ delay: 0.15 + i * 0.12, duration: 0.65, ease: EASE }}
                className="flex gap-5 items-start"
              >
                <div className="flex flex-col items-center flex-shrink-0">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center"
                    style={{ background: STEP_COLORS[i], boxShadow: `0 8px 24px ${STEP_COLORS[i]}55` }}
                  >
                    <Icon size={20} color="white" />
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className="w-px h-6 mt-1.5" style={{ background: `linear-gradient(to bottom,${STEP_COLORS[i]},${STEP_COLORS[i + 1]})` }} />
                  )}
                </div>

                <div className="flex-1 pt-1.5">
                  <span className="text-xs font-bold uppercase tracking-widest" style={{ color: STEP_COLORS[i] }}>Step {step.n}</span>
                  <h3 className="text-xl font-bold mt-1 mb-1.5" style={{ color: OLIVE }}>{step.t}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: "#5A6B63" }}>{step.d}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
