"use client";

// Owner top-bar avatar + dropdown. Sage/gold themed to match the site.
// On phones the dropdown also carries the primary nav (My properties / Add
// property) + "View public site", so the header stays clean without a separate
// hamburger. On desktop those live inline and the dropdown is account-only.

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { LayoutGrid, PlusCircle, UserPen, ExternalLink, LogOut } from "lucide-react";
import { SAGE, GOLD, OLIVE, LINE, CREAM } from "../public/palette";

function initials(name = "") {
  return (name.trim().split(/\s+/).slice(0, 2).map((p) => p[0]).join("") || "U").toUpperCase();
}

function Row({ href, onClick, icon: Icon, label, danger }) {
  const color = danger ? "#DC2626" : OLIVE;
  const inner = (
    <>
      <Icon size={17} color={danger ? "#DC2626" : SAGE} />
      {label}
    </>
  );
  const cls =
    "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-colors";
  const onEnter = (e) => (e.currentTarget.style.background = danger ? "#FEF2F2" : CREAM);
  const onLeave = (e) => (e.currentTarget.style.background = "transparent");
  if (href) {
    return (
      <Link href={href} onClick={onClick} className={cls} style={{ color }} onMouseEnter={onEnter} onMouseLeave={onLeave}>
        {inner}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} className={cls} style={{ color }} onMouseEnter={onEnter} onMouseLeave={onLeave}>
      {inner}
    </button>
  );
}

export default function OwnerAvatarMenu({ user, onLogout }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function onClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const close = () => setOpen(false);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Open account menu"
        className="flex items-center gap-2"
      >
        <span
          className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-full text-sm font-bold text-white"
          style={{ border: `2px solid ${SAGE}`, background: SAGE }}
        >
          {user?.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.avatar_url} alt="" referrerPolicy="no-referrer" className="h-full w-full object-cover" />
          ) : (
            initials(user?.name)
          )}
        </span>
        <span className="hidden text-sm font-medium capitalize lg:block" style={{ color: OLIVE }}>
          {user?.name}
        </span>
      </button>

      {open && (
        <div
          className="absolute right-0 mt-3 w-60 overflow-hidden rounded-2xl bg-white"
          style={{ border: `1px solid ${LINE}`, boxShadow: "0 24px 70px rgba(30,37,33,0.18)" }}
        >
          {/* Header */}
          <div className="px-4 py-3.5" style={{ borderBottom: `1px solid ${LINE}`, background: CREAM }}>
            <div className="flex items-center gap-2">
              <p className="truncate text-sm font-semibold capitalize" style={{ color: OLIVE }}>
                {user?.name}
              </p>
              <span
                className="rounded-full px-2 py-0.5 text-[11px] font-semibold"
                style={{ background: `${GOLD}26`, color: "#9A6B18" }}
              >
                Owner
              </span>
            </div>
            {user?.email && (
              <p className="truncate text-xs" style={{ color: `${OLIVE}99` }}>
                {user.email}
              </p>
            )}
          </div>

          <div className="p-1.5">
            {/* Primary nav — mobile only (inline on desktop). */}
            <div className="md:hidden">
              <Row href="/owner" onClick={close} icon={LayoutGrid} label="My properties" />
              <Row href="/owner/properties/new" onClick={close} icon={PlusCircle} label="Add property" />
              <div className="my-1" style={{ borderTop: `1px solid ${LINE}` }} />
            </div>

            <Row href="/profile" onClick={close} icon={UserPen} label="Edit profile" />
            <Row href="/" onClick={close} icon={ExternalLink} label="View public site" />

            <div className="my-1" style={{ borderTop: `1px solid ${LINE}` }} />
            <Row onClick={() => { close(); onLogout(); }} icon={LogOut} label="Log out" danger />
          </div>
        </div>
      )}
    </div>
  );
}
