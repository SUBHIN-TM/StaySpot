"use client";

// Bell icon with an unread badge + a dropdown of recent notifications.
// Polls the backend every 20s. Token-driven (works for users/owners and admin).
//
// Props:
//   token        - JWT of the logged-in account
//   messagesPath - where to go when a message notification is clicked
//                  (e.g. "/messages" or "/admin/messages")

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { apiGet, apiPost } from "@/lib/api";

export default function NotificationBell({ token, messagesPath = "/messages" }) {
  const router = useRouter();
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  async function load() {
    try {
      const d = await apiGet("/notifications", token);
      setItems(d.notifications || []);
      setUnread(d.unread_count || 0);
    } catch {
      /* ignore poll errors */
    }
  }

  useEffect(() => {
    load();
    const t = setInterval(load, 20000);
    return () => clearInterval(t);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Close on outside click.
  useEffect(() => {
    function onClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  async function toggle() {
    const next = !open;
    setOpen(next);
    if (next && unread > 0) {
      try {
        await apiPost("/notifications/read-all", {}, token);
        setUnread(0);
      } catch {
        /* ignore */
      }
    }
  }

  function clickItem(n) {
    setOpen(false);
    const convId = n.data?.conversation_id;
    if (convId) router.push(`${messagesPath}?c=${convId}`);
  }

  return (
    <div className="relative" ref={ref}>
      <button onClick={toggle} className="relative rounded-lg p-2 text-slate-600 hover:bg-slate-100" aria-label="Notifications">
        <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M11 4a5 5 0 0 0-5 5v3l-1 2h12l-1-2V9a5 5 0 0 0-5-5zM9 18a2 2 0 0 0 4 0" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-red-500 px-1 text-xs font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
          <div className="border-b border-slate-100 px-4 py-2 text-sm font-semibold text-slate-900">
            Notifications
          </div>
          <div className="max-h-96 overflow-y-auto">
            {items.length === 0 ? (
              <p className="p-4 text-sm text-slate-500">No notifications.</p>
            ) : (
              items.map((n) => (
                <button
                  key={n.id}
                  onClick={() => clickItem(n)}
                  className="block w-full border-b border-slate-50 px-4 py-3 text-left hover:bg-slate-50"
                >
                  <p className="text-sm font-medium text-slate-900">{n.title}</p>
                  {n.message && <p className="truncate text-xs text-slate-500">{n.message}</p>}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
