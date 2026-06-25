"use client";

// Popup showing a property's full details (images, video, map, all fields)
// with admin actions: approve / reject / delete.

import { useState } from "react";
import ImageCarousel from "@/components/public/ImageCarousel";
import { apiPatch, apiDelete } from "@/lib/api";
import { getToken } from "@/lib/auth";

const STATUS = {
  pending: "bg-amber-100 text-amber-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
};

export default function PropertyDetailModal({ property, onClose, onChanged }) {
  const [busy, setBusy] = useState(false);
  const p = property;
  const imageUrls = (p.images || []).map((img) => img.image_url).filter(Boolean);

  async function setApproval(status) {
    setBusy(true);
    try {
      await apiPatch(`/properties/${p.id}/approval`, { approval_status: status }, getToken());
      onChanged({ ...p, approval_status: status });
      onClose(); // close the modal once the action succeeds
    } catch (e) {
      alert(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!confirm(`Delete "${p.title}"? This can't be undone.`)) return;
    setBusy(true);
    try {
      await apiDelete(`/properties/${p.id}`, getToken());
      onChanged(null); // null = removed
    } catch (e) {
      alert(e.message);
      setBusy(false);
    }
  }

  const Detail = ({ label, value }) => (
    <div>
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd className="text-sm font-medium text-slate-900">{value || "—"}</dd>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-10 max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
          <div className="flex items-center gap-2">
            <h2 className="font-semibold text-slate-900">{p.title}</h2>
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS[p.approval_status] || STATUS.pending}`}>
              {p.approval_status}
            </span>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100" aria-label="Close">
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 5l10 10M15 5L5 15" strokeLinecap="round" /></svg>
          </button>
        </div>

        {/* Images */}
        <ImageCarousel images={imageUrls} alt={p.title} heightClass="h-64" />

        {/* Video */}
        {p.video_url && (
          <video src={p.video_url} controls className="w-full bg-black" style={{ maxHeight: "16rem" }} />
        )}

        {/* Details */}
        <div className="p-5">
          <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <Detail label="Rent" value={`₹${Number(p.rent_amount).toLocaleString("en-IN")}/mo`} />
            <Detail label="Type" value={p.property_type} />
            <Detail label="Max persons" value={p.max_persons} />
            <Detail label="Occupancy" value={(p.occupancy_status || "").replace("_", " ")} />
            <Detail label="City" value={p.city} />
            <Detail label="District" value={p.district} />
            <Detail label="Owner" value={p.owner?.name} />
            <Detail label="Owner email" value={p.owner?.email} />
            <Detail label="Available" value={p.is_available ? "Yes" : "No"} />
          </dl>

          {p.address && <p className="mt-4 text-sm text-slate-600">📍 {p.address}</p>}
          {p.description && <p className="mt-2 text-sm text-slate-600">{p.description}</p>}
          {p.map_link && (
            <a href={p.map_link} target="_blank" rel="noreferrer" className="mt-3 inline-block text-sm font-medium text-brand hover:underline">
              🗺️ Open in Google Maps
            </a>
          )}

          {/* Actions */}
          <div className="mt-6 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
            {p.approval_status !== "approved" && (
              <button onClick={() => setApproval("approved")} disabled={busy} className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50">
                ✓ Approve
              </button>
            )}
            {p.approval_status !== "rejected" && (
              <button onClick={() => setApproval("rejected")} disabled={busy} className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-50">
                ✕ Reject
              </button>
            )}
            <button onClick={remove} disabled={busy} className="ml-auto rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50">
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
