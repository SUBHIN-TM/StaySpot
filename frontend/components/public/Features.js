"use client";

// "Why StayMate" — a dark sage→olive panel pairing the value proposition (talk
// directly, no middlemen) with a live-looking chat mockup. The mock chat is
// decorative; the real chat lives at /messages.

import { motion } from "motion/react";
import { Home, Send, MessageCircle, Bell, Lock } from "lucide-react";
import { GOLD, SAGE, OLIVE, SUCCESS } from "./palette";

const EASE = [0.22, 1, 0.36, 1];

const CHAT = [
  { txt: "Hi! Is the 2BHK in Kochi still available?", own: false },
  { txt: "Yes, available from 1st August!", own: true },
  { txt: "Can I visit this Saturday at 11 AM?", own: false },
  { txt: "Perfect! See you then 🏡", own: true },
];

const WHY_FEATS = [
  { icon: MessageCircle, text: "Real-time messaging" },
  { icon: Bell, text: "Notification badges" },
  { icon: Send, text: "Instant replies" },
  { icon: Lock, text: "Secure conversations" },
];

export default function Features() {
  return (
    <section className="py-24 px-6" style={{ background: "var(--color-mist)" }}>
      <div className="max-w-6xl mx-auto">
        <div
          className="relative overflow-hidden rounded-3xl p-10 md:p-16"
          style={{ background: `linear-gradient(135deg,${SAGE} 0%,${OLIVE} 100%)` }}
        >
          {/* Glow */}
          <div className="absolute top-0 right-0 w-96 h-96 rounded-full pointer-events-none" style={{ background: `radial-gradient(circle,${GOLD}28 0%,transparent 65%)`, transform: "translate(30%,-30%)", animation: "glow-pulse 8s ease-in-out infinite" }} />
          <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full pointer-events-none" style={{ background: "radial-gradient(circle,rgba(255,255,255,.12) 0%,transparent 65%)", transform: "translate(-22%,22%)" }} />

          <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            {/* Left copy */}
            <div>
              <motion.p initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.3 }} className="text-sm font-bold uppercase tracking-widest mb-3" style={{ color: GOLD }}>
                Why StayMate
              </motion.p>
              <motion.h2 initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.3 }} transition={{ delay: 0.08 }} className="text-3xl md:text-4xl font-bold text-white mb-5">
                Everything You Need,<br />in One Place
              </motion.h2>
              <motion.p initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.3 }} transition={{ delay: 0.12 }} className="font-semibold mb-2 text-lg" style={{ color: "rgba(255,255,255,.9)" }}>
                Talk directly — no middlemen
              </motion.p>
              <motion.p initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.3 }} transition={{ delay: 0.15 }} className="text-sm leading-relaxed mb-8" style={{ color: "rgba(255,255,255,.55)" }}>
                Built-in chat connects seekers with owners, roommates with roommates and anyone with support.
              </motion.p>
              <div className="grid grid-cols-2 gap-3">
                {WHY_FEATS.map(({ icon: Icon, text }, i) => (
                  <motion.div
                    key={text}
                    initial={{ opacity: 0, x: -16 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, amount: 0.3 }}
                    transition={{ delay: 0.3 + i * 0.08 }}
                    className="flex items-center gap-2.5"
                  >
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "rgba(255,255,255,.10)" }}>
                      <Icon size={14} color={GOLD} />
                    </div>
                    <span className="text-xs" style={{ color: "rgba(255,255,255,.65)" }}>{text}</span>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Right: Chat UI */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ delay: 0.32, duration: 0.8, ease: EASE }}
              className="rounded-2xl p-4"
              style={{ background: "rgba(255,255,255,.07)", border: "1px solid rgba(255,255,255,.12)", backdropFilter: "blur(18px)" }}
            >
              {/* Header */}
              <div className="flex items-center gap-3 mb-4 pb-4" style={{ borderBottom: "1px solid rgba(255,255,255,.1)" }}>
                <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: GOLD }}>
                  <Home size={16} color={OLIVE} />
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">Raj (Owner)</div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: SUCCESS, animation: "notification-pulse 2s ease-in-out infinite" }} />
                    <span className="text-xs" style={{ color: "rgba(255,255,255,.42)" }}>Online now</span>
                  </div>
                </div>
                <div className="ml-auto flex items-center gap-1.5">
                  {[...Array(3)].map((_, j) => <div key={j} className="w-1.5 h-1.5 rounded-full" style={{ background: "rgba(255,255,255,.3)" }} />)}
                </div>
              </div>

              {/* Messages */}
              <div className="space-y-2.5 mb-4">
                {CHAT.map((m, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.3 }}
                    transition={{ delay: 0.55 + i * 0.16 }}
                    className={`flex ${m.own ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className="max-w-xs px-3.5 py-2 rounded-2xl text-xs leading-relaxed"
                      style={{
                        background: m.own ? GOLD : "rgba(255,255,255,.11)",
                        color: m.own ? OLIVE : "rgba(255,255,255,.85)",
                        animation: `chat-bounce-${(i % 2) + 1} ${3.5 + i * 0.8}s ease-in-out infinite`,
                      }}
                    >
                      {m.txt}
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Input */}
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl" style={{ background: "rgba(255,255,255,.07)", border: "1px solid rgba(255,255,255,.12)" }}>
                <span className="text-xs flex-1" style={{ color: "rgba(255,255,255,.32)" }}>Type a message...</span>
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: GOLD }}>
                  <Send size={12} color={OLIVE} />
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
