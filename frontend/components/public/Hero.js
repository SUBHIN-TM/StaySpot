// Hero section at the top of the landing page: big headline + search box.

import SearchBar from "./SearchBar";

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-blue-50 to-white">
      <div className="mx-auto max-w-5xl px-4 py-20 text-center sm:px-6 sm:py-28">
        <span className="inline-block rounded-full bg-blue-100 px-4 py-1 text-sm font-medium text-brand">
          🏠 1,200+ verified rooms & rentals
        </span>

        <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-6xl">
          Find your next stay, roommate, or
          <span className="text-brand"> rental space</span> in minutes
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-600">
          Browse verified rooms, PGs and apartments across the city. Chat directly
          with owners, save your favourites, and move in faster — all in one place.
        </p>

        {/* Search box */}
        <div className="mx-auto mt-10 max-w-3xl">
          <SearchBar />
        </div>

        {/* Quick stats */}
        <dl className="mx-auto mt-12 grid max-w-2xl grid-cols-3 gap-6">
          {[
            { value: "1,200+", label: "Listings" },
            { value: "850+", label: "Happy seekers" },
            { value: "300+", label: "Verified owners" },
          ].map((s) => (
            <div key={s.label}>
              <dt className="text-2xl font-bold text-slate-900 sm:text-3xl">{s.value}</dt>
              <dd className="text-sm text-slate-500">{s.label}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
