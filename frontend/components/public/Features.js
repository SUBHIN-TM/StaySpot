// "Why StayMate" features grid. Also holds the id="owners" anchor used by the
// navbar/footer "For owners" link, with a call-out for property owners.

import Link from "next/link";

export default function Features() {
  const features = [
    { icon: "✅", title: "Verified owners", text: "Every owner is checked so you can rent with confidence." },
    { icon: "⚡", title: "Real-time chat", text: "Message owners instantly and get quick answers." },
    { icon: "🧑‍🤝‍🧑", title: "Roommate matching", text: "Looking to share? Find compatible roommates nearby." },
    { icon: "🗺️", title: "Map & radius search", text: "Find places near your work, college or area." },
    { icon: "❤️", title: "Save favourites", text: "Shortlist places you like and compare them later." },
    { icon: "🔒", title: "Secure by design", text: "Your data stays private and protected." },
  ];

  return (
    <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-slate-900">Everything you need to find a home</h2>
        <p className="mx-auto mt-2 max-w-xl text-slate-600">
          StayMate brings listings, chat and roommates together in one simple app.
        </p>
      </div>

      <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((f) => (
          <div key={f.title} className="rounded-2xl border border-slate-200 p-6">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-blue-50 text-2xl">
              {f.icon}
            </div>
            <h3 className="mt-4 text-lg font-semibold text-slate-900">{f.title}</h3>
            <p className="mt-1 text-slate-600">{f.text}</p>
          </div>
        ))}
      </div>

      {/* Owner call-out (anchor target for "For owners") */}
      <div
        id="owners"
        className="mt-16 flex flex-col items-center justify-between gap-6 rounded-3xl bg-slate-900 p-10 text-center md:flex-row md:text-left"
      >
        <div>
          <h3 className="text-2xl font-bold text-white">Own a property? List it for free.</h3>
          <p className="mt-2 text-slate-300">
            Reach thousands of genuine seekers and manage your listings with ease.
          </p>
        </div>
        <Link
          href="/owner/signup"
          className="shrink-0 rounded-xl bg-white px-6 py-3 font-semibold text-slate-900 hover:bg-slate-100"
        >
          List your property
        </Link>
      </div>
    </section>
  );
}
