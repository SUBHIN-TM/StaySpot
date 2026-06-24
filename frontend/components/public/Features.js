// "Everything in one place" — a bento grid of features that actually exist in
// StayMate today. Mixed cell sizes for a non-uniform, modern look. Reveals on
// scroll. (No fake claims — these all map to real backend/frontend features.)

import Reveal from "./Reveal";

export default function Features() {
  return (
    <section className="bg-cream py-24">
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-10">
        <Reveal className="text-center">
          <span className="text-sm font-semibold uppercase tracking-wider text-coral">
            Why StayMate
          </span>
          <h2 className="mt-1 text-3xl font-black text-ink sm:text-4xl">
            Everything you need, in one place
          </h2>
        </Reveal>

        <div className="mt-14 grid auto-rows-[200px] grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {/* Big feature card (spans 2 cols + 2 rows on desktop) */}
          <Reveal className="sm:col-span-2 lg:row-span-2">
            <div className="flex h-full flex-col justify-between overflow-hidden rounded-3xl bg-gradient-to-br from-grape via-coral to-sun p-8 text-white shadow-xl shadow-coral/20">
              <div>
                <div className="text-3xl">💬</div>
                <h3 className="mt-4 text-2xl font-black">Talk directly — no middlemen</h3>
                <p className="mt-2 max-w-md text-white/85">
                  Built-in chat connects seekers with owners, roommates with roommates,
                  and anyone with support. Real-time-ready, with a notification bell and
                  unread badges across the whole app.
                </p>
              </div>
              <div className="flex flex-wrap gap-2 text-sm">
                {["Seeker ↔ Owner", "Roommate ↔ Roommate", "Support", "Notifications"].map((t) => (
                  <span key={t} className="rounded-full bg-white/15 px-3 py-1 backdrop-blur">{t}</span>
                ))}
              </div>
            </div>
          </Reveal>

          {[
            { icon: "🛡️", title: "Admin-checked listings", text: "New listings are reviewed and approved before they go public." },
            { icon: "🔐", title: "Verified sign-up", text: "Google or email with a real one-time code (OTP) — no fake accounts." },
            { icon: "🖼️", title: "Photos, video & map", text: "Each listing shows a gallery, a video tour and a map location." },
            { icon: "🗺️", title: "Map & radius search", text: "Find places near your work, college or area within a distance you choose." },
            { icon: "❤️", title: "Save favourites", text: "Shortlist places you like and come back to compare them later." },
          ].map((f, i) => (
            <Reveal key={f.title} delay={i * 80}>
              <div className="flex h-full flex-col justify-center rounded-3xl border border-ink/10 bg-white p-6 transition hover:-translate-y-1 hover:border-coral/40 hover:shadow-xl hover:shadow-grape/10">
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-cream text-xl">
                  {f.icon}
                </div>
                <h3 className="mt-3 font-bold text-ink">{f.title}</h3>
                <p className="mt-1 text-sm text-ink/60">{f.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
