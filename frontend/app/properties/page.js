// ───────────────────────────────────────────────────────────────────────────
// Browse / search page  (URL: "/properties")
// Reads filters from the URL (?city=...&property_type=...) and asks the backend
// for matching listings. SERVER component → SEO-friendly and fast.
//
// NOTE (Next.js 16): `searchParams` is a Promise and must be awaited.
// ───────────────────────────────────────────────────────────────────────────

import Navbar from "@/components/public/Navbar";
import Footer from "@/components/public/Footer";
import PropertyCard from "@/components/public/PropertyCard";
import { apiGet } from "@/lib/api";

export const metadata = {
  title: "Browse rooms & rentals",
  description: "Search verified rooms, PGs, and apartments by city, type, and budget.",
};

export default async function PropertiesPage({ searchParams }) {
  const params = await searchParams; // Next 16: await the search params
  const city = params?.city || "";
  const type = params?.property_type || "";

  // Re-build the query string we forward to the backend.
  const qs = new URLSearchParams();
  if (city) qs.set("city", city);
  if (type) qs.set("property_type", type);
  qs.set("limit", "50");

  let properties = [];
  let error = null;
  try {
    const data = await apiGet(`/properties?${qs.toString()}`);
    properties = data?.properties || [];
  } catch (e) {
    error = e.message;
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-cream">
        <div className="mx-auto max-w-[1440px] px-4 py-10 sm:px-6 lg:px-10">
        <h1 className="text-3xl font-bold text-ink">
          {city ? `Rentals in ${city}` : "All listings"}
        </h1>
        <p className="mt-2 text-ink/60">
          {properties.length} {properties.length === 1 ? "place" : "places"} found
          {type ? ` · ${type}` : ""}
        </p>

        {error ? (
          <p className="mt-10 rounded-xl border border-red-200 bg-red-50 p-6 text-red-700">
            Couldn’t load listings: {error}. Is the backend running on port 4000?
          </p>
        ) : properties.length === 0 ? (
          <p className="mt-10 rounded-xl border border-dashed border-ink/20 p-10 text-center text-ink/50">
            No listings match your search. Try a different city or type.
          </p>
        ) : (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {properties.map((p) => (
              <PropertyCard key={p.id} property={p} />
            ))}
          </div>
        )}
        </div>
      </main>
      <Footer />
    </>
  );
}
