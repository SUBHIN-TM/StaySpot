"use client";

// Admin → Localities  (URL: "/admin/localities")
// Manage owner-curated localities (scoped per PINCODE): see how many properties
// use each, merge duplicates/variants within a pincode, rename (fix typos), delete.

import { useEffect, useState } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { apiGet, apiPost, apiPatch, apiDelete } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { districtsOf, DEFAULT_STATE } from "@/lib/geo";

const DISTRICTS = districtsOf(DEFAULT_STATE);

export default function AdminLocalitiesPage() {
  const [district, setDistrict] = useState(DISTRICTS[0] || "");
  const [pincodeFilter, setPincodeFilter] = useState("");
  const [q, setQ] = useState("");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  // Merge state: which rows are checked (by id), and which row is the target (id).
  const [selected, setSelected] = useState(() => new Set());
  const [target, setTarget] = useState("");
  const [mergePreview, setMergePreview] = useState(null); // dry-run awaiting confirmation

  const targetRow = rows.find((r) => r.id === target) || null;

  async function load() {
    setLoading(true);
    setError("");
    try {
      const qs = new URLSearchParams();
      if (district) qs.set("district", district);
      if (pincodeFilter.trim()) qs.set("pincode", pincodeFilter.trim());
      if (q.trim()) qs.set("q", q.trim());
      const d = await apiGet(`/localities?${qs.toString()}`, getToken());
      setRows(d.localities || []);
      setSelected(new Set());
      setTarget("");
      setMergePreview(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  // Reload when the district changes (pincode/search are manual via the button).
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [district]);

  function toggle(id) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  // Step 1: dry-run. Merge happens within ONE pincode — the target's pincode.
  async function requestMerge() {
    if (!targetRow) return setError("Pick a target locality to merge into.");
    const pincode = targetRow.pincode;
    // Only sources in the SAME pincode as the target can be merged.
    const sources = rows
      .filter((r) => selected.has(r.id) && r.pincode === pincode && r.id !== target)
      .map((r) => r.name);
    if (!sources.length) {
      return setError("Select at least one other locality in the same pincode as the target.");
    }
    setError("");
    setNotice("");
    try {
      const d = await apiPost("/localities/merge/preview", { pincode, target: targetRow.name, sources }, getToken());
      setMergePreview({ ...d, pincode, sources });
    } catch (e) {
      setError(e.message);
    }
  }

  // Step 2: the admin confirmed the preview — perform the merge.
  async function confirmMerge() {
    if (!mergePreview) return;
    setError("");
    setNotice("");
    try {
      const d = await apiPost(
        "/localities/merge",
        { pincode: mergePreview.pincode, target: mergePreview.target, sources: mergePreview.sources },
        getToken()
      );
      setNotice(`Merged into "${d.target}". ${d.propertiesUpdated} property(ies) updated, ${d.removed} removed.`);
      setMergePreview(null);
      await load();
    } catch (e) {
      setError(e.message);
    }
  }

  async function rename(row) {
    const name = prompt(`Rename "${row.name}" (pincode ${row.pincode}) to:`, row.name);
    if (name == null || !name.trim() || name.trim() === row.name) return;
    setError("");
    setNotice("");
    try {
      const d = await apiPatch(`/localities/${row.id}`, { name: name.trim() }, getToken());
      setNotice(`Renamed to "${d.name}". ${d.propertiesUpdated} property(ies) updated.`);
      await load();
    } catch (e) {
      setError(e.message);
    }
  }

  async function remove(row) {
    const msg = row.property_count
      ? `Delete "${row.name}" (${row.pincode})? ${row.property_count} property(ies) still use it (their text stays, it just leaves the dropdown).`
      : `Delete "${row.name}" (${row.pincode})?`;
    if (!confirm(msg)) return;
    setError("");
    setNotice("");
    try {
      await apiDelete(`/localities/${row.id}`, getToken());
      setNotice(`Deleted "${row.name}".`);
      await load();
    } catch (e) {
      setError(e.message);
    }
  }

  const inputCls = "rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-brand";

  return (
    <AdminShell active="localities">
      <h1 className="text-2xl font-bold text-slate-900">Localities</h1>
      <p className="mt-1 text-slate-500">
        Localities are scoped to a pincode. Merge duplicates within the same pincode to keep them clean.
      </p>

      {error && <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      {notice && <p className="mt-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{notice}</p>}

      {/* Filters */}
      <div className="mt-6 flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-sm font-medium text-slate-700">District</label>
          <select value={district} onChange={(e) => setDistrict(e.target.value)} className={`${inputCls} mt-1`}>
            {DISTRICTS.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Pincode</label>
          <input
            value={pincodeFilter}
            onChange={(e) => setPincodeFilter(e.target.value.replace(/\D/g, "").slice(0, 6))}
            onKeyDown={(e) => e.key === "Enter" && load()}
            placeholder="optional"
            className={`${inputCls} mt-1 w-28`}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Search</label>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && load()}
            placeholder="name contains…"
            className={`${inputCls} mt-1`}
          />
        </div>
        <button onClick={load} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
          Apply
        </button>
      </div>

      {/* Merge bar */}
      <div className="mt-5 flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
        <div>
          <label className="block text-sm font-medium text-slate-700">Merge selected into</label>
          <select value={target} onChange={(e) => setTarget(e.target.value)} className={`${inputCls} mt-1`}>
            <option value="">Choose target…</option>
            {rows.map((r) => <option key={r.id} value={r.id}>{r.name} — {r.pincode}</option>)}
          </select>
        </div>
        <button
          onClick={requestMerge}
          disabled={!target || selected.size === 0}
          className="rounded-lg bg-brand px-5 py-2 font-semibold text-white hover:opacity-90 disabled:opacity-50"
        >
          Preview merge {selected.size > 0 ? `(${selected.size})` : ""}
        </button>
        <p className="text-xs text-slate-500">
          Tick the duplicates, choose the correct name as target. Only rows in the target's pincode are merged.
        </p>
      </div>

      {/* Table */}
      <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white">
        {loading ? (
          <p className="p-6 text-slate-400">Loading…</p>
        ) : rows.length === 0 ? (
          <p className="p-6 text-slate-400">No localities yet for {district}.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-500">
              <tr>
                <th className="w-10 px-4 py-3"></th>
                <th className="px-4 py-3 font-medium">Locality</th>
                <th className="px-4 py-3 font-medium">Pincode</th>
                <th className="px-4 py-3 font-medium">Used by</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-slate-100">
                  <td className="px-4 py-3">
                    <input type="checkbox" checked={selected.has(r.id)} onChange={() => toggle(r.id)} />
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {r.name}
                    {r.id === target && (
                      <span className="ml-2 rounded-full bg-brand/10 px-2 py-0.5 text-[10px] font-semibold text-brand">target</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{r.pincode || "—"}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {r.property_count} {r.property_count === 1 ? "property" : "properties"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => rename(r)} className="mr-3 text-slate-600 hover:underline">Rename</button>
                    <button onClick={() => remove(r)} className="text-red-600 hover:underline">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Merge confirmation preview */}
      {mergePreview && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-slate-900">Confirm merge</h2>
            <p className="mt-1 text-sm text-slate-500">
              Merging into <span className="font-semibold text-slate-900">{mergePreview.target}</span>{" "}
              (pincode {mergePreview.pincode}).
            </p>

            <ul className="mt-4 max-h-48 space-y-1 overflow-auto text-sm">
              {mergePreview.perSource.map((s) => (
                <li key={s.name} className="flex justify-between border-b border-slate-100 py-1">
                  <span className="text-slate-700">{s.name}</span>
                  <span className="text-slate-500">
                    {s.count} {s.count === 1 ? "property" : "properties"}
                  </span>
                </li>
              ))}
            </ul>

            <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
              This will update <strong>{mergePreview.propertiesAffected}</strong>{" "}
              propert{mergePreview.propertiesAffected === 1 ? "y" : "ies"} and remove{" "}
              <strong>{mergePreview.localitiesRemoved}</strong>{" "}
              localit{mergePreview.localitiesRemoved === 1 ? "y" : "ies"}.
            </p>

            <div className="mt-5 flex justify-end gap-3">
              <button
                onClick={() => setMergePreview(null)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmMerge}
                className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
              >
                Confirm merge
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
