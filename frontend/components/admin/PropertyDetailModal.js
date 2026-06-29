"use client";

// Popup showing a property's full details (images, video, map, all fields)
// with admin actions: approve / reject / delete.

import { useState } from "react";
import Link from "next/link";
import ImageCarousel from "@/components/public/ImageCarousel";
import { apiPatch, apiDelete } from "@/lib/api";
import { getToken } from "@/lib/auth";
import AdminFieldVisitModal from "./AdminFieldVisitModal";
import AuditHistoryModal from "./AuditHistoryModal";
import {
  AMENITY_LABEL,
  FURNISHING_LABEL,
  PETS_LABEL,
  ELECTRICITY_LABEL,
  PREFERRED_TENANT_LABEL,
  FOOD_LABEL,
} from "@/lib/listingMeta";

const STATUS = {
  pending: "bg-amber-100 text-amber-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
};

export default function PropertyDetailModal({ property, onClose, onChanged }) {
  const [busy, setBusy] = useState(false);
  const [showVisit, setShowVisit] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const p = property;
  const imageUrls = (p.images || []).map((img) => img.image_url).filter(Boolean);
  const ownerVerified = !!p.owner?.phone_verified;

  async function setApproval(status) {
    setBusy(true);
    try {
      const { property: updated } = await apiPatch(
        `/properties/${p.id}/approval`,
        { approval_status: status },
        getToken()
      );
      onChanged(updated);
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

  // Render one field-visit proof file by its type (image / video / audio / other).
  const Attachment = ({ url }) => {
    const ext = (url.split("?")[0].split(".").pop() || "").toLowerCase();
    if (["jpg", "jpeg", "png", "webp", "gif", "avif"].includes(ext)) {
      return (
        <a href={url} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-lg border border-slate-200">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt="Field-visit proof" className="h-24 w-full object-cover" />
        </a>
      );
    }
    if (["mp4", "webm", "mov", "mkv"].includes(ext)) {
      return <video src={url} controls className="h-24 w-full rounded-lg border border-slate-200 bg-black object-cover" />;
    }
    if (["mp3", "m4a", "aac", "ogg", "wav"].includes(ext)) {
      return <audio src={url} controls className="w-full" />;
    }
    return (
      <a href={url} target="_blank" rel="noreferrer" className="flex h-24 items-center justify-center rounded-lg border border-slate-200 text-sm font-medium text-brand hover:bg-slate-50">
        📄 Open file
      </a>
    );
  };

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
            <Detail label="Owner verified" value={ownerVerified ? "✓ Yes" : "No"} />
            <Detail label="Field visit" value={p.field_visited ? "📍 Visited" : "No"} />
            {!p.field_visited && p.visit_requested && <Detail label="Visit requested" value="⚡ Yes" />}
            <Detail label="Available" value={p.is_available ? "Yes" : "No"} />
            {p.furnishing && <Detail label="Furnishing" value={FURNISHING_LABEL[p.furnishing]} />}
            {p.preferred_tenant && <Detail label="Preferred tenant" value={PREFERRED_TENANT_LABEL[p.preferred_tenant]} />}
            {p.electricity_billing && <Detail label="Electricity" value={ELECTRICITY_LABEL[p.electricity_billing]} />}
            {p.pets_allowed && <Detail label="Pets" value={PETS_LABEL[p.pets_allowed]} />}
            {p.food_included && <Detail label="Food" value={FOOD_LABEL[p.food_included]} />}
          </dl>

          {Array.isArray(p.amenities) && p.amenities.length > 0 && (
            <div className="mt-4">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Amenities</p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {p.amenities.map((a) => (
                  <span key={a} className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                    {AMENITY_LABEL[a] || a}
                  </span>
                ))}
              </div>
            </div>
          )}
          {p.field_visited && (
            <div className="mt-6 border-t border-slate-100 pt-4">
              <h3 className="text-base font-bold tracking-tight text-slate-900">Field Visit Details</h3>
              <div className="mt-1.5 h-1 w-12 rounded-full bg-emerald-500" />
              {p.field_visit_remarks && (
                <p className="mt-2 text-sm text-slate-600">{p.field_visit_remarks}</p>
              )}
              {Array.isArray(p.field_visit_proof_urls) && p.field_visit_proof_urls.length > 0 ? (
                <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {p.field_visit_proof_urls.map((url, i) => (
                    <Attachment key={i} url={url} />
                  ))}
                </div>
              ) : (
                <p className="mt-2 text-xs text-slate-400">No attachments.</p>
              )}
            </div>
          )}

          {p.address && <p className="mt-4 text-sm text-slate-600">📍 {p.address}</p>}
          {p.description && <p className="mt-2 text-sm text-slate-600">{p.description}</p>}
          {p.map_link && (
            <a href={p.map_link} target="_blank" rel="noreferrer" className="mt-3 inline-block text-sm font-medium text-brand hover:underline">
              🗺️ Open in Google Maps
            </a>
          )}

          {/* Owner not verified → approval is blocked until they're verified. */}
          {!ownerVerified && (
            <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              ⚠️ This owner isn’t phone-verified yet, so the listing can’t be approved.{" "}
              <Link href="/admin/owners" className="font-semibold underline">
                Verify the owner first →
              </Link>
            </div>
          )}

          {/* Actions */}
          <div className="mt-6 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
            {/* Approve is gated on the owner being phone-verified. */}
            {ownerVerified && p.approval_status !== "approved" && (
              <button onClick={() => setApproval("approved")} disabled={busy} className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50">
                ✓ Approve
              </button>
            )}
            {p.approval_status !== "rejected" && (
              <button onClick={() => setApproval("rejected")} disabled={busy} className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-50">
                ✕ Reject
              </button>
            )}
            <button onClick={() => setShowVisit(true)} disabled={busy} className="rounded-lg border border-emerald-300 px-4 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-50 disabled:opacity-50">
              {p.field_visited ? "📍 Edit field visit" : "📍 Record field visit"}
            </button>
            <button onClick={() => setShowHistory(true)} disabled={busy} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50">
              🕑 Edit history{typeof p.edit_count === "number" ? ` (${p.edit_count})` : ""}
            </button>
            <button onClick={remove} disabled={busy} className="ml-auto rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50">
              Delete
            </button>
          </div>
        </div>
      </div>

      {showVisit && (
        <AdminFieldVisitModal
          property={p}
          onClose={() => setShowVisit(false)}
          onChanged={(updated) => onChanged(updated)}
        />
      )}

      {showHistory && (
        <AuditHistoryModal
          entityType="property"
          entityId={p.id}
          title={p.title}
          onClose={() => setShowHistory(false)}
        />
      )}
    </div>
  );
}
