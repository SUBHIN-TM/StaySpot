// "Built for everyone under one roof" — the three real people StayMate serves
// (seekers, owners, roommates). Each card uses a different gradient accent and
// reveals on scroll with a small stagger.

import Link from "next/link";
import Reveal from "./Reveal";

export default function Audience() {
  const cards = [
    {
      emoji: "🔎",
      title: "Seekers",
      text: "Browse admin-checked rooms, PGs, apartments and rentals. Shortlist favourites and message owners directly — no sign-up needed just to look.",
      cta: "Start exploring",
      href: "/properties",
      accent: "from-sun to-coral",
      ring: "hover:border-sun/50",
    },
    {
      emoji: "🏠",
      title: "Owners",
      text: "List your property free with photos, a video tour and a map. Get genuine enquiries and manage everything from your owner dashboard.",
      cta: "List a property",
      href: "/owner/signup",
      accent: "from-coral to-grape",
      ring: "hover:border-coral/50",
    },
    {
      emoji: "🧑‍🤝‍🧑",
      title: "Roommates",
      text: "Not just a place — find the right person to share it with. Post what you're looking for and chat with potential flatmates nearby.",
      cta: "Find roommates",
      href: "/roommates",
      accent: "from-grape to-sun",
      ring: "hover:border-grape/50",
    },
  ];

  return (
    <section className="mx-auto max-w-[1440px] px-4 py-24 sm:px-6 lg:px-10">
      <Reveal className="text-center">
        <h2 className="text-3xl font-black text-ink sm:text-4xl">
          Built for everyone under one roof
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-ink/60">
          Whether you&apos;re searching, listing, or looking for the perfect flatmate —
          StayMate brings it all together.
        </p>
      </Reveal>

      <div className="mt-14 grid gap-6 md:grid-cols-3">
        {cards.map((c, i) => (
          <Reveal key={c.title} delay={i * 120}>
            <div
              className={`group h-full rounded-3xl border border-ink/10 bg-white p-8 transition duration-300 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-grape/10 ${c.ring}`}
            >
              <div
                className={`grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br ${c.accent} text-2xl shadow-lg`}
              >
                {c.emoji}
              </div>
              <h3 className="mt-5 text-xl font-bold text-ink">{c.title}</h3>
              <p className="mt-2 text-ink/60">{c.text}</p>
              <Link
                href={c.href}
                className="mt-5 inline-flex items-center gap-1 font-semibold text-grape transition group-hover:gap-2"
              >
                {c.cta} <span>→</span>
              </Link>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
