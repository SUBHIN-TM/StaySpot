"use client";

// Admin table of ALL properties (any owner, any status).
// Click a row to open the full detail modal (images/video/map + approve/reject/delete).

import { useEffect, useState } from "react";
import { apiGet } from "@/lib/api";
import { getToken } from "@/lib/auth";
import PropertyDetailModal from "./PropertyDetailModal";

const STATUS = {
  pending: "bg-amber-100 text-amber-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
};

export default function PropertiesList() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null); // property open in the modal

  async function load() {
    try {
      const d = await apiGet("/properties/all", getToken());
      setItems(d.properties || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    load();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Called by the modal after approve/reject (updated property) or delete (null).
  function handleChanged(updated) {
    if (updated === null) {
      setItems((list) => list.filter((x) => x.id !== selected.id));
    } else {
      setItems((list) => list.map((x) => (x.id === updated.id ? { ...x, ...updated } : x)));
      setSelected(updated);
      return;
    }
    setSelected(null);
  }

  return (
    <>
      <h1 className="text-2xl font-bold text-slate-900">Properties</h1>
      <p className="mt-1 text-slate-500">All listings — click a row to view details and approve.</p>

      <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white">
        {error ? (
          <p className="p-6 text-red-600">{error}</p>
        ) : loading ? (
          <p className="p-6 text-slate-500">Loading…</p>
        ) : items.length === 0 ? (
          <p className="p-6 text-slate-500">No properties yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-medium">Title</th>
                  <th className="px-5 py-3 font-medium">Owner</th>
                  <th className="px-5 py-3 font-medium">City</th>
                  <th className="px-5 py-3 font-medium">Rent</th>
                  <th className="px-5 py-3 font-medium">Approval</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((p) => (
                  <tr
                    key={p.id}
                    onClick={() => setSelected(p)}
                    className="cursor-pointer hover:bg-slate-50"
                  >
                    <td className="px-5 py-3 font-medium text-brand">{p.title}</td>
                    <td className="px-5 py-3 capitalize text-slate-600">{p.owner?.name || "—"}</td>
                    <td className="px-5 py-3 text-slate-600">{p.city || "—"}</td>
                    <td className="px-5 py-3 text-slate-600">₹{Number(p.rent_amount).toLocaleString("en-IN")}</td>
                    <td className="px-5 py-3">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS[p.approval_status] || STATUS.pending}`}>
                        {p.approval_status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selected && (
        <PropertyDetailModal
          property={selected}
          onClose={() => setSelected(null)}
          onChanged={handleChanged}
        />
      )}
    </>
  );
}
