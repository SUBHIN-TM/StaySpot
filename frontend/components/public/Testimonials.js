// Social-proof section with a few testimonial cards.

export default function Testimonials() {
  const reviews = [
    {
      name: "Aarav Mehta",
      role: "Student, Bengaluru",
      text: "Found a PG near my college in two days. Chatting with the owner directly made it so easy.",
    },
    {
      name: "Priya Nair",
      role: "Working professional",
      text: "I loved the roommate matching. Met my flatmate through StayMate and we get along great!",
    },
    {
      name: "Rahul Verma",
      role: "Property owner",
      text: "Listing my apartment took five minutes and I had genuine enquiries the same week.",
    },
  ];

  return (
    <section className="bg-slate-50 py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-slate-900">Loved by seekers and owners</h2>
          <p className="mx-auto mt-2 max-w-xl text-slate-600">
            Real people finding real homes with StayMate.
          </p>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {reviews.map((r) => (
            <figure key={r.name} className="rounded-2xl bg-white p-8 shadow-sm">
              <div className="text-yellow-400">★★★★★</div>
              <blockquote className="mt-4 text-slate-700">“{r.text}”</blockquote>
              <figcaption className="mt-6 flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-full bg-brand font-bold text-white">
                  {r.name.charAt(0)}
                </span>
                <div>
                  <div className="font-semibold text-slate-900">{r.name}</div>
                  <div className="text-sm text-slate-500">{r.role}</div>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
