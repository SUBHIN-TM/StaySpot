// "Featured listings" section. The landing page fetches the properties on the
// server and passes them in as a prop, so this component is purely presentation.

import Link from "next/link";
import PropertyCard from "./PropertyCard";

export default function FeaturedListings({ properties = [] }) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Featured listings</h2>
          <p className="mt-2 text-slate-600">Hand-picked rooms and rentals available now.</p>
        </div>
        <Link href="/properties" className="hidden text-sm font-semibold text-brand hover:underline sm:block">
          View all →
        </Link>
      </div>

      {properties.length === 0 ? (
        // Friendly message if the backend returned nothing (or is offline).
        <p className="mt-10 rounded-xl border border-dashed border-slate-300 p-10 text-center text-slate-500">
          No listings to show yet. Make sure the backend is running and seeded
          (<code>npm run db:seed</code> in the backend folder).
        </p>
      ) : (
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {properties.map((p) => (
            <PropertyCard key={p.id} property={p} />
          ))}
        </div>
      )}

      <div className="mt-10 text-center sm:hidden">
        <Link href="/properties" className="font-semibold text-brand hover:underline">
          View all listings →
        </Link>
      </div>
    </section>
  );
}
