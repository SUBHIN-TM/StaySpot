"use client";

// Owner dashboard  (URL: "/owner")
// Lists all the owner's properties (available or not) with status + edit links.

import { useEffect, useState } from "react";
import Link from "next/link";
import OwnerShell from "@/components/owner/OwnerShell";
import { apiGet, imageUrl } from "@/lib/api";
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const data = await apiGet("/properties/mine", getUserToken());
        setProperties(data?.properties || []);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <OwnerShell active="dashboard">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My properties</h1>
          <p className="mt-1 text-slate-500">Manage your listings.</p>
        </div>
        <Link
          href="/owner/properties/new"
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
        >
          + Add property
        </Link>
      </div>

      {error ? (
        <p className="mt-8 rounded-xl border border-red-200 bg-red-50 p-6 text-red-700">{error}</p>
      ) : loading ? (
        <p className="mt-8 text-slate-500">Loading…</p>
      ) : properties.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-emerald-300 bg-white p-12 text-center">
          <p className="text-slate-600">You haven’t listed any properties yet.</p>
          <Link
            href="/owner/properties/new"
            className="mt-4 inline-block rounded-lg bg-emerald-600 px-5 py-2.5 font-semibold text-white hover:bg-emerald-700"
          >
            List your first property
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {properties.map((p) => {
            const cover = p.images?.[0]?.image_url || imageUrl(p.images?.[0]?.image_key);
            const status = STATUS[p.occupancy_status] || STATUS.available;
            const approval = APPROVAL[p.approval_status] || APPROVAL.pending;
            return (
              <div key={p.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                <div className="relative h-40 bg-gradient-to-br from-emerald-100 to-slate-200">
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
                </div>
                <div className="p-4">
                  <h3 className="line-clamp-1 font-semibold text-slate-900">{p.title}</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    📍 {p.city || "—"} · {p.property_type}
                    {p.max_persons ? ` · ${p.max_persons} persons` : ""}
                  </p>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="font-bold text-emerald-700">
                      ₹{Number(p.rent_amount).toLocaleString("en-IN")}
                      <span className="text-xs font-normal text-slate-500"> /mo</span>
                    </span>
                    <Link
                      href={`/owner/properties/${p.id}/edit`}
                      className="rounded-lg border border-emerald-300 px-3 py-1.5 text-sm font-medium text-emerald-700 hover:bg-emerald-50"
                    >
                      Edit
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </OwnerShell>
  );
}
