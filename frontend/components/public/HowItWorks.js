// Simple 4-step "how it works" timeline. Reflects the real flow: browse without
// an account, sign up only to chat, talk to owners/roommates, move in.

import Reveal from "./Reveal";

export default function HowItWorks() {
  const steps = [
    { n: "01", title: "Search & filter", text: "Explore listings by city, type and budget — or find roommates. No account needed to browse." },
    { n: "02", title: "Sign up in seconds", text: "Create an account with Google or email — verified by a one-time code (OTP)." },
    { n: "03", title: "Chat directly", text: "Message owners or potential roommates in-app. Ask questions, share details, arrange a visit." },
    { n: "04", title: "Move in", text: "Pick the place that fits, agree the terms, and settle into your new home." },
  ];

  return (
    <section className="mx-auto max-w-[1440px] px-4 py-24 sm:px-6 lg:px-10">
      <Reveal className="text-center">
        <span className="text-sm font-semibold uppercase tracking-wider text-coral">
          How it works
        </span>
        <h2 className="mt-1 text-3xl font-black text-ink sm:text-4xl">
          From searching to settling in
        </h2>
      </Reveal>

      <div className="relative mt-16 grid gap-8 md:grid-cols-4">
        {/* connecting line behind the steps (desktop only) */}
        <div
          aria-hidden
          className="absolute left-0 right-0 top-7 hidden h-px bg-gradient-to-r from-sun/40 via-coral/40 to-grape/40 md:block"
        />
        {steps.map((s, i) => (
          <Reveal key={s.n} delay={i * 120}>
            <div className="relative">
              <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-sun via-coral to-grape text-lg font-black text-white shadow-lg shadow-coral/30">
                {s.n}
              </div>
              <h3 className="mt-5 text-lg font-bold text-ink">{s.title}</h3>
              <p className="mt-2 text-sm text-ink/60">{s.text}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
