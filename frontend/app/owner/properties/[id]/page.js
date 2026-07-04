"use client";

// Owner-facing property detail  (URL: "/owner/properties/<id>")
// A full, read-only view of the owner's own listing with its status, plus quick
// actions (edit, delete, request a field visit). Premium layout matching the
// public detail page, but with owner context instead of "contact owner".

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, MapPin, ShieldCheck, Users, Home, BadgeCheck, Map as MapIcon,
  Info, Pencil, Trash2, Zap, Clock,
} from "lucide-react";
import OwnerShell from "@/components/owner/OwnerShell";
import ImageCarousel from "@/components/public/ImageCarousel";
import { useToasts, ToastViewport, ConfirmDialog } from "@/components/owner/feedback";
import { apiGet, apiPost, apiDelete } from "@/lib/api";
import { getUserToken } from "@/lib/userAuth";
import {
  AMENITY_LABEL, AMENITY_ICON, AMENITY_FALLBACK_ICON,
  FURNISHING_LABEL, PETS_LABEL, ELECTRICITY_LABEL, PREFERRED_TENANT_LABEL, FOOD_LABEL,
  PROPERTY_TYPE_LABEL,
} from "@/lib/listingMeta";

const OCCUPANCY = {
  available: { label: "Available", dot: "#16a34a" },
  partially_occupied: { label: "Partially occupied", dot: "#d97706" },
  occupied: { label: "Occupied", dot: "#dc2626" },
};
const APPROVAL = {
  pending: { label: "Pending approval", cls: "bg-amber-100 text-amber-700" },
  approved: { label: "Approved · live", cls: "bg-green-100 text-green-700" },
  rejected: { label: "Rejected", cls: "bg-red-100 text-red-700" },
};

function Section({ title, icon: Icon, children }) {
  return (
    <section className="rounded-2xl border border-line bg-white p-6 shadow-sm sm:p-7">
      <h2 className="flex items-center gap-2 text-lg font-bold text-ink">
        {Icon && <Icon size={18} className="text-brand" />} {title}
      </h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}
function Fact({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-line bg-white px-4 py-3">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand/10 text-brand">
        <Icon size={17} />
      </span>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-ink/45">{label}</p>
        <p className="truncate text-sm font-semibold capitalize text-ink">{value}</p>
      </div>
    </div>
  );
}

export default function OwnerPropertyDetail() {
  const { id } = useParams();
  const router = useRouter();
  const { toasts, notify, dismiss } = useToasts();

  const [p, setProperty] = useState(null);
  const [error, setError] = useState("");
  const [confirmDel, setConfirmDel] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const data = await apiGet(`/properties/${id}`, getUserToken());
        setProperty(data.property);
      } catch (e) {
        setError(e.message || "Couldn’t load this property");
      }
    })();
  }, [id]);

  async function doDelete() {
    setDeleting(true);
    try {
      await apiDelete(`/properties/${id}`, getUserToken());
      notify("Listing deleted.", "success");
      router.push("/owner");
    } catch (e) {
      setConfirmDel(false);
      notify(e.message || "Couldn’t delete the listing", "error");
    } finally {
      setDeleting(false);
    }
  }

  async function requestVisit() {
    setRequesting(true);
    try {
      await apiPost(`/properties/${id}/request-visit`, {}, getUserToken());
      setProperty((x) => ({ ...x, visit_requested: true }));
      notify("Request sent — our team will visit to verify soon.", "success");
    } catch (e) {
      notify(e.message || "Couldn’t send the request", "error");
    } finally {
      setRequesting(false);
    }
  }

  return (
    <OwnerShell active="dashboard">
      <Link href="/owner" className="inline-flex items-center gap-1.5 text-sm font-medium text-ink/60 transition-colors hover:text-brand">
        <ArrowLeft size={15} /> My properties
      </Link>

      {error ? (
        <p className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">{error}</p>
      ) : !p ? (
        <p className="mt-8 text-ink/50">Loading…</p>
      ) : (
        <Detail
          p={p}
          onDelete={() => setConfirmDel(true)}
          onRequestVisit={requestVisit}
          requesting={requesting}
        />
      )}

      <ConfirmDialog
        open={confirmDel}
        title="Delete this property?"
        message={p ? `“${p.title}” will be removed from your listings and the public site. This can’t be undone.` : ""}
        confirmLabel="Delete"
        busy={deleting}
        onConfirm={doDelete}
        onCancel={() => setConfirmDel(false)}
      />
      <ToastViewport toasts={toasts} onDismiss={dismiss} />
    </OwnerShell>
  );
}

function Detail({ p, onDelete, onRequestVisit, requesting }) {
  const imageUrls = (p.images || []).map((img) => img.image_url).filter(Boolean);
  const occ = OCCUPANCY[p.occupancy_status] || OCCUPANCY.available;
  const approval = APPROVAL[p.approval_status] || APPROVAL.pending;
  const rent = `₹${Number(p.rent_amount).toLocaleString("en-IN")}`;
  const typeLabel = PROPERTY_TYPE_LABEL[p.property_type] || p.property_type;
  const location = [p.address, p.landmark, p.city, p.district, p.state].filter(Boolean).join(", ") || "—";

  const amenities = (p.amenities || []).map((a) => ({
    key: a, Icon: AMENITY_ICON[a] || AMENITY_FALLBACK_ICON, label: AMENITY_LABEL[a] || a,
  }));
  const policies = [
    p.furnishing && { label: "Furnishing", value: FURNISHING_LABEL[p.furnishing] },
    p.preferred_tenant && { label: "Preferred tenant", value: PREFERRED_TENANT_LABEL[p.preferred_tenant] },
    p.electricity_billing && { label: "Electricity", value: ELECTRICITY_LABEL[p.electricity_billing] },
    p.pets_allowed && { label: "Pets", value: PETS_LABEL[p.pets_allowed] },
    p.food_included && { label: "Food", value: FOOD_LABEL[p.food_included] },
  ].filter(Boolean);

  return (
    <div className="mt-4">
      {/* Gallery */}
      <div className="relative overflow-hidden rounded-3xl border border-line shadow-sm">
        <ImageCarousel images={imageUrls} alt={p.title} heightClass="h-72 sm:h-[26rem]" />
        <div className="pointer-events-none absolute left-4 top-4 flex flex-wrap items-center gap-2">
          <span className="rounded-full px-3 py-1 text-xs font-bold text-white" style={{ background: "rgba(30,37,33,.72)" }}>{typeLabel}</span>
          <span className="rounded-full px-3 py-1 text-xs font-bold text-white" style={{ background: occ.dot }}>{occ.label}</span>
          {p.field_visited && (
            <span className="inline-flex items-center gap-1 rounded-full bg-white/95 px-3 py-1 text-xs font-bold text-[#2E8B57] shadow">
              <ShieldCheck size={13} /> Verified by our team
            </span>
          )}
        </div>
      </div>

      {p.video_url && (
        <video src={p.video_url} controls className="mt-4 w-full rounded-2xl border border-line bg-black" style={{ maxHeight: "26rem" }} />
      )}

      <div className="mt-7">
        <h1 className="text-2xl font-bold leading-tight text-ink sm:text-3xl">{p.title}</h1>
        <p className="mt-2 flex items-start gap-1.5 text-ink/60">
          <MapPin size={16} className="mt-0.5 shrink-0 text-gold" />
          <span>{location}{p.pincode ? ` · ${p.pincode}` : ""}</span>
        </p>
      </div>

      <div className="mt-7 grid items-start gap-7 lg:grid-cols-[1fr_360px]">
        {/* Main */}
        <div className="space-y-6">
          <div className="grid gap-3 sm:grid-cols-3">
            <Fact icon={Home} label="Type" value={typeLabel} />
            <Fact icon={Users} label="Capacity" value={`${p.max_persons || 1} ${p.max_persons === 1 ? "person" : "persons"}`} />
            <Fact icon={BadgeCheck} label="Status" value={occ.label} />
          </div>

          {p.description && (
            <Section title="About this place" icon={Info}>
              <p className="whitespace-pre-line leading-relaxed text-ink/70">{p.description}</p>
            </Section>
          )}

          {amenities.length > 0 && (
            <Section title="Amenities" icon={BadgeCheck}>
              <div className="grid gap-2.5 sm:grid-cols-2">
                {amenities.map(({ key, Icon, label }) => (
                  <div key={key} className="flex items-center gap-3 rounded-xl bg-mist/60 px-3.5 py-2.5">
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-brand/10 text-brand">
                      <Icon size={16} strokeWidth={2} />
                    </span>
                    <span className="text-sm font-medium text-ink/80">{label}</span>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {policies.length > 0 && (
            <Section title="Good to know" icon={Info}>
              <dl className="grid gap-x-8 sm:grid-cols-2">
                {policies.map((row) => (
                  <div key={row.label} className="flex items-center justify-between border-b border-line py-2.5">
                    <dt className="text-sm text-ink/55">{row.label}</dt>
                    <dd className="text-sm font-semibold text-ink">{row.value}</dd>
                  </div>
                ))}
              </dl>
            </Section>
          )}

          {p.map_link && (
            <Section title="Location" icon={MapPin}>
              <a href={p.map_link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-brand/40 px-4 py-2.5 text-sm font-semibold text-brand transition-colors hover:bg-brand/5">
                <MapIcon size={16} /> Open in Google Maps
              </a>
            </Section>
          )}
        </div>

        {/* Sidebar: owner status + actions */}
        <aside className="lg:sticky lg:top-24 space-y-4">
          <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-sm">
            <div className="border-b border-line p-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink/45">Monthly rent</p>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="text-3xl font-bold text-brand">{rent}</span>
                <span className="text-sm font-medium text-ink/50">/ month</span>
              </div>
            </div>

            <div className="space-y-3 p-6">
              {/* Approval status */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-ink/55">Listing status</span>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${approval.cls}`}>{approval.label}</span>
              </div>

              {/* Field-visit / verification */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-ink/55">Verification</span>
                {p.field_visited ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-700">
                    <ShieldCheck size={12} /> Verified
                  </span>
                ) : p.visit_requested ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
                    <Clock size={12} /> Visit requested
                  </span>
                ) : (
                  <span className="rounded-full bg-mist px-2.5 py-0.5 text-xs font-semibold text-ink/50">Not verified</span>
                )}
              </div>

              {!p.field_visited && !p.visit_requested && (
                <button
                  type="button"
                  onClick={onRequestVisit}
                  disabled={requesting}
                  className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-gold py-2.5 text-sm font-bold text-white shadow-sm transition hover:brightness-105 disabled:opacity-60"
                >
                  <Zap size={15} className="fill-white" /> {requesting ? "Sending…" : "Request field visit"}
                </button>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Link
              href={`/owner/properties/${p.id}/edit`}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-brand py-2.5 font-semibold text-white shadow-sm transition-colors hover:bg-brand-dark"
            >
              <Pencil size={16} /> Edit
            </Link>
            <button
              type="button"
              onClick={onDelete}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 font-semibold text-red-600 transition-colors hover:bg-red-100"
            >
              <Trash2 size={16} /> Delete
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
