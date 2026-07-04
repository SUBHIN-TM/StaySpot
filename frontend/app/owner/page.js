"use client";

// Owner dashboard  (URL: "/owner")
// Lists all the owner's properties (available or not) with status + edit links.

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Pencil, Trash2, ShieldCheck, Clock, Zap, MapPin } from "lucide-react";
import OwnerShell from "@/components/owner/OwnerShell";
import OwnerVerifyBanner from "@/components/owner/OwnerVerifyBanner";
import { useToasts, ToastViewport, ConfirmDialog } from "@/components/owner/feedback";
import { apiGet, apiPost, apiDelete, imageUrl } from "@/lib/api";
import { getUserToken } from "@/lib/userAuth";

// Friendly label + colour for the occupancy status.
const STATUS = {
  available: { label: "Available", cls: "bg-green-100 text-green-700" },
  partially_occupied: { label: "Partially occupied", cls: "bg-amber-100 text-amber-700" },
  occupied: { label: "Occupied", cls: "bg-slate-200 text-slate-600" },
};

// Approval status (set by admin) — tells the owner if their listing is live.
const APPROVAL = {
  pending: { label: "Pending approval", cls: "bg-amber-100 text-amber-700" },
  approved: { label: "Approved", cls: "bg-green-100 text-green-700" },
  rejected: { label: "Rejected", cls: "bg-red-100 text-red-700" },
};

export default function OwnerDashboard() {
  const [properties, setProperties] = useState([]);
  const [me, setMe] = useState(null); // current owner (for phone-verification state)
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState(null); // which card is being deleted
  const [requestingId, setRequestingId] = useState(null); // which card is requesting a visit
  const [confirmDel, setConfirmDel] = useState(null); // property pending delete confirmation

  const { toasts, notify, dismiss } = useToasts();

  useEffect(() => {
    (async () => {
      try {
        const token = getUserToken();
        const [data, meRes] = await Promise.all([
          apiGet("/properties/mine", token),
          apiGet("/auth/me", token).catch(() => null), // non-fatal: banner just hides
        ]);
        setProperties(data?.properties || []);
        if (meRes?.user) setMe(meRes.user);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Soft-delete a property (after the confirm modal): call the API, drop it from
  // the list, and toast the outcome.
  async function doDelete() {
    const p = confirmDel;
    if (!p) return;
    setDeletingId(p.id);
    try {
      await apiDelete(`/properties/${p.id}`, getUserToken());
      setProperties((prev) => prev.filter((x) => x.id !== p.id));
      setConfirmDel(null);
      notify(`“${p.title}” was deleted.`, "success");
    } catch (e) {
      setConfirmDel(null);
      notify(e.message || "Couldn’t delete the property.", "error");
    } finally {
      setDeletingId(null);
    }
  }

  // Ask the team to prioritise the field visit that earns the Verified badge.
  async function requestVisit(p) {
    setRequestingId(p.id);
    try {
      await apiPost(`/properties/${p.id}/request-visit`, {}, getUserToken());
      setProperties((prev) => prev.map((x) => (x.id === p.id ? { ...x, visit_requested: true } : x)));
      notify("Request sent — our team will visit to verify your property soon.", "success");
    } catch (e) {
      notify(e.message || "Couldn’t send the request.", "error");
    } finally {
      setRequestingId(null);
    }
  }

  return (
    <OwnerShell active="dashboard">
      {/* Header — stacks on phones so the button never crowds the title. */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">My properties</h1>
          <p className="mt-1 text-sm text-ink/60">Manage your listings.</p>
        </div>
        <Link
          href="/owner/properties/new"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-dark"
        >
          <Plus size={17} /> Add property
        </Link>
      </div>

      {/* One-time phone verification (account-level). */}
      {me && <OwnerVerifyBanner user={me} onChange={setMe} />}

      {error ? (
        <p className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">{error}</p>
      ) : loading ? (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="overflow-hidden rounded-2xl border border-line bg-white">
              <div className="h-40 animate-pulse bg-mist" />
              <div className="space-y-3 p-4">
                <div className="h-4 w-2/3 animate-pulse rounded bg-mist" />
                <div className="h-3 w-1/2 animate-pulse rounded bg-mist" />
                <div className="h-8 w-full animate-pulse rounded bg-mist" />
              </div>
            </div>
          ))}
        </div>
      ) : properties.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-brand/40 bg-white p-12 text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-brand/10">
            <Home2 />
          </div>
          <p className="mt-4 text-ink/70">You haven’t listed any properties yet.</p>
          <Link
            href="/owner/properties/new"
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-brand px-5 py-2.5 font-semibold text-white transition-colors hover:bg-brand-dark"
          >
            <Plus size={17} /> List your first property
          </Link>
        </div>
      ) : (
        <>
          {/* Explain the field-visit "Verified" badge so owners know it exists. */}
          <div className="mt-6 flex items-start gap-3 rounded-2xl border border-line bg-white px-4 py-3.5 text-sm text-ink/70">
            <ShieldCheck size={18} className="mt-0.5 shrink-0 text-brand" />
            <p>
              <span className="font-semibold text-ink">Verified badge:</span> Our team personally
              visits listings to confirm they’re genuine. Once visited, your property shows a green{" "}
              <span className="font-medium text-brand">Verified</span> badge to seekers — building
              trust and attracting more enquiries. We’ll reach out to schedule a visit.
            </p>
          </div>

          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {properties.map((p) => {
              const cover = p.images?.[0]?.image_url || imageUrl(p.images?.[0]?.image_key);
              const status = STATUS[p.occupancy_status] || STATUS.available;
              // While the owner isn't phone-verified, listings can't be approved —
              // show that instead of the usual approval status.
              const needsVerify = me && !me.phone_verified;
              const approval = needsVerify
                ? { label: "Verify to publish", cls: "bg-amber-100 text-amber-700" }
                : APPROVAL[p.approval_status] || APPROVAL.pending;
              return (
                <div
                  key={p.id}
                  className="group overflow-hidden rounded-2xl border-2 border-brand/15 bg-gradient-to-b from-white via-brand/5 to-brand/10 shadow-sm transition-all duration-200 hover:border-brand hover:from-brand/10 hover:to-brand/20 hover:shadow-[0_14px_40px_rgba(74,90,80,0.28)] hover:ring-2 hover:ring-brand/30"
                >
                  {/* Sage accent bar — the brand "green touch" across every card. */}
                  <div className="h-1 w-full bg-gradient-to-r from-brand via-brand/70 to-gold/60" />
                  <Link href={`/owner/properties/${p.id}`} className="relative block h-40 bg-gradient-to-br from-brand/10 to-mist">
                    {cover ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={cover} alt={p.title} className="h-full w-full object-cover" />
                    ) : (
                      <div className="grid h-full place-items-center text-4xl">🏠</div>
                    )}
                    <span className={`absolute left-3 top-3 rounded-full px-2.5 py-0.5 text-xs font-semibold ${status.cls}`}>
                      {status.label}
                    </span>
                    <span className={`absolute right-3 top-3 rounded-full px-2.5 py-0.5 text-xs font-semibold ${approval.cls}`}>
                      {approval.label}
                    </span>
                  </Link>
                  <div className="p-4">
                    <Link href={`/owner/properties/${p.id}`} className="line-clamp-1 font-semibold text-ink transition-colors hover:text-brand">
                      {p.title}
                    </Link>
                    <p className="mt-1 flex items-center gap-1 text-sm text-ink/55">
                      <MapPin size={13} className="shrink-0" />
                      {p.city || "—"} · <span className="capitalize">{p.property_type}</span>
                      {p.max_persons ? ` · ${p.max_persons} persons` : ""}
                    </p>
                    {/* Field-visit verification status + a way to request a faster visit. */}
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      {p.field_visited ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                          <ShieldCheck size={12} /> Verified
                        </span>
                      ) : (
                        <>
                          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
                            Not verified
                          </span>
                          {p.visit_requested ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                              <Clock size={12} /> Visit requested
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => requestVisit(p)}
                              disabled={requestingId === p.id}
                              className="inline-flex items-center gap-1 rounded-full bg-gold px-2.5 py-1 text-xs font-bold text-white shadow-sm transition-all hover:brightness-105 hover:shadow disabled:opacity-60"
                            >
                              <Zap size={12} className="fill-white" /> {requestingId === p.id ? "Sending…" : "Fasten verification"}
                            </button>
                          )}
                        </>
                      )}
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="font-bold text-brand">
                        ₹{Number(p.rent_amount).toLocaleString("en-IN")}
                        <span className="text-xs font-normal text-ink/50"> /mo</span>
                      </span>
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/owner/properties/${p.id}/edit`}
                          className="inline-flex items-center gap-1 rounded-lg bg-brand px-3.5 py-1.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-brand-dark hover:shadow"
                        >
                          <Pencil size={14} /> Edit
                        </Link>
                        <button
                          type="button"
                          onClick={() => setConfirmDel(p)}
                          disabled={deletingId === p.id}
                          className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-sm font-semibold text-red-600 transition-colors hover:bg-red-100 disabled:opacity-60"
                        >
                          <Trash2 size={14} /> Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Brand-styled confirm + toasts (replacing native confirm()/alert()). */}
      <ConfirmDialog
        open={!!confirmDel}
        title="Delete this property?"
        message={
          confirmDel
            ? `“${confirmDel.title}” will be removed from your listings and the public site. This can’t be undone.`
            : ""
        }
        confirmLabel="Delete"
        tone="danger"
        busy={!!deletingId}
        onConfirm={doDelete}
        onCancel={() => setConfirmDel(null)}
      />
      <ToastViewport toasts={toasts} onDismiss={dismiss} />
    </OwnerShell>
  );
}

// Small house glyph for the empty state.
function Home2() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="text-brand">
      <path d="M3 10.5 12 3l9 7.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 9.5V21h14V9.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9.5 21v-6h5v6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
