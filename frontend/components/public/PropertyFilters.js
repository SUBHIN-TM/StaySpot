"use client";

// Search + filter shell for the /properties browse page.
//
// It WRAPS the server-rendered results grid (passed as `children`) so the search
// box, sort, sidebar filters and the removable "active filter" chips can all
// share one piece of client state — while the cards themselves stay server
// rendered (SEO + speed). Every change just rewrites the URL query; the server
// page re-reads it and re-fetches. `initial` seeds the controls from the URL.

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { districtsOf, DEFAULT_STATE } from "@/lib/geo";
import { AMENITIES, AMENITY_ICON, AMENITY_FALLBACK_ICON, FURNISHING } from "@/lib/listingMeta";

// Rental types (mirrors the owner form / SearchBar list).
const TYPES = [
  { value: "room", label: "Room" },
  { value: "apartment", label: "Apartment" },
  { value: "house", label: "House" },
  { value: "villa", label: "Villa" },
  { value: "pg", label: "PG" },
  { value: "hostel", label: "Hostel" },
  { value: "shared", label: "Shared" },
];
const OCCUPANCY = [
  { value: "available", label: "Available" },
  { value: "partially_occupied", label: "Partially occupied" },
  { value: "occupied", label: "Occupied" },
];
const SORTS = [
  { value: "", label: "Newest first" },
  { value: "price_low", label: "Price: low → high" },
  { value: "price_high", label: "Price: high → low" },
];

const DISTRICTS = districtsOf(DEFAULT_STATE);

export default function PropertyFilters({ initial = {}, resultCount = 0, children }) {
  const router = useRouter();

  const [q, setQ] = useState(initial.q || "");
  const [district, setDistrict] = useState(initial.district || "");
  const [type, setType] = useState(initial.property_type || "");
  const [minRent, setMinRent] = useState(initial.min_rent || "");
  const [maxRent, setMaxRent] = useState(initial.max_rent || "");
  const [occupancy, setOccupancy] = useState(initial.occupancy_status || "");
  const [furnishing, setFurnishing] = useState(initial.furnishing || "");
  const [amenities, setAmenities] = useState(initial.amenities || []);
  const [sort, setSort] = useState(initial.sort || "");
  const [open, setOpen] = useState(false); // mobile drawer

  // Build the URL query from a full snapshot of the filter state and navigate.
  function go(state) {
    const p = new URLSearchParams();
    if (state.q) p.set("q", state.q.trim());
    if (state.district) p.set("district", state.district);
    if (state.type) p.set("property_type", state.type);
    if (state.minRent) p.set("min_rent", state.minRent);
    if (state.maxRent) p.set("max_rent", state.maxRent);
    if (state.occupancy) p.set("occupancy_status", state.occupancy);
    if (state.furnishing) p.set("furnishing", state.furnishing);
    if (state.amenities?.length) p.set("amenities", state.amenities.join(","));
    if (state.sort) p.set("sort", state.sort);
    const qs = p.toString();
    router.push(qs ? `/properties?${qs}` : "/properties", { scroll: false });
  }

  // Apply the current state plus any immediate override (used by the dropdowns
  // and amenity chips so they don't wait for a setState to flush).
  function apply(overrides = {}) {
    go({ q, district, type, minRent, maxRent, occupancy, furnishing, amenities, sort, ...overrides });
  }

  function toggleAmenity(value) {
    const next = amenities.includes(value)
      ? amenities.filter((a) => a !== value)
      : [...amenities, value];
    setAmenities(next);
    apply({ amenities: next });
  }

  function clearAll() {
    setQ(""); setDistrict(""); setType(""); setMinRent(""); setMaxRent("");
    setOccupancy(""); setFurnishing(""); setAmenities([]); setSort("");
    router.push("/properties", { scroll: false });
  }

  // Active-filter chips (label + how to clear that one).
  const typeLabel = TYPES.find((t) => t.value === type)?.label;
  const occLabel = OCCUPANCY.find((o) => o.value === occupancy)?.label;
  const furnLabel = FURNISHING.find((f) => f.value === furnishing)?.label;
  const chips = [
    q && { label: `“${q}”`, clear: () => { setQ(""); apply({ q: "" }); } },
    district && { label: district, clear: () => { setDistrict(""); apply({ district: "" }); } },
    type && { label: typeLabel, clear: () => { setType(""); apply({ type: "" }); } },
    occupancy && { label: occLabel, clear: () => { setOccupancy(""); apply({ occupancy: "" }); } },
    furnishing && { label: furnLabel, clear: () => { setFurnishing(""); apply({ furnishing: "" }); } },
    (minRent || maxRent) && {
      label: `₹${minRent || "0"} – ${maxRent || "∞"}`,
      clear: () => { setMinRent(""); setMaxRent(""); apply({ minRent: "", maxRent: "" }); },
    },
    ...amenities.map((a) => ({
      label: AMENITIES.find((x) => x.value === a)?.label || a,
      clear: () => toggleAmenity(a),
    })),
  ].filter(Boolean);
  const activeCount = chips.length;

  // ── shared styles ──
  const input =
    "w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus:border-sage";
  const groupLabel = "mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink/50";

  const Panel = (
    // Single column — the filter tile is one card wide, so everything stacks.
    <div className="space-y-5">
      {/* District */}
      <div>
        <label className={groupLabel}>District</label>
        <select className={input} value={district} onChange={(e) => { setDistrict(e.target.value); apply({ district: e.target.value }); }}>
          <option value="">Any district</option>
          {DISTRICTS.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>

      {/* Type */}
      <div>
        <label className={groupLabel}>Rental type</label>
        <select className={input} value={type} onChange={(e) => { setType(e.target.value); apply({ type: e.target.value }); }}>
          <option value="">Any type</option>
          {TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
      </div>

      {/* Availability */}
      <div>
        <label className={groupLabel}>Availability</label>
        <select className={input} value={occupancy} onChange={(e) => { setOccupancy(e.target.value); apply({ occupancy: e.target.value }); }}>
          <option value="">Any</option>
          {OCCUPANCY.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      {/* Furnishing */}
      <div>
        <label className={groupLabel}>Furnishing</label>
        <select className={input} value={furnishing} onChange={(e) => { setFurnishing(e.target.value); apply({ furnishing: e.target.value }); }}>
          <option value="">Any</option>
          {FURNISHING.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
        </select>
      </div>

      {/* Rent range */}
      <div>
        <label className={groupLabel}>Monthly rent (₹)</label>
        <div className="flex items-center gap-2">
          <input
            type="number" min={0} inputMode="numeric" placeholder="Min"
            className={input} value={minRent}
            onChange={(e) => setMinRent(e.target.value.replace(/[^0-9]/g, ""))}
            onBlur={() => apply()}
            onKeyDown={(e) => e.key === "Enter" && apply()}
          />
          <span className="text-ink/40">–</span>
          <input
            type="number" min={0} inputMode="numeric" placeholder="Max"
            className={input} value={maxRent}
            onChange={(e) => setMaxRent(e.target.value.replace(/[^0-9]/g, ""))}
            onBlur={() => apply()}
            onKeyDown={(e) => e.key === "Enter" && apply()}
          />
        </div>
      </div>

      {/* Amenities */}
      <div>
        <label className={groupLabel}>Amenities</label>
        <div className="flex flex-wrap gap-2">
          {AMENITIES.map((a) => {
            const on = amenities.includes(a.value);
            const Icon = AMENITY_ICON[a.value] || AMENITY_FALLBACK_ICON;
            return (
              <button
                type="button"
                key={a.value}
                onClick={() => toggleAmenity(a.value)}
                className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium transition ${
                  on ? "border-sage bg-sage text-white" : "border-line bg-white text-ink/70 hover:border-sage/50"
                }`}
              >
                <Icon size={12} strokeWidth={2} />
                {a.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );

  return (
    <div>
      {/* ── Top bar: search + sort (+ mobile filters button) ── */}
      <div className="flex flex-wrap items-center gap-3">
        <form
          onSubmit={(e) => { e.preventDefault(); apply(); }}
          className="flex min-w-[220px] flex-1 items-center gap-2 rounded-xl border border-line bg-white px-3 py-2"
        >
          <Search size={18} className="text-ink/40" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by title, area, address…"
            className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-ink/40"
          />
          {q && (
            <button type="button" onClick={() => { setQ(""); apply({ q: "" }); }} aria-label="Clear search">
              <X size={16} className="text-ink/40 hover:text-ink" />
            </button>
          )}
        </form>

        <select
          className="rounded-xl border border-line bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-sage"
          value={sort}
          onChange={(e) => { setSort(e.target.value); apply({ sort: e.target.value }); }}
        >
          {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>

        {/* Mobile: open the filter drawer */}
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="inline-flex items-center gap-2 rounded-xl border border-line bg-white px-4 py-2.5 text-sm font-medium text-ink lg:hidden"
        >
          <SlidersHorizontal size={16} />
          Filters{activeCount ? ` (${activeCount})` : ""}
        </button>
      </div>

      {/* ── Active filter chips ── */}
      {activeCount > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {chips.map((c, idx) => (
            <span key={idx} className="inline-flex items-center gap-1 rounded-full bg-mist px-3 py-1 text-xs font-medium text-ink/70">
              {c.label}
              <button type="button" onClick={c.clear} aria-label={`Remove ${c.label}`}>
                <X size={13} className="text-ink/40 hover:text-ink" />
              </button>
            </span>
          ))}
          <button type="button" onClick={clearAll} className="text-xs font-semibold text-sage hover:underline">
            Clear all
          </button>
        </div>
      )}

      {/* ── Mobile filter drawer (below the search bar; lg uses the in-grid tile) ── */}
      {open && (
        <aside className="mt-4 lg:hidden">
          <div className="rounded-2xl border border-line bg-white p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-bold text-ink">Filters</h2>
              {activeCount > 0 && (
                <button type="button" onClick={clearAll} className="text-xs font-semibold text-sage hover:underline">
                  Reset
                </button>
              )}
            </div>
            {Panel}
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="mt-5 w-full rounded-xl bg-sage py-2.5 text-sm font-semibold text-white"
            >
              Show {resultCount} {resultCount === 1 ? "result" : "results"}
            </button>
          </div>
        </aside>
      )}

      {/* ── Results grid. On large screens the filter panel is the FIRST tile:
           one card wide and two cards tall (lg:row-span-2). On full (xl) screens
           the grid is 4 columns, so 3 cards sit beside the filter across the
           first two rows; once the filter ends the grid returns to full rows of
           four. Grid auto-placement keeps every card aligned. ── */}
      <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <aside className="hidden rounded-2xl border border-line bg-white p-5 lg:row-span-2 lg:flex lg:flex-col">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-bold text-ink">Filters</h2>
            {activeCount > 0 && (
              <button type="button" onClick={clearAll} className="text-xs font-semibold text-sage hover:underline">
                Reset
              </button>
            )}
          </div>
          {Panel}
        </aside>

        {/* Results (server-rendered cards / empty / error state) */}
        {children}
      </div>
    </div>
  );
}
