"use client";

// Shared form for creating AND editing a roommate post.
// Pass `existing` = the post to edit, or null to create.

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiPost, apiPatch } from "@/lib/api";
import { getUserToken } from "@/lib/userAuth";

export default function RoommatePostForm({ existing }) {
  const router = useRouter();
  const isEdit = !!existing;

  const [form, setForm] = useState({
    title: existing?.title || "",
    description: existing?.description || "",
    budget: existing?.budget ?? "",
    preferred_location: existing?.preferred_location || "",
    // a DATE comes back like "2026-07-01T..."; the date input needs YYYY-MM-DD
    move_in_date: existing?.move_in_date ? String(existing.move_in_date).slice(0, 10) : "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function set(k, v) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function submit(e) {
    e.preventDefault();
    setError("");
    if (!form.title.trim()) return setError("Please add a title.");

    const payload = {
      title: form.title.trim(),
      description: form.description,
      budget: form.budget === "" ? null : Number(form.budget),
      preferred_location: form.preferred_location,
      move_in_date: form.move_in_date || null,
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
    "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-brand";
  const label = "block text-sm font-medium text-slate-700";

  return (
    <form onSubmit={submit} className="space-y-4">
      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <div>
        <label className={label}>Title *</label>
        <input
          value={form.title}
          onChange={(e) => set("title", e.target.value)}
          placeholder="e.g. Looking for a flatmate in Koramangala"
          className={field}
        />
      </div>
      <div>
        <label className={label}>Details</label>
        <textarea
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
          rows={4}
          placeholder="About you, the kind of roommate you want, the place…"
          className={field}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={label}>Budget (₹ / month)</label>
          {/* Digits/decimal only — no negative budgets. */}
          <input type="number" min={0} value={form.budget} onChange={(e) => set("budget", e.target.value.replace(/[^0-9.]/g, ""))} placeholder="8000" className={field} />
        </div>
        <div>
          <label className={label}>Preferred location</label>
          <input value={form.preferred_location} onChange={(e) => set("preferred_location", e.target.value)} placeholder="Koramangala, Bengaluru" className={field} />
        </div>
      </div>
      <div>
        <label className={label}>Move-in date</label>
        <input type="date" value={form.move_in_date} onChange={(e) => set("move_in_date", e.target.value)} className={field} />
      </div>

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
          className="rounded-lg border border-slate-300 px-6 py-2.5 font-medium text-slate-600 hover:bg-slate-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
