"use client";

// Reusable admin table of users for a given role ("seeker" = regular users,
// "owner" = owners) with search, sort and filters. Lets the admin block/unblock,
// delete, and (for owners) verify the phone number.

import { useEffect, useMemo, useState } from "react";
import { apiGet, apiDelete, apiPatch } from "@/lib/api";
import { getToken } from "@/lib/auth";
import AdminVerifyOwnerModal from "./AdminVerifyOwnerModal";
import AuditHistoryModal from "./AuditHistoryModal";

function initials(name = "") {
  return (name.trim().split(/\s+/).slice(0, 2).map((p) => p[0]).join("") || "U").toUpperCase();
}

function fmtDate(d) {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return "—";
  }
}
const ms = (d) => (d ? new Date(d).getTime() : 0);

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

export default function UsersList({ role, title, subtitle }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [verifying, setVerifying] = useState(null); // owner open in the verify modal
  const [historyUser, setHistoryUser] = useState(null); // user open in the history modal

  // Toolbar state
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("joined_desc");
  const [fBlocked, setFBlocked] = useState("all");
  const [fVerified, setFVerified] = useState("all"); // owners only

  // Phone verification only applies to owners (they list properties).
  const isOwner = role === "owner";

  async function load() {
    try {
      const d = await apiGet(`/users?role=${role}`, getToken());
      setUsers(d.users || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    load();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function remove(u) {
    if (!confirm(`Delete ${u.name} (${u.email})?\nThis also removes their listings and data.`)) return;
    try {
      await apiDelete(`/users/${u.id}`, getToken());
      setUsers((list) => list.filter((x) => x.id !== u.id));
    } catch (e) {
      alert(e.message);
    }
  }

  // Block or unblock — a blocked user can't log in or use the app.
  async function toggleBlock(u) {
    try {
      const { user } = await apiPatch(`/users/${u.id}/block`, { is_blocked: !u.is_blocked }, getToken());
      setUsers((list) => list.map((x) => (x.id === u.id ? { ...x, is_blocked: user.is_blocked } : x)));
    } catch (e) {
      alert(e.message);
    }
  }

  // Derived list: filter then sort.
  const view = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = users.filter((u) => {
      if (q && ![u.name, u.email, u.username].some((v) => (v || "").toLowerCase().includes(q))) return false;
      if (fBlocked === "blocked" && !u.is_blocked) return false;
      if (fBlocked === "active" && u.is_blocked) return false;
      if (isOwner && fVerified === "verified" && !u.phone_verified) return false;
      if (isOwner && fVerified === "awaiting" && (u.phone_verified || !u.mobile_number)) return false;
      if (isOwner && fVerified === "not_submitted" && u.mobile_number) return false;
      return true;
    });
    const cmp = {
      joined_desc: (a, b) => ms(b.created_at) - ms(a.created_at),
      joined_asc: (a, b) => ms(a.created_at) - ms(b.created_at),
      edited_desc: (a, b) => ms(b.updated_at) - ms(a.updated_at),
      edits_desc: (a, b) => (b.edit_count || 0) - (a.edit_count || 0),
      edits_asc: (a, b) => (a.edit_count || 0) - (b.edit_count || 0),
      name_asc: (a, b) => (a.name || "").localeCompare(b.name || ""),
    }[sort];
    return cmp ? [...list].sort(cmp) : list;
  }, [users, search, sort, fBlocked, fVerified, isOwner]);

  return (
    <>
      <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
      <p className="mt-1 text-slate-500">{subtitle}</p>

      {/* Toolbar: search · sort · filters */}
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search name, email or username…"
          className="w-60 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand"
        />
        <Select label="Sort" value={sort} onChange={setSort}>
          <option value="joined_desc">Newest joined</option>
          <option value="joined_asc">Oldest joined</option>
          <option value="edited_desc">Recently edited</option>
          <option value="edits_desc">Most edited</option>
          <option value="edits_asc">Least edited</option>
          <option value="name_asc">Name A–Z</option>
        </Select>
        <Select label="Status" value={fBlocked} onChange={setFBlocked}>
          <option value="all">All</option>
          <option value="active">Active</option>
          <option value="blocked">Blocked</option>
        </Select>
        {isOwner && (
          <Select label="Verified" value={fVerified} onChange={setFVerified}>
            <option value="all">All</option>
            <option value="verified">Verified</option>
            <option value="awaiting">Awaiting call</option>
            <option value="not_submitted">Not submitted</option>
          </Select>
        )}
      </div>

      <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white">
        {error ? (
          <p className="p-6 text-red-600">{error}</p>
        ) : loading ? (
          <p className="p-6 text-slate-500">Loading…</p>
        ) : view.length === 0 ? (
          <p className="p-6 text-slate-500">No {title.toLowerCase()} match your filters.</p>
        ) : (
          <div className="overflow-x-auto">
            <p className="px-5 py-2 text-xs text-slate-400">Showing {view.length} of {users.length}</p>
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-medium">Name</th>
                  <th className="px-5 py-3 font-medium">Email</th>
                  {isOwner && <th className="px-5 py-3 font-medium">Phone</th>}
                  {isOwner && <th className="px-5 py-3 font-medium">Verified</th>}
                  <th className="px-5 py-3 font-medium">Username</th>
                  <th className="px-5 py-3 font-medium">Edits</th>
                  <th className="px-5 py-3 font-medium">Joined</th>
                  <th className="px-5 py-3 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {view.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        {u.avatar_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={u.avatar_url} alt="" referrerPolicy="no-referrer" className="h-8 w-8 rounded-full object-cover" />
                        ) : (
                          <span className="grid h-8 w-8 place-items-center rounded-full bg-brand text-xs font-bold text-white">
                            {initials(u.name)}
                          </span>
                        )}
                        <span className="font-medium capitalize text-slate-900">{u.name}</span>
                        {u.is_blocked && (
                          <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                            Blocked
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3 text-slate-600">{u.email}</td>
                    {isOwner && (
                      <td className="px-5 py-3 text-slate-600">
                        {u.mobile_number ? `+91 ${u.mobile_number}` : "—"}
                      </td>
                    )}
                    {isOwner && (
                      <td className="px-5 py-3">
                        {u.phone_verified ? (
                          <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                            ✓ Verified
                          </span>
                        ) : u.mobile_number ? (
                          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                            Awaiting call
                          </span>
                        ) : (
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
                            Not submitted
                          </span>
                        )}
                      </td>
                    )}
                    <td className="px-5 py-3 text-slate-600">{u.username || "—"}</td>
                    <td className="px-5 py-3">
                      {u.edit_count > 0 ? (
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">{u.edit_count}×</span>
                      ) : (
                        <span className="text-xs text-slate-400">0</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-slate-500">
                      {fmtDate(u.created_at)}
                      {u.updated_at && ms(u.updated_at) > ms(u.created_at) + 60000 && (
                        <span className="block text-xs text-slate-400">edited {fmtDate(u.updated_at)}</span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setHistoryUser(u)}
                          className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
                        >
                          History
                        </button>
                        {isOwner && (
                          <button
                            onClick={() => setVerifying(u)}
                            className={`rounded-lg border px-3 py-1.5 text-sm font-medium ${
                              u.phone_verified
                                ? "border-slate-200 text-slate-600 hover:bg-slate-50"
                                : "border-green-200 text-green-700 hover:bg-green-50"
                            }`}
                          >
                            {u.phone_verified ? "Verified ✓" : "Verify phone"}
                          </button>
                        )}
                        <button
                          onClick={() => toggleBlock(u)}
                          className={`rounded-lg border px-3 py-1.5 text-sm font-medium ${
                            u.is_blocked
                              ? "border-green-200 text-green-700 hover:bg-green-50"
                              : "border-amber-200 text-amber-700 hover:bg-amber-50"
                          }`}
                        >
                          {u.is_blocked ? "Unblock" : "Block"}
                        </button>
                        <button
                          onClick={() => remove(u)}
                          className="rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {verifying && (
        <AdminVerifyOwnerModal
          owner={verifying}
          onClose={() => setVerifying(null)}
          onChanged={(updated) =>
            setUsers((list) => list.map((x) => (x.id === updated.id ? { ...x, ...updated } : x)))
          }
        />
      )}

      {historyUser && (
        <AuditHistoryModal
          entityType="user"
          entityId={historyUser.id}
          title={historyUser.name}
          onClose={() => setHistoryUser(null)}
        />
      )}
    </>
  );
}
