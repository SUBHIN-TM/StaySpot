"use client";

// Admin → Roommates  (URL: "/admin/roommates")
// Moderate roommate-finder posts: see every post (any status, any author,
// including deleted accounts), read the full details, close/reopen a post
// (hides it from messaging while keeping it visible), or delete it outright.

import { useEffect, useMemo, useState } from "react";
import { Search, Eye, Lock, RotateCcw, Trash2, X } from "lucide-react";
import AdminShell from "@/components/admin/AdminShell";
import { apiGet, apiPatch, apiDelete } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { useToast } from "@/components/ToastProvider";
import { useConfirm } from "@/components/ConfirmProvider";
import { PROPERTY_TYPE_LABEL } from "@/lib/listingMeta";

const POST_TYPE = { have_place: "Has a place", seeking: "Looking to share" };
const ROOM_TYPE = { private: "Private room", shared: "Shared room", entire: "Entire place" };

function fmtDate(d) {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return "—";
  }
}
function inr(n) {
  return n == null ? "—" : `₹${Number(n).toLocaleString("en-IN")}`;
}
function initials(name = "") {
  return (name.trim().split(/\s+/).slice(0, 2).map((p) => p[0]).join("") || "U").toUpperCase();
}

export default function AdminRoommatesPage() {
  const toast = useToast();
  const confirm = useConfirm();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusF, setStatusF] = useState("all"); // all | active | closed
  const [busyId, setBusyId] = useState(null);
  const [detail, setDetail] = useState(null); // post open in the details modal

  useEffect(() => {
    (async () => {
      try {
        const d = await apiGet("/roommate-posts/admin/all", getToken());
        setPosts(d.posts || []);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const view = useMemo(() => {
    const q = search.trim().toLowerCase();
    return posts.filter((p) => {
      const active = p.is_active !== false;
      if (statusF === "active" && !active) return false;
      if (statusF === "closed" && active) return false;
      if (q && ![p.title, p.description, p.user?.name, p.user?.email, p.preferred_location].some((v) => (v || "").toLowerCase().includes(q))) return false;
      return true;
    });
  }, [posts, search, statusF]);

  // Close/reopen a post (admin override of the owner's status).
  async function toggle(p) {
    const active = p.is_active !== false;
    const ok = await confirm({
      title: active ? "Close this post?" : "Reopen this post?",
      message: active
        ? "It stays visible but seekers can no longer message the poster about it."
        : "It becomes active again and seekers can message the poster.",
      confirmLabel: active ? "Close post" : "Reopen post",
      tone: active ? "danger" : "info",
    });
    if (!ok) return;
    setBusyId(p.id);
    try {
      const { post } = await apiPatch(`/roommate-posts/${p.id}`, { is_active: !active }, getToken());
      setPosts((list) => list.map((x) => (x.id === p.id ? { ...x, is_active: post.is_active } : x)));
      toast(active ? "Post closed." : "Post reopened.", "success");
    } catch (e) {
      toast(e.message || "Couldn’t update the post", "error");
    } finally {
      setBusyId(null);
    }
  }

  async function remove(p) {
    const ok = await confirm({
      title: `Delete "${p.title}"?`,
      message: "This permanently removes the roommate post. This can't be undone.",
      confirmLabel: "Delete",
      tone: "danger",
    });
    if (!ok) return;
    setBusyId(p.id);
    try {
      await apiDelete(`/roommate-posts/${p.id}`, getToken());
      setPosts((list) => list.filter((x) => x.id !== p.id));
      toast("Post deleted.", "success");
    } catch (e) {
      toast(e.message || "Couldn’t delete the post", "error");
      setBusyId(null);
    }
  }

  return (
    <AdminShell active="roommates">
      <h1 className="text-2xl font-bold text-ink">Roommate posts</h1>
      <p className="mt-1 text-ink/60">Review, close/reopen or remove roommate-finder posts.</p>

      {/* Toolbar */}
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <div className="flex w-72 items-center gap-2 rounded-lg border border-line bg-white px-3 py-2">
          <Search size={16} className="text-ink/40" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search title, author, area…"
            className="w-full bg-transparent text-sm outline-none"
          />
          {search && (
            <button onClick={() => setSearch("")} aria-label="Clear"><X size={14} className="text-ink/40" /></button>
          )}
        </div>
        <label className="flex items-center gap-1 text-xs text-ink/60">
          Status
          <select
            value={statusF}
            onChange={(e) => setStatusF(e.target.value)}
            className="rounded-lg border border-line bg-white px-2 py-1.5 text-sm text-ink/80 outline-none focus:border-brand"
          >
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="closed">Closed</option>
          </select>
        </label>
      </div>

      <div className="mt-4 overflow-hidden rounded-2xl border border-line bg-white">
        {error ? (
          <p className="p-6 text-red-600">{error}</p>
        ) : loading ? (
          <p className="p-6 text-ink/60">Loading…</p>
        ) : view.length === 0 ? (
          <p className="p-6 text-ink/60">No roommate posts match your filters.</p>
        ) : (
          <div className="overflow-x-auto">
            <p className="px-5 py-2 text-xs text-ink/40">Showing {view.length} of {posts.length}</p>
            <table className="w-full text-left text-sm">
              <thead className="bg-mist text-ink/60">
                <tr>
                  <th className="px-5 py-3 font-medium">Author</th>
                  <th className="px-5 py-3 font-medium">Post</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Posted</th>
                  <th className="px-5 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {view.map((p) => {
                  const active = p.is_active !== false;
                  const busy = busyId === p.id;
                  return (
                    <tr key={p.id} className="align-top hover:bg-mist">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          {p.user?.avatar_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={p.user.avatar_url} alt="" referrerPolicy="no-referrer" className="h-8 w-8 rounded-full object-cover" />
                          ) : (
                            <span className="grid h-8 w-8 place-items-center rounded-full bg-brand text-xs font-bold text-white">{initials(p.user?.name)}</span>
                          )}
                          <div className="min-w-0">
                            <p className="flex items-center gap-1.5 font-medium capitalize text-ink">
                              {p.user?.name || "User"}
                              {p.user?.deleted_at && (
                                <span className="rounded-full bg-ink/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-ink/55">Deleted</span>
                              )}
                            </p>
                            <p className="truncate text-xs text-ink/50">{p.user?.email || "—"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <p className="font-medium text-ink">{p.title}</p>
                        <p className="mt-0.5 text-xs text-ink/50">
                          {POST_TYPE[p.post_type] || "—"}
                          {p.place_type && PROPERTY_TYPE_LABEL[p.place_type] ? ` · ${PROPERTY_TYPE_LABEL[p.place_type]}` : ""}
                          {p.budget != null ? ` · ${inr(p.budget)}/mo` : ""}
                        </p>
                      </td>
                      <td className="px-5 py-3">
                        {active ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">Active</span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-ink/10 px-2 py-0.5 text-xs font-semibold text-ink/55">Closed</span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-ink/60">{fmtDate(p.created_at)}</td>
                      <td className="px-5 py-3">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => setDetail(p)}
                            className="inline-flex items-center gap-1 rounded-lg border border-line px-2.5 py-1.5 text-sm font-medium text-ink/70 hover:bg-white"
                          >
                            <Eye size={14} /> View
                          </button>
                          <button
                            onClick={() => toggle(p)}
                            disabled={busy}
                            className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-sm font-medium disabled:opacity-60 ${
                              active ? "border-amber-200 text-amber-700 hover:bg-amber-50" : "border-green-200 text-green-700 hover:bg-green-50"
                            }`}
                          >
                            {active ? <><Lock size={14} /> Close</> : <><RotateCcw size={14} /> Reopen</>}
                          </button>
                          <button
                            onClick={() => remove(p)}
                            disabled={busy}
                            className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-2.5 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-60"
                          >
                            <Trash2 size={14} /> Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Details modal */}
      {detail && (
        <div className="fixed inset-0 z-[90] grid place-items-center p-4" style={{ background: "rgba(30,37,33,0.45)" }} onClick={() => setDetail(null)}>
          <div className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-lg font-bold text-ink">{detail.title}</h2>
              <button onClick={() => setDetail(null)} aria-label="Close" className="text-ink/50 hover:text-ink"><X size={20} /></button>
            </div>
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              <span className="rounded-full bg-mist px-2.5 py-1 font-medium text-ink/70">{POST_TYPE[detail.post_type] || "—"}</span>
              {detail.place_type && PROPERTY_TYPE_LABEL[detail.place_type] && (
                <span className="rounded-full bg-mist px-2.5 py-1 font-medium text-ink/70">{PROPERTY_TYPE_LABEL[detail.place_type]}</span>
              )}
              {ROOM_TYPE[detail.room_type] && (
                <span className="rounded-full bg-mist px-2.5 py-1 font-medium text-ink/70">{ROOM_TYPE[detail.room_type]}</span>
              )}
              {detail.budget != null && (
                <span className="rounded-full bg-grape/10 px-2.5 py-1 font-semibold text-grape">{inr(detail.budget)}/mo</span>
              )}
              <span className={`rounded-full px-2.5 py-1 font-semibold ${detail.is_active !== false ? "bg-green-100 text-green-700" : "bg-ink/10 text-ink/55"}`}>
                {detail.is_active !== false ? "Active" : "Closed"}
              </span>
            </div>
            {detail.preferred_location && (
              <p className="mt-3 text-sm text-ink/70"><span className="font-medium">Preferred area:</span> {detail.preferred_location}</p>
            )}
            {detail.move_in_date && (
              <p className="mt-1 text-sm text-ink/70"><span className="font-medium">Move-in:</span> {fmtDate(detail.move_in_date)}</p>
            )}
            {detail.description && (
              <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-ink/75">{detail.description}</p>
            )}
            <div className="mt-4 border-t border-line pt-3 text-sm text-ink/60">
              <span className="font-medium text-ink/80 capitalize">{detail.user?.name || "User"}</span>
              {detail.user?.email ? ` · ${detail.user.email}` : ""}
              {detail.user?.deleted_at ? " · (account deleted)" : ""}
              <span className="block text-xs text-ink/40">Posted {fmtDate(detail.created_at)}</span>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
