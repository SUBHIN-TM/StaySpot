"use client";

// Wraps any avatar so that TAPPING it opens a small popover card with the
// person's photo, name and joined date (instead of blowing the image up full
// screen). Used wherever we list a seeker or owner avatar.
//
//   <AvatarPopover user={post.user} className="shrink-0">
//     <span className="grid h-12 w-12 ...">…the existing avatar…</span>
//   </AvatarPopover>
//
// The popover is position:fixed (computed from the avatar's rect) so it is never
// clipped by a card's overflow-hidden, and it flips above the avatar near the
// bottom of the screen.

import { useEffect, useRef, useState } from "react";

const POP_W = 216; // popover width (px)
const POP_H = 150; // approx popover height, used for flip math

function joinedLabel(createdAt) {
  if (!createdAt) return null;
  try {
    return "Joined " + new Date(createdAt).toLocaleDateString("en-IN", { month: "short", year: "numeric" });
  } catch {
    return null;
  }
}

export default function AvatarPopover({ user, children, className = "" }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState(null);
  const btnRef = useRef(null);
  const popRef = useRef(null);

  const name = user?.name || "User";
  const initial = name.charAt(0).toUpperCase();
  const joined = joinedLabel(user?.created_at);

  // Close on outside click, Escape, or when the page scrolls/resizes (the fixed
  // popover would otherwise drift away from its avatar).
  useEffect(() => {
    if (!open) return;
    function onDocClick(e) {
      if (btnRef.current?.contains(e.target) || popRef.current?.contains(e.target)) return;
      setOpen(false);
    }
    function onKey(e) { if (e.key === "Escape") setOpen(false); }
    function onScroll() { setOpen(false); }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onScroll, { passive: true, capture: true });
    window.addEventListener("resize", onScroll);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onScroll, { capture: true });
      window.removeEventListener("resize", onScroll);
    };
  }, [open]);

  function toggle(e) {
    e.preventDefault();
    e.stopPropagation();
    if (open) { setOpen(false); return; }
    const r = btnRef.current.getBoundingClientRect();
    // Centre the popover under the avatar, clamped to the viewport.
    let left = r.left + r.width / 2 - POP_W / 2;
    left = Math.min(Math.max(12, left), window.innerWidth - POP_W - 12);
    // Flip above the avatar if there isn't room below.
    const top = r.bottom + 8 + POP_H > window.innerHeight ? Math.max(12, r.top - 8 - POP_H) : r.bottom + 8;
    setPos({ left, top });
    setOpen(true);
  }

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={toggle}
        aria-label={`View ${name}`}
        className={`cursor-pointer ${className}`}
      >
        {children}
      </button>

      {open && pos && (
        <div
          ref={popRef}
          className="fixed z-[80] rounded-2xl border border-ink/10 bg-white p-4 shadow-xl"
          style={{ left: pos.left, top: pos.top, width: POP_W }}
        >
          <div className="flex flex-col items-center text-center">
            {user?.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.avatar_url} alt={name} referrerPolicy="no-referrer" className="h-16 w-16 rounded-full object-cover ring-2 ring-line" />
            ) : (
              <span className="grid h-16 w-16 place-items-center rounded-full bg-brand text-xl font-bold text-white">{initial}</span>
            )}
            <p className="mt-2 w-full truncate font-semibold capitalize text-ink">{name}</p>
            {joined && <p className="mt-0.5 text-xs text-ink/50">{joined}</p>}
          </div>
        </div>
      )}
    </>
  );
}
