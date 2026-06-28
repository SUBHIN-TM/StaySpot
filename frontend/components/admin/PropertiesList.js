"use client";

// Admin table of ALL properties (any owner, any status) with search, sort and
// filters. Click a row to open the full detail modal (approve/reject/field-visit/
// delete). Lists are capped at 200 server-side, so filtering/sorting is done here.

import { useEffect, useMemo, useState } from "react";
import { apiGet } from "@/lib/api";
import { getToken } from "@/lib/auth";
import PropertyDetailModal from "./PropertyDetailModal";

const STATUS = {
  pending: "bg-amber-100 text-amber-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
};

function fmtDate(d) {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return "—";
  }
}

// A tidy little dropdown used across the toolbar.
function Select({ value, onChange, children, label }) {
  return (
    <label className="flex items-center gap-1 text-xs text-slate-500">
      {label}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-700 outline-none focus:border-brand"
      >
        {children}
      </select>
    </label>
  );
}

export default function PropertiesList() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null); // property open in the modal

  // Toolbar state
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("added_desc");
  const [fApproval, setFApproval] = useState("all");
  const [fOwner, setFOwner] = useState("all"); // owner phone-verified
  const [fVisit, setFVisit] = useState("all"); // field-visited
  const [fRequested, setFRequested] = useState("all"); // visit requested
  const [showDeleted, setShowDeleted] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const d = await apiGet(`/properties/all${showDeleted ? "?include_deleted=1" : ""}`, getToken());
      setItems(d.properties || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    load();
  }, [showDeleted]); // eslint-disable-line react-hooks/exhaustive-deps

  // Called by the modal after approve/reject/field-visit (updated property) or delete (null).
  function handleChanged(updated) {
    if (updated === null) {
      setItems((list) => list.filter((x) => x.id !== selected.id));
      setSelected(null);
      return;
    }
    setItems((list) => list.map((x) => (x.id === updated.id ? { ...x, ...updated } : x)));
    setSelected(updated);
  }

  // Derived list: filter then sort.
  const view = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = items.filter((p) => {
      if (q && ![p.title, p.owner?.name, p.city].some((v) => (v || "").toLowerCase().includes(q))) return false;
      if (fApproval !== "all" && p.approval_status !== fApproval) return false;
      if (fOwner === "yes" && !p.owner?.phone_verified) return false;
      if (fOwner === "no" && p.owner?.phone_verified) return false;
      if (fVisit === "yes" && !p.field_visited) return false;
      if (fVisit === "no" && p.field_visited) return false;
      if (fRequested === "yes" && !p.visit_requested) return false;
      return true;
    });
    const t = (d) => (d ? new Date(d).getTime() : 0);
    const cmp = {
      added_desc: (a, b) => t(b.created_at) - t(a.created_at),
      added_asc: (a, b) => t(a.created_at) - t(b.created_at),
      edited_desc: (a, b) => t(b.updated_at) - t(a.updated_at),
      rent_desc: (a, b) => Number(b.rent_amount) - Number(a.rent_amount),
      rent_asc: (a, b) => Number(a.rent_amount) - Number(b.rent_amount),
      edits_desc: (a, b) => (b.edit_count || 0) - (a.edit_count || 0),
      edits_asc: (a, b) => (a.edit_count || 0) - (b.edit_count || 0),
      title_asc: (a, b) => (a.title || "").localeCompare(b.title || ""),
    }[sort];
    return cmp ? [...list].sort(cmp) : list;
  }, [items, search, sort, fApproval, fOwner, fVisit, fRequested]);

  return (
    <>
      <h1 className="text-2xl font-bold text-slate-900">Properties</h1>
      <p className="mt-1 text-slate-500">All listings — click a row to view details and approve.</p>

      {/* Toolbar: search · sort · filters */}
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search title, owner or city…"
          className="w-60 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand"
        />
        <Select label="Sort" value={sort} onChange={setSort}>
          <option value="added_desc">Newest added</option>
          <option value="added_asc">Oldest added</option>
          <option value="edited_desc">Recently edited</option>
          <option value="rent_desc">Rent: high → low</option>
          <option value="rent_asc">Rent: low → high</option>
          <option value="edits_desc">Most edited</option>
          <option value="edits_asc">Least edited</option>
          <option value="title_asc">Title A–Z</option>
        </Select>
        <Select label="Approval" value={fApproval} onChange={setFApproval}>
          <option value="all">All</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </Select>
        <Select label="Owner" value={fOwner} onChange={setFOwner}>
          <option value="all">All</option>
          <option value="yes">Verified</option>
          <option value="no">Not verified</option>
        </Select>
        <Select label="Field visit" value={fVisit} onChange={setFVisit}>
          <option value="all">All</option>
          <option value="yes">Visited</option>
          <option value="no">Not visited</option>
        </Select>
        <Select label="Requested" value={fRequested} onChange={setFRequested}>
          <option value="all">All</option>
          <option value="yes">Requested</option>
        </Select>
        <label className="flex items-center gap-1.5 text-sm text-slate-600">
          <input type="checkbox" checked={showDeleted} onChange={(e) => setShowDeleted(e.target.checked)} />
          Show deleted
        </label>
      </div>

      <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white">
        {error ? (
          <p className="p-6 text-red-600">{error}</p>
        ) : loading ? (
          <p className="p-6 text-slate-500">Loading…</p>
        ) : view.length === 0 ? (
          <p className="p-6 text-slate-500">No properties match your filters.</p>
        ) : (
          <div className="overflow-x-auto">
            <p className="px-5 py-2 text-xs text-slate-400">Showing {view.length} of {items.length}</p>
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-medium">Title</th>
                  <th className="px-5 py-3 font-medium">Owner</th>
                  <th className="px-5 py-3 font-medium">Owner verified</th>
                  <th className="px-5 py-3 font-medium">Field visit</th>
                  <th className="px-5 py-3 font-medium">Visit requested</th>
                  <th className="px-5 py-3 font-medium">City</th>
                  <th className="px-5 py-3 font-medium">Rent</th>
                  <th className="px-5 py-3 font-medium">Edits</th>
                  <th className="px-5 py-3 font-medium">Added</th>
                  <th className="px-5 py-3 font-medium">Approval</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {view.map((p) => (
                  <tr
                    key={p.id}
                    onClick={() => setSelected(p)}
                    className="cursor-pointer hover:bg-slate-50"
                  >
                    <td className="px-5 py-3 font-medium text-brand">
                      {p.title}
                      {p.deleted_at && (
                        <span className="ml-2 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">Deleted</span>
                      )}
                    </td>
                    <td className="px-5 py-3 capitalize text-slate-600">{p.owner?.name || "—"}</td>
                    <td className="px-5 py-3">
                      {p.owner?.phone_verified ? (
                        <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">✓ Verified</span>
                      ) : (
                        <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">Not verified</span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      {p.field_visited ? (
                        <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">📍 Visited</span>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      {p.visit_requested ? (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">⚡ Requested</span>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-slate-600">{p.city || "—"}</td>
                    <td className="px-5 py-3 text-slate-600">₹{Number(p.rent_amount).toLocaleString("en-IN")}</td>
                    <td className="px-5 py-3">
                      {p.edit_count > 0 ? (
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">{p.edit_count}×</span>
                      ) : (
                        <span className="text-xs text-slate-400">0</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-slate-500">
                      {fmtDate(p.created_at)}
                      {p.updated_at && t2(p.updated_at) > t2(p.created_at) + 60000 && (
                        <span className="block text-xs text-slate-400">edited {fmtDate(p.updated_at)}</span>
                      )}
                    </td>
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

// Parse a timestamp to ms (0 if missing) — used to decide if a row was edited.
function t2(d) {
  return d ? new Date(d).getTime() : 0;
}
