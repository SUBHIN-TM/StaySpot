"use client";

// Search + filter shell for the roommate posts. Filtering is done client-side
// (the list is capped at 50) over the posts passed in from the server page.

import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import RoommatePostCard from "./RoommatePostCard";

export default function RoommateFilters({ posts }) {
  const [q, setQ] = useState("");
  const [loc, setLoc] = useState("");
  const [minB, setMinB] = useState("");
  const [maxB, setMaxB] = useState("");
  const [statusF, setStatusF] = useState(""); // "" = all, "active", "closed"
  const [sort, setSort] = useState("new");

  // Distinct locations for the dropdown, sorted.
  const locations = useMemo(() => {
    const set = new Set();
    posts.forEach((p) => p.preferred_location && set.add(p.preferred_location));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [posts]);

  const view = useMemo(() => {
    const query = q.trim().toLowerCase();
    const list = posts.filter((p) => {
      if (
        query &&
        ![p.title, p.description, p.preferred_location, p.user?.name].some((v) =>
          (v || "").toLowerCase().includes(query)
        )
      )
        return false;
      if (loc && p.preferred_location !== loc) return false;
      const isActive = p.is_active !== false;
      if (statusF === "active" && !isActive) return false;
      if (statusF === "closed" && isActive) return false;
      const b = p.budget != null ? Number(p.budget) : null;
      if (minB && (b == null || b < Number(minB))) return false;
      if (maxB && (b == null || b > Number(maxB))) return false;
      return true;
    });
    const t = (d) => (d ? new Date(d).getTime() : 0);
    const cmp = {
      new: (a, b) => t(b.created_at) - t(a.created_at),
      budget_low: (a, b) => (Number(a.budget) || Infinity) - (Number(b.budget) || Infinity),
      budget_high: (a, b) => (Number(b.budget) || 0) - (Number(a.budget) || 0),
    }[sort];
    return cmp ? [...list].sort(cmp) : list;
  }, [posts, q, loc, minB, maxB, statusF, sort]);

  const activeCount = (q ? 1 : 0) + (loc ? 1 : 0) + (minB ? 1 : 0) + (maxB ? 1 : 0) + (statusF ? 1 : 0);
  function clearAll() {
    setQ("");
    setLoc("");
    setMinB("");
    setMaxB("");
    setStatusF("");
  }

  const chip =
    "rounded-xl border border-ink/12 bg-white px-3 py-2.5 text-sm text-ink outline-none transition-colors focus:border-grape";

  return (
    <div>
      {/* Filter bar */}
      <div className="mt-8 rounded-2xl border border-ink/10 bg-white/80 p-3.5 shadow-sm backdrop-blur">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search */}
          <div className="flex min-w-[220px] flex-1 items-center gap-2 rounded-xl border border-ink/12 bg-white px-3 py-2">
            <Search size={17} className="text-ink/40" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search name, title, area…"
              className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-ink/40"
            />
            {q && (
              <button type="button" onClick={() => setQ("")} aria-label="Clear search">
                <X size={15} className="text-ink/40 hover:text-ink" />
              </button>
            )}
          </div>

          {/* Location */}
          <select className={`${chip} app-select`} value={loc} onChange={(e) => setLoc(e.target.value)} aria-label="Location">
            <option value="">All locations</option>
            {locations.map((l) => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>

          {/* Status */}
          <select className={`${chip} app-select`} value={statusF} onChange={(e) => setStatusF(e.target.value)} aria-label="Status">
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="closed">Closed</option>
          </select>

          {/* Budget range */}
          <div className="flex items-center gap-1.5">
            <input
              type="number" min={0} inputMode="numeric" placeholder="Min ₹"
              value={minB} onChange={(e) => setMinB(e.target.value.replace(/[^0-9]/g, ""))}
              className={`${chip} w-24`}
            />
            <span className="text-ink/40">–</span>
            <input
              type="number" min={0} inputMode="numeric" placeholder="Max ₹"
              value={maxB} onChange={(e) => setMaxB(e.target.value.replace(/[^0-9]/g, ""))}
              className={`${chip} w-24`}
            />
          </div>

          {/* Sort */}
          <select className={`${chip} app-select`} value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort">
            <option value="new">Newest first</option>
            <option value="budget_low">Budget: low → high</option>
            <option value="budget_high">Budget: high → low</option>
          </select>

          {activeCount > 0 && (
            <button
              type="button"
              onClick={clearAll}
              className="inline-flex items-center gap-1 rounded-xl border border-ink/12 bg-white px-3 py-2.5 text-sm font-medium text-ink/60 hover:text-coral"
            >
              <X size={15} /> Clear
            </button>
          )}
        </div>
      </div>

      {/* Count */}
      <p className="mt-4 text-sm text-ink/50">
        Showing <span className="font-semibold text-ink/70">{view.length}</span> of {posts.length}
      </p>

      {/* Results */}
      {view.length === 0 ? (
        <div className="mt-3 rounded-3xl border border-dashed border-ink/20 bg-white/60 p-14 text-center">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-coral/10">
            <Search size={22} className="text-coral" />
          </div>
          <p className="mt-3 font-semibold text-ink">No requirements match your filters</p>
          <button type="button" onClick={clearAll} className="mt-1 text-sm font-semibold text-coral hover:underline">
            Clear filters
          </button>
        </div>
      ) : (
        <div className="mt-3 grid gap-6 md:grid-cols-2">
          {view.map((post) => (
            <RoommatePostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}
