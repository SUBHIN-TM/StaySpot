"use client";

// Admin edit-history timeline for a user or property. Fetches /audit/:type/:id
// and lists every change newest-first. Click an entry's timestamp to expand the
// before/after diff — so admins can audit exactly what an owner/user changed.

import { useEffect, useState } from "react";
import { apiGet } from "@/lib/api";
import { getToken } from "@/lib/auth";

const ACTION = {
  update: "Edited details",
  image_add: "Added image(s)",
  image_remove: "Removed an image",
  video_set: "Updated video",
  approval: "Approval changed",
  field_visit: "Field visit recorded",
  visit_request: "Requested field visit",
  delete: "Deleted",
  avatar_set: "Changed profile photo",
  phone_submit: "Submitted phone number",
  phone_verify: "Phone verification changed",
  block: "Blocked",
  unblock: "Unblocked",
};

function fmtDateTime(d) {
  try {
    return new Date(d).toLocaleString("en-IN", {
      day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
    });
  } catch {
    return d;
  }
}

function show(v) {
  if (v === null || v === undefined || v === "") return "—";
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
}

// Expanded detail for one entry: show real media for image/avatar/video edits
// (so admins can SEE what was added), otherwise the field before/after diff.
function EntryDetails({ item }) {
  const c = item.changes || {};

  if (item.action === "image_add" && Array.isArray(c.urls) && c.urls.length) {
    return (
      <div>
        <p className="mb-2 text-xs text-slate-500">{c.urls.length} image(s) added — click to view full size:</p>
        <div className="grid grid-cols-3 gap-2">
          {c.urls.map((url, i) => (
            <a key={i} href={url} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-lg border border-slate-200">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="Added" className="h-20 w-full object-cover" />
            </a>
          ))}
        </div>
      </div>
    );
  }
  if (item.action === "avatar_set" && c.avatar_url) {
    return (
      <a href={c.avatar_url} target="_blank" rel="noreferrer" className="inline-block">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={c.avatar_url} alt="New photo" className="h-20 w-20 rounded-full border border-slate-200 object-cover" />
      </a>
    );
  }
  if (item.action === "video_set" && c.url) {
    return <video src={c.url} controls className="h-36 w-full rounded-lg border border-slate-200 bg-black object-contain" />;
  }
  return <Changes changes={item.changes} />;
}

// Render one `changes` payload as readable before/after lines.
function Changes({ changes }) {
  if (!changes || Object.keys(changes).length === 0) {
    return <p className="text-xs text-slate-400">No field details recorded.</p>;
  }
  return (
    <ul className="space-y-1">
      {Object.entries(changes).map(([field, val]) => (
        <li key={field} className="text-xs text-slate-600">
          <span className="font-medium capitalize text-slate-700">{field.replace(/_/g, " ")}:</span>{" "}
          {val && typeof val === "object" && "before" in val ? (
            <>
              <span className="rounded bg-red-50 px-1 text-red-600 line-through">{show(val.before)}</span>
              {" → "}
              <span className="rounded bg-green-50 px-1 text-green-700">{show(val.after)}</span>
            </>
          ) : val && typeof val === "object" && val.changed ? (
            <span className="text-slate-500">changed</span>
          ) : (
            <span className="text-slate-600">{show(val)}</span>
          )}
        </li>
      ))}
    </ul>
  );
}

export default function AuditHistoryModal({ entityType, entityId, title, onClose }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openId, setOpenId] = useState(null); // expanded entry

  useEffect(() => {
    (async () => {
      try {
        const d = await apiGet(`/audit/${entityType}/${entityId}`, getToken());
        setItems(d.history || []);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [entityType, entityId]);

  return (
    <div className="fixed inset-0 z-[70] grid place-items-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-10 flex max-h-[85vh] w-full max-w-lg flex-col rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
          <div>
            <h2 className="font-semibold text-slate-900">Edit history</h2>
            {title && <p className="text-xs text-slate-500">{title}</p>}
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100" aria-label="Close">
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 5l10 10M15 5L5 15" strokeLinecap="round" /></svg>
          </button>
        </div>

        <div className="overflow-y-auto p-5">
          {error ? (
            <p className="text-sm text-red-600">{error}</p>
          ) : loading ? (
            <p className="text-sm text-slate-500">Loading…</p>
          ) : items.length === 0 ? (
            <p className="text-sm text-slate-500">No edits recorded yet.</p>
          ) : (
            <ol className="relative space-y-3 border-l border-slate-200 pl-4">
              {items.map((it) => {
                const open = openId === it.id;
                return (
                  <li key={it.id} className="relative">
                    <span className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full bg-brand" />
                    <button
                      onClick={() => setOpenId(open ? null : it.id)}
                      className="block w-full text-left"
                    >
                      <p className="text-sm font-medium text-slate-900">
                        {ACTION[it.action] || it.action}
                      </p>
                      <p className="text-xs text-slate-500">
                        {fmtDateTime(it.created_at)}
                        {it.actor_name ? ` · by ${it.actor_name}` : ""}
                        {it.actor_role ? ` (${it.actor_role})` : ""}
                      </p>
                    </button>
                    {open && (
                      <div className="mt-2 rounded-lg bg-slate-50 p-3">
                        <EntryDetails item={it} />
                      </div>
                    )}
                  </li>
                );
              })}
            </ol>
          )}
        </div>
      </div>
    </div>
  );
}
