// "On the way" — a peek at genuinely-planned features (from the project
// roadmap). Clearly badged "Coming soon" so it never reads as already-built.

import Reveal from "./Reveal";

export default function Roadmap() {
  const items = [
    {
      icon: "🤝",
      title: "AI roommate matching",
      text: "Share a lifestyle profile and get a compatibility score — with a Claude-generated note on why you'd get along.",
    },
    {
      icon: "✅",
      title: "Trust & scam shield",
      text: "Verified-property badges plus AI scam detection that flags suspicious new listings before you ever see them.",
    },
    {
      icon: "🧾",
      title: "Rent & expense split",
      text: "After you move in: split rent and bills, and keep a shared chores board with your flat group.",
    },
  ];

  return (
    <section className="relative overflow-hidden bg-ink py-24 text-white">
      {/* subtle glow */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="blob absolute -left-20 top-10 h-72 w-72 rounded-full bg-grape/40 blur-3xl" />
        <div className="blob absolute -right-10 bottom-0 h-72 w-72 rounded-full bg-coral/30 blur-3xl" style={{ animationDelay: "-6s" }} />
      </div>

      <div className="relative mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-10">
        <Reveal className="text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-sm font-medium backdrop-blur">
            <span className="h-2 w-2 animate-pulse rounded-full bg-sun" /> On the way
          </span>
          <h2 className="mt-4 text-3xl font-black sm:text-4xl">We&apos;re just getting started</h2>
          <p className="mx-auto mt-3 max-w-xl text-white/60">
            A look at what&apos;s coming next to make finding a home — and a flatmate —
            even smarter.
          </p>
        </Reveal>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {items.map((it, i) => (
            <Reveal key={it.title} delay={i * 120}>
              <div className="h-full rounded-3xl border border-white/10 bg-white/5 p-7 backdrop-blur transition hover:border-white/25 hover:bg-white/10">
                <div className="flex items-center justify-between">
                  <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-sun via-coral to-grape text-xl">
                    {it.icon}
                  </div>
                  <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/70">
                    Coming soon
                  </span>
                </div>
                <h3 className="mt-5 text-lg font-bold">{it.title}</h3>
                <p className="mt-2 text-sm text-white/60">{it.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
