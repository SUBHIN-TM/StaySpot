"use client";

// Shared form for creating AND editing a roommate post.
// Pass `existing` = the post to edit, or null to create.

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Home, Search } from "lucide-react";
import { apiPost, apiPatch } from "@/lib/api";
import { getUserToken } from "@/lib/userAuth";
import { PROPERTY_TYPES } from "@/lib/listingMeta";

// The two clarifiers viewers care about most.
const POST_TYPES = [
  { value: "have_place", label: "I have a place", sub: "Looking for a roommate to join", Icon: Home },
  { value: "seeking", label: "Looking for a place", sub: "Want to find & share a place", Icon: Search },
];
const ROOM_TYPES = [
  { value: "private", label: "Private room" },
  { value: "shared", label: "Shared room" },
  { value: "entire", label: "Entire place to share" },
];
// Place type reuses the ONE shared property-type list (lib/listingMeta).
const PLACE_TYPES = PROPERTY_TYPES;

export default function RoommatePostForm({ existing }) {
  const router = useRouter();
  const isEdit = !!existing;

  const [form, setForm] = useState({
    title: existing?.title || "",
    post_type: existing?.post_type || "",
    room_type: existing?.room_type || "",
    place_type: existing?.place_type || "",
    budget: existing?.budget ?? "",
    persons: existing?.persons ?? "",         // min
    persons_max: existing?.persons_max ?? "", // max (optional)
    preferred_location: existing?.preferred_location || "",
    // a DATE comes back like "2026-07-01T..."; the date input needs YYYY-MM-DD
    move_in_date: existing?.move_in_date ? String(existing.move_in_date).slice(0, 10) : "",
    description: existing?.description || "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showErrors, setShowErrors] = useState(false);

  const hasPlace = form.post_type === "have_place";
  const titleErr = showErrors && !form.title.trim();
  const typeErr = showErrors && !form.post_type;
  const personsErr = showErrors && hasPlace && (!form.persons || Number(form.persons) < 1);
  const maxErr = showErrors && form.persons_max && Number(form.persons_max) < Number(form.persons);

  // Budget is per person → total = budget × people. With a min–max, show a range.
  const perc = Number(form.budget) || 0;
  const pMin = Number(form.persons) || 0;
  const pMax = Number(form.persons_max) || pMin;
  const totalMin = perc && pMin ? perc * pMin : null;
  const totalMax = perc && pMax ? perc * pMax : null;
  const fmt = (n) => `₹${Number(n).toLocaleString("en-IN")}`;

  function set(k, v) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function submit(e) {
    e.preventDefault();
    setError("");
    setShowErrors(true);
    if (!form.title.trim() || !form.post_type || (hasPlace && (!form.persons || Number(form.persons) < 1))) {
      return setError("Please fill the highlighted required fields.");
    }
    if (form.persons_max && Number(form.persons_max) < Number(form.persons)) {
      return setError("Maximum people must be greater than or equal to the minimum.");
    }

    const payload = {
      title: form.title.trim(),
      post_type: form.post_type,
      room_type: form.room_type || null,
      place_type: form.place_type || null,
      budget: form.budget === "" ? null : Number(form.budget),
      persons: form.persons === "" ? null : Number(form.persons),
      persons_max: form.persons_max === "" ? null : Number(form.persons_max),
      preferred_location: form.preferred_location,
      move_in_date: form.move_in_date || null,
      description: form.description,
    };

    setLoading(true);
    try {
      if (isEdit) {
        await apiPatch(`/roommate-posts/${existing.id}`, payload, getUserToken());
      } else {
        await apiPost("/roommate-posts", payload, getUserToken());
      }
      router.push("/roommates");
    } catch (err) {
      setError(err.message || "Couldn’t save your post");
      setLoading(false);
    }
  }

  const field =
    "mt-1 w-full rounded-lg border border-ink/15 bg-white px-3 py-2 text-ink outline-none transition-colors focus:border-brand";
  const label = "block text-sm font-medium text-ink/80";

  return (
    <form onSubmit={submit} className="space-y-5">
      {/* Post type — the most important clarifier. */}
      <div>
        <label className={label}>What are you posting? *</label>
        <div className="mt-1.5 grid gap-2.5 sm:grid-cols-2">
          {POST_TYPES.map((o) => {
            const on = form.post_type === o.value;
            return (
              <button
                type="button"
                key={o.value}
                onClick={() => set("post_type", o.value)}
                className={`flex items-start gap-3 rounded-xl border p-3.5 text-left transition ${
                  on
                    ? "border-brand bg-brand/5 ring-1 ring-brand"
                    : typeErr
                    ? "border-red-400"
                    : "border-ink/15 hover:border-ink/30"
                }`}
              >
                <span className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg ${on ? "bg-brand text-white" : "bg-ink/5 text-ink/60"}`}>
                  <o.Icon size={16} />
                </span>
                <span>
                  <span className="block text-sm font-semibold text-ink">{o.label}</span>
                  <span className="block text-xs text-ink/55">{o.sub}</span>
                </span>
              </button>
            );
          })}
        </div>
        {typeErr && <p className="mt-1 text-xs text-red-600">Please pick one.</p>}
      </div>

      {/* Title */}
      <div>
        <label className={label}>Title *</label>
        <input
          value={form.title}
          onChange={(e) => set("title", e.target.value)}
          placeholder="e.g. Roommate wanted for 2BHK in Kakkanad"
          className={`${field} ${titleErr ? "border-red-400" : ""}`}
        />
        {titleErr && <p className="mt-1 text-xs text-red-600">Title is required.</p>}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Budget (always per person) */}
        <div>
          <label className={label}>Budget — ₹ / month per person</label>
          <input
            type="number" min={0} value={form.budget}
            onChange={(e) => set("budget", e.target.value.replace(/[^0-9.]/g, ""))}
            placeholder="7000"
            className={field}
          />
          {totalMin ? (
            <p className="mt-1 text-xs text-ink/55">
              Total ≈{" "}
              <span className="font-semibold text-ink">
                {totalMax && totalMax !== totalMin ? `${fmt(totalMin)}–${fmt(totalMax)}` : fmt(totalMin)}
              </span>
              /mo.
            </p>
          ) : (
            <p className="mt-1 text-xs text-ink/45">Each person&apos;s share of the monthly rent.</p>
          )}
        </div>

        {/* People sharing (min–max) — required only for "I have a place". */}
        {hasPlace && (
          <div>
            <label className={label}>How many people will share? *</label>
            <div className="mt-1 flex items-center gap-2">
              <input
                type="number" min={1} value={form.persons}
                onChange={(e) => set("persons", e.target.value.replace(/[^0-9]/g, ""))}
                placeholder="Min"
                className={`w-full rounded-lg border bg-white px-3 py-2 text-ink outline-none focus:border-brand ${personsErr ? "border-red-400" : "border-ink/15"}`}
              />
              <span className="text-ink/40">–</span>
              <input
                type="number" min={1} value={form.persons_max}
                onChange={(e) => set("persons_max", e.target.value.replace(/[^0-9]/g, ""))}
                placeholder="Max"
                className={`w-full rounded-lg border bg-white px-3 py-2 text-ink outline-none focus:border-brand ${maxErr ? "border-red-400" : "border-ink/15"}`}
              />
            </div>
            {personsErr ? (
              <p className="mt-1 text-xs text-red-600">Enter at least the minimum.</p>
            ) : maxErr ? (
              <p className="mt-1 text-xs text-red-600">Max must be ≥ min.</p>
            ) : (
              <p className="mt-1 text-xs text-ink/45">Min required; max optional (leave blank for exact).</p>
            )}
          </div>
        )}

      </div>

      {/* Place type + room arrangement — both optional ("Any"). */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={label}>Place type</label>
          <select value={form.place_type} onChange={(e) => set("place_type", e.target.value)} className={`${field} app-select`}>
            <option value="">Any</option>
            {PLACE_TYPES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
          <p className="mt-1 text-xs text-ink/45">What kind of property it is.</p>
        </div>
        <div>
          <label className={label}>Room arrangement</label>
          <select value={form.room_type} onChange={(e) => set("room_type", e.target.value)} className={`${field} app-select`}>
            <option value="">Any / not specified</option>
            {ROOM_TYPES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
          <p className="mt-1 text-xs text-ink/45">What the person gets in the place.</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={label}>Preferred location</label>
          <input value={form.preferred_location} onChange={(e) => set("preferred_location", e.target.value)} placeholder="e.g. Kakkanad, Kochi" className={field} />
        </div>
        <div>
          <label className={label}>{hasPlace ? "Available from" : "Preferred move-in date"}</label>
          <input type="date" value={form.move_in_date} onChange={(e) => set("move_in_date", e.target.value)} className={field} />
          <p className="mt-1 text-xs text-ink/45">
            {hasPlace ? "When the room/spot is free to move into." : "When you'd like to move in."}
          </p>
        </div>
      </div>

      <div>
        <label className={label}>Details</label>
        <textarea
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
          rows={4}
          placeholder="About you, the kind of roommate you'd like, the place, house rules…"
          className={field}
        />
      </div>

      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-brand px-6 py-2.5 font-semibold text-white hover:bg-brand-dark disabled:opacity-60"
        >
          {loading ? "Saving…" : isEdit ? "Save changes" : "Post requirement"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/roommates")}
          className="rounded-lg border border-ink/15 px-6 py-2.5 font-medium text-ink/70 hover:bg-ink/5"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
