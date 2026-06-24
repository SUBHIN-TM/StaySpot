// "Fresh on StayMate" — the latest real listings from the database (passed in
// from the server-rendered landing page). Restyled for the sunset palette; each
// card reveals on scroll with a stagger. PropertyCard itself is unchanged.

import Link from "next/link";
import PropertyCard from "./PropertyCard";
import Reveal from "./Reveal";

export default function FeaturedListings({ properties = [] }) {
  return (
    <section className="bg-cream py-24">
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-10">
        <Reveal className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="text-sm font-semibold uppercase tracking-wider text-coral">
              Fresh on StayMate
            </span>
            <h2 className="mt-1 text-3xl font-black text-ink sm:text-4xl">
              Newest places to call home
            </h2>
          </div>
          <Link
            href="/properties"
            className="rounded-xl border border-ink/15 bg-white px-5 py-2.5 text-sm font-semibold text-ink transition hover:border-grape/40 hover:text-grape"
          >
            View all listings →
          </Link>
        </Reveal>

        {properties.length === 0 ? (
          <Reveal className="mt-12">
            <p className="rounded-2xl border border-dashed border-ink/20 bg-white p-12 text-center text-ink/50">
              No listings to show yet. Start the backend and seed it
              (<code className="rounded bg-cream px-1.5 py-0.5">npm run db:seed</code> in the
              backend folder) to see live properties here.
            </p>
          </Reveal>
        ) : (
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {properties.map((p, i) => (
              <Reveal key={p.id} delay={(i % 3) * 100}>
                <PropertyCard property={p} />
              </Reveal>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
