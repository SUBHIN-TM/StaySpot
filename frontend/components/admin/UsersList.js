"use client";

// Reusable admin table of users for a given role ("seeker" = regular users,
// "owner" = owners). Lists them and lets the admin delete a user.

import { useEffect, useState } from "react";
import { apiGet, apiDelete, apiPatch } from "@/lib/api";
import { getToken } from "@/lib/auth";

function initials(name = "") {
  return (name.trim().split(/\s+/).slice(0, 2).map((p) => p[0]).join("") || "U").toUpperCase();
}

function fmtDate(d) {
  try {
    return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return "—";
  }
}

export default function UsersList({ role, title, subtitle }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

  return (
    <>
      <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
      <p className="mt-1 text-slate-500">{subtitle}</p>

      <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white">
        {error ? (
          <p className="p-6 text-red-600">{error}</p>
        ) : loading ? (
          <p className="p-6 text-slate-500">Loading…</p>
        ) : users.length === 0 ? (
          <p className="p-6 text-slate-500">No {title.toLowerCase()} yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-medium">Name</th>
                  <th className="px-5 py-3 font-medium">Email</th>
                  <th className="px-5 py-3 font-medium">Username</th>
                  <th className="px-5 py-3 font-medium">Joined</th>
                  <th className="px-5 py-3 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => (
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
                    <td className="px-5 py-3 text-slate-600">{u.username || "—"}</td>
                    <td className="px-5 py-3 text-slate-600">{fmtDate(u.created_at)}</td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-2">
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
    </>
  );
}
