// ───────────────────────────────────────────────────────────────────────────
// Browse / search page  (URL: "/properties")
// Reads filters from the URL and asks the backend for matching listings.
// SERVER component → SEO-friendly and fast. The interactive search/filter shell
// (PropertyFilters) is a client component that wraps these server-rendered cards.
//
// NOTE (Next.js 16): `searchParams` is a Promise and must be awaited.
// ───────────────────────────────────────────────────────────────────────────

import Navbar from "@/components/public/Navbar";
import Footer from "@/components/public/Footer";
import PropertyCard from "@/components/public/PropertyCard";
import PropertyFilters from "@/components/public/PropertyFilters";
import { apiGet } from "@/lib/api";

export const metadata = {
  title: "Browse rooms & rentals",
  description: "Search verified rooms, PGs, apartments and villas by district, type, budget and amenities.",
};

export default async function PropertiesPage({ searchParams }) {
  const params = await searchParams; // Next 16: await the search params

  // Pull every supported filter out of the URL.
  const q = params?.q || "";
  const district = params?.district || "";
  const city = params?.city || "";
  const property_type = params?.property_type || "";
  const min_rent = params?.min_rent || "";
  const max_rent = params?.max_rent || "";
  const occupancy_status = params?.occupancy_status || "";
  const furnishing = params?.furnishing || "";
  const amenitiesCsv = params?.amenities || "";
  const sort = params?.sort || "";

  // Forward them all to the backend.
  const qs = new URLSearchParams();
  if (q) qs.set("q", q);
  if (district) qs.set("district", district);
  if (city) qs.set("city", city);
  if (property_type) qs.set("property_type", property_type);
  if (min_rent) qs.set("min_rent", min_rent);
  if (max_rent) qs.set("max_rent", max_rent);
  if (occupancy_status) qs.set("occupancy_status", occupancy_status);
  if (furnishing) qs.set("furnishing", furnishing);
  if (amenitiesCsv) qs.set("amenities", amenitiesCsv);
  if (sort) qs.set("sort", sort);
  qs.set("limit", "50");

  let properties = [];
  let error = null;
  try {
    const data = await apiGet(`/properties?${qs.toString()}`);
    properties = data?.properties || [];
  } catch (e) {
    error = e.message;
  }

  const heading = district ? `Stays in ${district}` : "Browse all stays";

  // Values that seed the filter controls.
  const initial = {
    q, district, property_type, min_rent, max_rent, occupancy_status, furnishing, sort,
    amenities: amenitiesCsv ? amenitiesCsv.split(",").filter(Boolean) : [],
  };

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-cream">
        <div className="mx-auto max-w-[1440px] px-4 py-10 sm:px-6 lg:px-10">
          <h1 className="text-3xl font-bold text-ink">{heading}</h1>
          <p className="mt-1.5 text-ink/60">
            {properties.length} {properties.length === 1 ? "place" : "places"} found
          </p>

          <div className="mt-6">
            <PropertyFilters initial={initial} resultCount={properties.length}>
              {error ? (
                <p className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700">
                  Couldn’t load listings: {error}. Is the backend running on port 4000?
                </p>
              ) : properties.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-ink/20 bg-white p-12 text-center">
                  <p className="text-lg font-semibold text-ink">No stays match these filters</p>
                  <p className="mt-1 text-ink/50">Try widening your budget, clearing amenities, or a different district.</p>
                </div>
              ) : (
                <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                  {properties.map((p) => (
                    <PropertyCard key={p.id} property={p} />
                  ))}
                </div>
              )}
            </PropertyFilters>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
