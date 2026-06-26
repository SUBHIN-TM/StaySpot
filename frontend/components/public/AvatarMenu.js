"use client";

// The round avatar shown in the navbar when a user is logged in.
// Clicking it opens a dropdown with "Edit profile" and "Log out".
// If the logged-in account is an OWNER, we show an emerald "Owner" badge + ring
// and a quick link to the owner dashboard — so an owner browsing the public
// (user) site can tell they're in user mode.

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

function initials(name = "") {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return (parts.slice(0, 2).map((p) => p[0]).join("") || "U").toUpperCase();
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

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 mt-2 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
          {/* Header: name + email + role */}
          <div className="border-b border-slate-100 px-4 py-3">
            <div className="flex items-center gap-2">
              <p className="truncate text-sm font-semibold capitalize text-slate-900">{user.name}</p>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                  isOwner ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"
                }`}
              >
                {isOwner ? "Owner" : "User"}
              </span>
            </div>
            <p className="truncate text-xs text-slate-500">{user.email}</p>
          </div>

          {/* Owner-only: jump to the owner dashboard */}
          {isOwner && (
            <Link
              href="/owner"
              onClick={() => setOpen(false)}
              className="block px-4 py-2.5 text-sm font-medium text-emerald-700 hover:bg-emerald-50"
            >
              🏠 Owner dashboard
            </Link>
          )}

          <Link
            href="/wishlist"
            onClick={() => setOpen(false)}
            className="block px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
          >
            ❤️ Wishlist
          </Link>
          <Link
            href="/messages"
            onClick={() => setOpen(false)}
            className="block px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
          >
            💬 Messages
          </Link>
          <Link
            href="/profile"
            onClick={() => setOpen(false)}
            className="block px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
          >
            ✏️ Edit profile
          </Link>
          <button
            onClick={onLogout}
            className="block w-full px-4 py-2.5 text-left text-sm text-red-600 hover:bg-slate-50"
          >
            ↪ Log out
          </button>
        </div>
      )}
    </div>
  );
}
