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
import { Bell } from "lucide-react";
import { apiGet, apiPost } from "@/lib/api";
import { SAGE, GOLD, OLIVE, LINE, CREAM } from "@/components/public/palette";

export default function NotificationBell({ token, messagesPath = "/messages", color = OLIVE }) {
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
      <button
        onClick={toggle}
        className="relative rounded-lg p-2 transition-colors hover:bg-black/5"
        style={{ color }}
        aria-label="Notifications"
      >
        <Bell size={21} />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-red-500 px-1 text-xs font-bold text-white ring-2 ring-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 mt-3 w-80 overflow-hidden rounded-2xl bg-white"
          style={{ border: `1px solid ${LINE}`, boxShadow: "0 24px 70px rgba(30,37,33,0.18)" }}
        >
          <div
            className="flex items-center gap-2 px-4 py-3 text-sm font-semibold"
            style={{ background: CREAM, borderBottom: `1px solid ${LINE}`, color: OLIVE }}
          >
            <Bell size={15} color={SAGE} />
            Notifications
            {unread > 0 && (
              <span
                className="ml-auto rounded-full px-2 py-0.5 text-[11px] font-bold"
                style={{ background: `${GOLD}26`, color: "#9A6B18" }}
              >
                {unread} new
              </span>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {items.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
                <Bell size={26} color={`${OLIVE}40`} />
                <p className="text-sm" style={{ color: `${OLIVE}80` }}>No notifications yet.</p>
              </div>
            ) : (
              items.map((n) => (
                <button
                  key={n.id}
                  onClick={() => clickItem(n)}
                  className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors"
                  style={{ borderBottom: `1px solid ${LINE}` }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = CREAM)}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full" style={{ background: SAGE }} />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium" style={{ color: OLIVE }}>{n.title}</span>
                    {n.message && (
                      <span className="block truncate text-xs" style={{ color: `${OLIVE}99` }}>{n.message}</span>
                    )}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
