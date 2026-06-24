// Landing hero. Warm "sunset" palette with drifting colour blobs, a gradient
// headline, and a wide horizontal row of live-stat cards (with icons) that count
// up from the database. No search box here — search lives on the Explore page.

import Link from "next/link";
import CountUp from "./CountUp";

export default function Hero({ stats = {} }) {
  const { listings = 0, seekers = 0, owners = 0 } = stats;

  const chips = ["No login to browse", "Email-verified accounts", "Chat owners directly"];

  // Live numbers shown as a wide horizontal strip of cards, each with its own
  // icon, gradient accent and gentle float.
  const statCards = [
    { value: listings, label: "Live listings", hint: "rooms, PGs & rentals", icon: "🏠", accent: "from-sun to-coral", spin: "floaty" },
    { value: seekers, label: "Happy seekers", hint: "found their place", icon: "😊", accent: "from-coral to-grape", spin: "floaty-slow" },
    { value: owners, label: "Trusted owners", hint: "listing with us", icon: "🤝", accent: "from-grape to-sun", spin: "floaty" },
  ];

  return (
    <section className="relative overflow-hidden bg-cream">
      {/* Drifting colour blobs */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="blob absolute -left-24 -top-24 h-80 w-80 rounded-full bg-sun/30 blur-3xl" />
        <div
          className="blob absolute -right-16 top-8 h-96 w-96 rounded-full bg-coral/30 blur-3xl"
          style={{ animationDelay: "-5s" }}
        />
        <div
          className="blob absolute -bottom-24 left-1/3 h-80 w-80 rounded-full bg-grape/20 blur-3xl"
          style={{ animationDelay: "-9s" }}
        />
      </div>

      <div className="relative mx-auto max-w-[1440px] px-4 pb-24 pt-16 sm:px-6 sm:pt-24 lg:px-10">
        {/* Centered copy */}
        <div className="mx-auto max-w-3xl text-center">
          <span
            className="rise inline-flex items-center gap-2 rounded-full border border-coral/30 bg-white/70 px-4 py-1.5 text-sm font-medium text-ink backdrop-blur"
            style={{ animationDelay: "0ms" }}
          >
            <span className="h-2 w-2 animate-pulse rounded-full bg-coral" />
            India&apos;s friendly stay &amp; roommate finder
          </span>

          <h1
            className="rise mt-6 text-4xl font-black leading-[1.05] tracking-tight text-ink sm:text-6xl"
            style={{ animationDelay: "80ms" }}
          >
            Find your next{" "}
            <span className="bg-gradient-to-r from-sun via-coral to-grape bg-clip-text text-transparent">
              stay, roommate
            </span>{" "}
            &amp; rental space
          </h1>

          <p
            className="rise mx-auto mt-6 max-w-2xl text-lg text-ink/70"
            style={{ animationDelay: "160ms" }}
          >
            Browse rooms, PGs, apartments and rentals across India — every listing
            admin-checked. Chat owners directly, find compatible roommates, and move
            in faster. All in one place.
          </p>

          {/* Actions */}
          <div
            className="rise mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row"
            style={{ animationDelay: "240ms" }}
          >
            <Link
              href="/properties"
              className="group inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-sun via-coral to-grape bg-[length:200%_200%] px-7 py-3.5 font-semibold text-white shadow-lg shadow-coral/30 transition hover:bg-[position:100%] hover:shadow-xl hover:shadow-coral/40"
            >
              Explore listings
              <span className="transition group-hover:translate-x-1">→</span>
            </Link>
            <Link
              href="/roommates"
              className="inline-flex items-center gap-2 rounded-2xl border border-ink/15 bg-white/80 px-7 py-3.5 font-semibold text-ink backdrop-blur transition hover:border-ink/30 hover:bg-white"
            >
              Find a roommate
            </Link>
          </div>

          {/* Trust chips */}
          <ul
            className="rise mt-8 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-ink/60"
            style={{ animationDelay: "320ms" }}
          >
            {chips.map((c) => (
              <li key={c} className="flex items-center gap-1.5">
                <span className="text-coral">✓</span> {c}
              </li>
            ))}
          </ul>
        </div>

        {/* Wide horizontal stat strip — spacious, with icons */}
        <div
          className="rise mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
          style={{ animationDelay: "200ms" }}
        >
          {statCards.map((s, idx) => (
            <div
              key={s.label}
              className={`${s.spin} flex items-center gap-5 rounded-3xl border border-white/70 bg-white/90 p-6 shadow-xl shadow-grape/10 backdrop-blur`}
              style={{ animationDelay: `${idx * -2}s` }}
            >
              <div className={`grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-gradient-to-br ${s.accent} text-3xl shadow-md`}>
                {s.icon}
              </div>
              <div className="min-w-0">
                <div className="text-4xl font-black leading-none text-ink">
                  <CountUp value={s.value} />
                </div>
                <div className="mt-1.5 font-semibold text-ink">{s.label}</div>
                <div className="text-sm text-ink/50">{s.hint}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom fade into the next (white) section */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent to-white" />
    </section>
  );
}
