// Live numbers band — big animated counters pulled from the database (passed in
// from the server-rendered landing page). Counts up when scrolled into view.

import CountUp from "./CountUp";
import Reveal from "./Reveal";

export default function StatsBand({ stats = {} }) {
  const { listings = 0, seekers = 0, owners = 0 } = stats;

  const items = [
    { value: listings, label: "Active listings" },
    { value: seekers, label: "Happy seekers" },
    { value: owners, label: "Trusted owners" },
  ];

  return (
    <section className="mx-auto max-w-[1440px] px-4 py-24 sm:px-6 lg:px-10">
      <Reveal>
        <div className="rounded-[2.5rem] border border-ink/10 bg-gradient-to-br from-white to-cream p-10 sm:p-14">
          <p className="text-center text-sm font-semibold uppercase tracking-wider text-coral">
            Real numbers, updated live
          </p>
          <div className="mt-10 grid gap-10 sm:grid-cols-3">
            {items.map((s, i) => (
              <div key={s.label} className="text-center">
                <div className="bg-gradient-to-r from-sun via-coral to-grape bg-clip-text text-5xl font-black text-transparent sm:text-6xl">
                  <CountUp value={s.value} />
                </div>
                <div className="mt-2 font-medium text-ink/60">{s.label}</div>
              </div>
            ))}
          </div>
          <p className="mt-8 text-center text-sm text-ink/40">…and growing every day.</p>
        </div>
      </Reveal>
    </section>
  );
}
