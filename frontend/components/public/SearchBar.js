"use client";

// The search box shown in the hero. On submit it sends the user to
// /properties with the chosen filters as URL query params, e.g.
//   /properties?city=Bengaluru&property_type=pg
// The backend's GET /api/properties already understands these params.

import { useRouter } from "next/navigation";
import { useState } from "react";
import { districtsOf, DEFAULT_STATE } from "@/lib/geo";
import { startNavProgress } from "@/lib/navProgress";

// Property types come straight from the backend schema's allowed values.
const TYPES = [
  { value: "", label: "Any type" },
  { value: "room", label: "Room" },
  { value: "apartment", label: "Apartment" },
  { value: "house", label: "House" },
  { value: "villa", label: "Villa" },
  { value: "pg", label: "PG" },
  { value: "hostel", label: "Hostel" },
  { value: "shared", label: "Shared" },
];

export default function SearchBar() {
  const router = useRouter();
  const [district, setDistrict] = useState("");
  const [locality, setLocality] = useState("");
  const [type, setType] = useState("");

  function handleSearch(e) {
    e.preventDefault();
    // Build the query string, skipping empty fields.
    const params = new URLSearchParams();
    if (district) params.set("district", district);
    if (locality.trim()) params.set("city", locality.trim());
    if (type) params.set("property_type", type);
    startNavProgress(); // show the top loading bar right away
    router.push(`/properties?${params.toString()}`);
  }

  return (
    <form
      onSubmit={handleSearch}
      className="flex flex-col gap-3 rounded-2xl bg-white p-3 shadow-lg sm:flex-row sm:items-center"
    >
      <select
        value={district}
        onChange={(e) => setDistrict(e.target.value)}
        className="rounded-xl border border-slate-200 px-4 py-3 text-slate-900 outline-none focus:border-brand"
      >
        <option value="">Any district</option>
        {districtsOf(DEFAULT_STATE).map((d) => (
          <option key={d} value={d}>{d}</option>
        ))}
      </select>
      <input
        type="text"
        value={locality}
        onChange={(e) => setLocality(e.target.value)}
        placeholder="Area / locality (e.g. Kakkanad)"
        className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-slate-900 outline-none focus:border-brand"
      />
      <select
        value={type}
        onChange={(e) => setType(e.target.value)}
        className="rounded-xl border border-slate-200 px-4 py-3 text-slate-900 outline-none focus:border-brand"
      >
        {TYPES.map((t) => (
          <option key={t.value} value={t.value}>
            {t.label}
          </option>
        ))}
      </select>
      <button
        type="submit"
        className="rounded-xl bg-brand px-6 py-3 font-semibold text-white hover:bg-brand-dark"
      >
        Search
      </button>
    </form>
  );
}
