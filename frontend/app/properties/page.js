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
import Pagination from "@/components/public/Pagination";
import { apiGet } from "@/lib/api";

const DEFAULT_LIMIT = 10; // listings per page
const ALLOWED_LIMITS = [10, 20, 30, 50]; // selectable page sizes

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
  const page = Math.max(1, parseInt(params?.page || "1", 10) || 1);
  const limitParam = parseInt(params?.limit || "", 10);
  const limit = ALLOWED_LIMITS.includes(limitParam) ? limitParam : DEFAULT_LIMIT;

  // Build the shared filter query (everything EXCEPT page) once, so we can reuse
  // it for both the API call and the pagination links.
  const filterQs = new URLSearchParams();
  if (q) filterQs.set("q", q);
  if (district) filterQs.set("district", district);
  if (city) filterQs.set("city", city);
  if (property_type) filterQs.set("property_type", property_type);
  if (min_rent) filterQs.set("min_rent", min_rent);
  if (max_rent) filterQs.set("max_rent", max_rent);
  if (occupancy_status) filterQs.set("occupancy_status", occupancy_status);
  if (furnishing) filterQs.set("furnishing", furnishing);
  if (amenitiesCsv) filterQs.set("amenities", amenitiesCsv);
  if (sort) filterQs.set("sort", sort);
  if (limit !== DEFAULT_LIMIT) filterQs.set("limit", String(limit)); // keep page size across paging
  const baseQuery = filterQs.toString(); // filters + limit, for <Pagination> links

  // The API call adds the page on top of the shared filters (limit already in).
  const qs = new URLSearchParams(filterQs);
  qs.set("limit", String(limit));
  qs.set("page", String(page));

  let properties = [];
  let total = 0;
  let totalPages = 1;
  let error = null;
  try {
    const data = await apiGet(`/properties?${qs.toString()}`);
    properties = data?.properties || [];
    total = data?.total ?? properties.length;
    totalPages = data?.total_pages ?? 1;
  } catch (e) {
    error = e.message;
  }

  const heading = district ? `Stays in ${district}` : "Browse all stays";

  // Values that seed the filter controls.
  const initial = {
    q, district, property_type, min_rent, max_rent, occupancy_status, furnishing, sort, limit,
    amenities: amenitiesCsv ? amenitiesCsv.split(",").filter(Boolean) : [],
  };

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-cream">
        <div className="mx-auto max-w-[1760px] px-4 py-10 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-baseline gap-x-3">
            <h1 className="text-3xl font-bold text-ink">{heading}</h1>
            <p className="text-ink/60">
              {total} {total === 1 ? "place" : "places"} found
            </p>
          </div>

          <div className="mt-6">
            {/* The results grid lives INSIDE PropertyFilters (the filter panel is
                the first tile). So here we pass the cards directly; the empty /
                error states get a column span so they sit beside the filter tile. */}
            <PropertyFilters initial={initial} resultCount={total}>
              {error ? (
                <p className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700 lg:col-span-2 xl:col-span-4">
                  Couldn’t load listings: {error}. Is the backend running on port 4000?
                </p>
              ) : properties.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-ink/20 bg-white p-12 text-center lg:col-span-2 xl:col-span-4">
                  <p className="text-lg font-semibold text-ink">No stays match these filters</p>
                  <p className="mt-1 text-ink/50">Try widening your budget, clearing amenities, or a different district.</p>
                </div>
              ) : (
                properties.map((p) => <PropertyCard key={p.id} property={p} />)
              )}
            </PropertyFilters>

            {/* Pagination (only shows when there's more than one page) */}
            {!error && (
              <Pagination page={page} totalPages={totalPages} baseQuery={baseQuery} />
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
