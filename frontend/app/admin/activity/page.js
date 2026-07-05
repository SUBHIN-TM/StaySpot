"use client";

// Admin → Activity  (URL: "/admin/activity")
// A global, security-oriented audit feed of everything users/owners/admins do:
// sign-ups, logins, profile edits, listings and roommate posts created/edited/
// deleted, moderation actions, account deletions. Filter by type, action, role,
// or search by the person. Backed by GET /api/audit.

import { useCallback, useEffect, useState } from "react";
import { Search, X, ChevronLeft, ChevronRight } from "lucide-react";
import AdminShell from "@/components/admin/AdminShell";
import { apiGet } from "@/lib/api";
import { getToken } from "@/lib/auth";

function fmtWhen(d) {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  } catch {
    return "—";
  }
}
function initials(name = "") {
  return (name.trim().split(/\s+/).slice(0, 2).map((p) => p[0]).join("") || "?").toUpperCase();
}

const ENTITY_LABEL = { user: "Account", property: "Listing", roommate_post: "Roommate post" };
const ROLE_STYLE = {
  owner: "bg-[#D4A359]/20 text-[#9A6B18]",
  seeker: "bg-brand/10 text-brand",
  admin: "bg-ink/10 text-ink",
};

// A friendly, context-aware label for each audit action.
function actionLabel(a) {
  const e = a.entity_type;
  switch (a.action) {
    case "register": return "Signed up";
    case "login": return "Logged in";
    case "self_delete": return "Deleted their account";
    case "create": return e === "property" ? "Created a listing" : e === "roommate_post" ? "Created a roommate post" : "Created";
    case "update": return e === "user" ? "Edited profile" : e === "property" ? "Edited a listing" : "Edited a roommate post";
    case "delete": return e === "property" ? "Deleted a listing" : "Deleted a roommate post";
    case "status": return "Changed post status";
    case "approval": return "Listing moderated";
    case "field_visit": return "Recorded a field visit";
    case "visit_request": return "Requested verification";
    case "image_add": return "Added images";
    case "image_remove": return "Removed an image";
    case "video_set": return "Set a video";
    case "phone_submit": return "Submitted a phone number";
    case "phone_verify": return "Phone verified";
    case "avatar_set": return "Updated profile photo";
    case "block": return "Blocked an account";
    case "unblock": return "Unblocked an account";
    default: return a.action;
  }
}

// A short one-line detail from the `changes` payload.
function detailText(a) {
  const c = a.changes || {};
  if (a.action === "login" || a.action === "register") return c.method ? `via ${c.method}` : "";
  if (a.action === "status") return c.is_active === false ? "closed" : c.is_active === true ? "reopened" : "";
  if (c.title) return `“${c.title}”`;
  // Generic before/after diff → list the changed field names.
  const fields = Object.keys(c).filter((k) => k !== "title" && c[k] && typeof c[k] === "object" && ("before" in c[k] || "after" in c[k] || "changed" in c[k]));
  if (fields.length) return `changed: ${fields.join(", ")}`;
  return "";
}

const ACTIONS = [
  "", "register", "login", "self_delete", "create", "update", "delete", "status",
  "approval", "field_visit", "phone_verify", "block", "unblock",
];

export default function AdminActivityPage() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters
  const [entityType, setEntityType] = useState("");
  const [action, setAction] = useState("");
  const [role, setRole] = useState("");
  const [q, setQ] = useState("");

  const load = useCallback(async (p) => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ page: String(p), limit: "50" });
      if (entityType) params.set("entity_type", entityType);
      if (action) params.set("action", action);
      if (role) params.set("actor_role", role);
      if (q.trim()) params.set("q", q.trim());
      const d = await apiGet(`/audit?${params.toString()}`, getToken());
      setItems(d.items || []);
      setTotal(d.total || 0);
      setTotalPages(d.total_pages || 1);
      setPage(d.page || p);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [entityType, action, role, q]);

  // Reload (back to page 1) whenever a filter changes; debounce the text search.
  useEffect(() => {
    const t = setTimeout(() => load(1), 300);
    return () => clearTimeout(t);
  }, [load]);

  const select = "rounded-lg border border-line bg-white px-2 py-1.5 text-sm text-ink/80 outline-none focus:border-brand";

  return (
    <AdminShell active="activity">
      <h1 className="text-2xl font-bold text-ink">Activity</h1>
      <p className="mt-1 text-ink/60">A full history of what users and owners do, for tracking and security.</p>

      {/* Filters */}
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <div className="flex w-64 items-center gap-2 rounded-lg border border-line bg-white px-3 py-2">
          <Search size={16} className="text-ink/40" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search person (name or email)…"
            className="w-full bg-transparent text-sm outline-none"
          />
          {q && <button onClick={() => setQ("")} aria-label="Clear"><X size={14} className="text-ink/40" /></button>}
        </div>
        <label className="flex items-center gap-1 text-xs text-ink/60">
          Type
          <select value={entityType} onChange={(e) => setEntityType(e.target.value)} className={select}>
            <option value="">All</option>
            <option value="user">Account</option>
            <option value="property">Listing</option>
            <option value="roommate_post">Roommate post</option>
          </select>
        </label>
        <label className="flex items-center gap-1 text-xs text-ink/60">
          Action
          <select value={action} onChange={(e) => setAction(e.target.value)} className={select}>
            {ACTIONS.map((a) => (
              <option key={a || "all"} value={a}>{a ? actionLabel({ action: a, entity_type: entityType }) : "All"}</option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-1 text-xs text-ink/60">
          Role
          <select value={role} onChange={(e) => setRole(e.target.value)} className={select}>
            <option value="">All</option>
            <option value="seeker">Seeker</option>
            <option value="owner">Owner</option>
            <option value="admin">Admin</option>
          </select>
        </label>
      </div>

      <div className="mt-4 overflow-hidden rounded-2xl border border-line bg-white">
        {error ? (
          <p className="p-6 text-red-600">{error}</p>
        ) : loading ? (
          <p className="p-6 text-ink/60">Loading…</p>
        ) : items.length === 0 ? (
          <p className="p-6 text-ink/60">No activity matches your filters.</p>
        ) : (
          <div className="overflow-x-auto">
            <p className="px-5 py-2 text-xs text-ink/40">{total} event{total === 1 ? "" : "s"}</p>
            <table className="w-full text-left text-sm">
              <thead className="bg-mist text-ink/60">
                <tr>
                  <th className="px-5 py-3 font-medium">When</th>
                  <th className="px-5 py-3 font-medium">Who</th>
                  <th className="px-5 py-3 font-medium">Action</th>
                  <th className="px-5 py-3 font-medium">Where</th>
                  <th className="px-5 py-3 font-medium">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {items.map((a) => (
                  <tr key={a.id} className="hover:bg-mist">
                    <td className="whitespace-nowrap px-5 py-3 text-ink/60">{fmtWhen(a.created_at)}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand text-[10px] font-bold text-white">
                          {initials(a.actor_name || "System")}
                        </span>
                        <div className="min-w-0">
                          <p className="flex items-center gap-1.5 font-medium capitalize text-ink">
                            {a.actor_name || "System"}
                            {a.actor_role && (
                              <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold uppercase ${ROLE_STYLE[a.actor_role] || "bg-ink/10 text-ink/60"}`}>
                                {a.actor_role}
                              </span>
                            )}
                            {a.actor_deleted && (
                              <span className="rounded-full bg-ink/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-ink/55">Deleted</span>
                            )}
                          </p>
                          {a.actor_email && <p className="truncate text-xs text-ink/45">{a.actor_email}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 font-medium text-ink">{actionLabel(a)}</td>
                    <td className="px-5 py-3 text-ink/60">{ENTITY_LABEL[a.entity_type] || a.entity_type}</td>
                    <td className="px-5 py-3 text-ink/60">{detailText(a) || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && !error && totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-line px-5 py-3 text-sm">
            <span className="text-ink/50">Page {page} of {totalPages}</span>
            <div className="flex gap-2">
              <button
                onClick={() => load(page - 1)}
                disabled={page <= 1}
                className="inline-flex items-center gap-1 rounded-lg border border-line px-3 py-1.5 font-medium text-ink/70 hover:bg-mist disabled:opacity-40"
              >
                <ChevronLeft size={15} /> Prev
              </button>
              <button
                onClick={() => load(page + 1)}
                disabled={page >= totalPages}
                className="inline-flex items-center gap-1 rounded-lg border border-line px-3 py-1.5 font-medium text-ink/70 hover:bg-mist disabled:opacity-40"
              >
                Next <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
