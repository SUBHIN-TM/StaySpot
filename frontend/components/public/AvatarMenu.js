"use client";

// The round avatar shown in the navbar when a user is logged in.
// Clicking it opens a dropdown with "Edit profile" and "Log out".
// If the logged-in account is an OWNER, we show an emerald "Owner" badge + ring
// and a quick link to the owner dashboard — so an owner browsing the public
// (user) site can tell they're in user mode.

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Heart, MessageCircle, UserPen, LogOut, LayoutDashboard } from "lucide-react";
import { SAGE, GOLD, OLIVE, LINE, CREAM } from "./palette";

function initials(name = "") {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return (parts.slice(0, 2).map((p) => p[0]).join("") || "U").toUpperCase();
}

// A single dropdown row: lucide icon + label. `accent` gives the owner-dashboard
// link the gold accent; the rest use sage icons on a cream hover.
function MenuLink({ href, icon: Icon, label, onClick, accent }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors"
      style={{ color: accent ? "#9A6B18" : OLIVE }}
      onMouseEnter={(e) => (e.currentTarget.style.background = CREAM)}
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
    >
      <Icon size={17} color={accent ? GOLD : SAGE} />
      {label}
    </Link>
  );
}

export default function AvatarMenu({ user, onLogout }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const isOwner = user.role === "owner";

  useEffect(() => {
    function onClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      {/* Trigger: optional "Owner" badge + avatar */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2"
        aria-label="Open profile menu"
      >
        {isOwner && (
          <span className="hidden rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700 sm:inline">
            Owner
          </span>
        )}
        <span
          className={`block h-9 w-9 overflow-hidden rounded-full border-2 ${
            isOwner ? "border-emerald-500" : "border-slate-300 hover:border-brand"
          }`}
        >
          {user.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.avatar_url} alt={user.name} referrerPolicy="no-referrer" className="h-full w-full object-cover" />
          ) : (
            <span className={`grid h-full w-full place-items-center text-sm font-bold text-white ${isOwner ? "bg-emerald-600" : "bg-brand"}`}>
              {initials(user.name)}
            </span>
          )}
        </span>
      </button>

      {/* Dropdown — themed to the sage/gold brand palette, lucide line icons */}
      {open && (
        <div
          className="absolute right-0 mt-3 w-60 overflow-hidden rounded-2xl bg-white"
          style={{ border: `1px solid ${LINE}`, boxShadow: "0 24px 70px rgba(30,37,33,0.18)" }}
        >
          {/* Header: name + email + role */}
          <div className="px-4 py-3.5" style={{ borderBottom: `1px solid ${LINE}`, background: CREAM }}>
            <div className="flex items-center gap-2">
              <p className="truncate text-sm font-semibold capitalize" style={{ color: OLIVE }}>{user.name}</p>
              <span
                className="rounded-full px-2 py-0.5 text-[11px] font-semibold"
                style={
                  isOwner
                    ? { background: `${GOLD}26`, color: "#9A6B18" }
                    : { background: `${SAGE}1A`, color: SAGE }
                }
              >
                {isOwner ? "Owner" : "User"}
              </span>
            </div>
            <p className="truncate text-xs" style={{ color: `${OLIVE}99` }}>{user.email}</p>
          </div>

          <div className="p-1.5">
            {/* Owner-only: jump to the owner dashboard */}
            {isOwner && (
              <MenuLink href="/owner" icon={LayoutDashboard} label="Owner dashboard" onClick={() => setOpen(false)} accent />
            )}
            <MenuLink href="/wishlist" icon={Heart} label="Wishlist" onClick={() => setOpen(false)} />
            <MenuLink href="/messages" icon={MessageCircle} label="Messages" onClick={() => setOpen(false)} />
            <MenuLink href="/profile" icon={UserPen} label="Edit profile" onClick={() => setOpen(false)} />

            <div className="my-1" style={{ borderTop: `1px solid ${LINE}` }} />

            <button
              onClick={onLogout}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
            >
              <LogOut size={17} />
              Log out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
