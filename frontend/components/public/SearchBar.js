"use client";

// The search box shown in the hero. On submit it sends the user to
// /properties with the chosen filters as URL query params, e.g.
//   /properties?city=Bengaluru&property_type=pg
// The backend's GET /api/properties already understands these params.

import { useRouter } from "next/navigation";
import { useState } from "react";

// Property types come straight from the backend schema's allowed values.
const TYPES = [
  { value: "", label: "Any type" },
  { value: "room", label: "Room" },
  { value: "apartment", label: "Apartment" },
  { value: "house", label: "House" },
  { value: "pg", label: "PG" },
  { value: "hostel", label: "Hostel" },
  { value: "shared", label: "Shared" },
];

export default function SearchBar() {
  const router = useRouter();
  const [city, setCity] = useState("");
  const [type, setType] = useState("");

  function handleSearch(e) {
    e.preventDefault();
    // Build the query string, skipping empty fields.
    const params = new URLSearchParams();
    if (city.trim()) params.set("city", city.trim());
    if (type) params.set("property_type", type);
    router.push(`/properties?${params.toString()}`);
  }

  return (
    <form
      onSubmit={handleSearch}
      className="flex flex-col gap-3 rounded-2xl bg-white p-3 shadow-lg sm:flex-row sm:items-center"
    >
      <input
        type="text"
        value={city}
        onChange={(e) => setCity(e.target.value)}
        placeholder="Search by city (e.g. Bengaluru)"
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
