"use client";

// A single roommate-post card. Used by /roommates and /roommates/mine.
// `onDeleted` is optional — passed through to the actions (used by "My posts").

import { useState } from "react";
import { MapPin, CalendarDays, Home, Search, BedDouble, Users, Building2, Lock } from "lucide-react";
import RoommatePostActions from "./RoommatePostActions";
import AvatarPopover from "./AvatarPopover";
import { PROPERTY_TYPE_LABEL } from "@/lib/listingMeta";

function fmtDate(d) {
  if (!d) return null;
  try {
    return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return null;
  }
}

// Labels for the clarifier fields.
const POST_TYPE = {
  have_place: { label: "Has a place", Icon: Home, cls: "bg-green-100 text-green-700" },
  seeking: { label: "Looking to share", Icon: Search, cls: "bg-coral/15 text-coral" },
};
const ROOM_TYPE = { private: "Private room", shared: "Shared room", entire: "Entire place" };
const PLACE_TYPE = PROPERTY_TYPE_LABEL; // shared list (lib/listingMeta)

export default function RoommatePostCard({ post, onDeleted }) {
  // Post status (active vs closed). `is_active` defaults to true for older rows.
  const [active, setActive] = useState(post.is_active !== false);
  const initial = (post.user?.name || "U").charAt(0).toUpperCase();
  const pt = POST_TYPE[post.post_type];
  const basis = post.budget_basis === "total" ? "total" : "per person";
  // People sharing range + computed total range (budget is per person).
  const pMin = post.persons || null;
  const pMax = post.persons_max && post.persons_max !== pMin ? post.persons_max : null;
  const inr = (n) => `₹${Number(n).toLocaleString("en-IN")}`;
  const peopleLabel = pMin ? (pMax ? `${pMin}–${pMax} sharing` : `${pMin} sharing`) : null;
  let totalLabel = null;
  if (post.budget != null && pMin) {
    const lo = Number(post.budget) * Number(pMin);
    const hi = pMax ? Number(post.budget) * Number(pMax) : null;
    totalLabel = hi ? `Total ${inr(lo)}–${inr(hi)}/mo` : `Total ${inr(lo)}/mo`;
  }

  return (
    <div className={`group relative flex flex-col overflow-hidden rounded-3xl border border-ink/10 bg-white p-6 shadow-sm transition-[box-shadow,border-color] duration-300 hover:border-grape/45 hover:shadow-xl hover:shadow-grape/15 hover:ring-2 hover:ring-grape/25 sm:p-7 ${active ? "" : "opacity-80"}`}>
      {/* Top gradient accent line */}
      <span className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-sun via-coral to-grape" />

      {/* Header: poster + prominent budget. On small screens these STACK so a long
          poster name gets the full first row and the price drops to the next line;
          from sm up they sit side by side. */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <AvatarPopover user={post.user} className="shrink-0">
            <span className="grid h-12 w-12 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-sun via-coral to-grape text-base font-bold text-white shadow ring-2 ring-white">
              {post.user?.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={post.user.avatar_url} alt="" referrerPolicy="no-referrer" className="h-full w-full object-cover" />
              ) : (
                initial
              )}
            </span>
          </AvatarPopover>
          <div className="min-w-0">
            <p className="truncate font-semibold capitalize text-ink">{post.user?.name || "User"}</p>
            {fmtDate(post.created_at) && (
              <p className="text-xs text-ink/45">Posted {fmtDate(post.created_at)}</p>
            )}
          </div>
        </div>

        {post.budget != null && (
          <div className="flex shrink-0 items-baseline gap-1.5 self-start rounded-2xl bg-grape/8 px-3.5 py-2 text-left ring-1 ring-grape/15 sm:block sm:self-auto sm:text-right">
            <p className="text-lg font-bold leading-none text-grape">
              ₹{Number(post.budget).toLocaleString("en-IN")}
            </p>
            <p className="whitespace-nowrap text-[10px] font-semibold uppercase tracking-wide text-ink/45 sm:mt-0.5">{basis} / month</p>
          </div>
        )}
      </div>

      {/* Status + post-type badges, then title */}
      <div className="mt-5 flex flex-wrap items-center gap-2">
        {active ? (
          // Catchy "live" pill: green gradient + a pulsing dot.
          <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 px-3 py-1 text-xs font-bold uppercase tracking-wide text-white shadow-sm shadow-green-500/30">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
            </span>
            Active
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-ink/80 px-3 py-1 text-xs font-bold uppercase tracking-wide text-white/90 shadow-sm">
            <Lock size={11} /> Closed
          </span>
        )}
        {pt && (
          <span className={`inline-flex w-fit items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${pt.cls}`}>
            <pt.Icon size={12} /> {pt.label}
          </span>
        )}
      </div>
      <h2 className="mt-2 text-xl font-bold leading-snug text-ink">{post.title}</h2>

      {/* Meta chips */}
      <div className="mt-3 flex flex-wrap gap-2 text-xs">
        {PLACE_TYPE[post.place_type] && (
          <span className="inline-flex items-center gap-1 rounded-full bg-ink/5 px-3 py-1.5 font-medium text-ink/70">
            <Building2 size={13} /> {PLACE_TYPE[post.place_type]}
          </span>
        )}
        {ROOM_TYPE[post.room_type] && (
          <span className="inline-flex items-center gap-1 rounded-full bg-grape/10 px-3 py-1.5 font-medium text-grape">
            <BedDouble size={13} /> {ROOM_TYPE[post.room_type]}
          </span>
        )}
        {peopleLabel && (
          <span className="inline-flex items-center gap-1 rounded-full bg-ink/5 px-3 py-1.5 font-medium text-ink/60">
            <Users size={13} /> {peopleLabel}
          </span>
        )}
        {totalLabel && (
          <span className="inline-flex items-center gap-1 rounded-full bg-sun/15 px-3 py-1.5 font-semibold text-[#9A6B18]">
            {totalLabel}
          </span>
        )}
        {post.preferred_location && (
          <span className="inline-flex items-center gap-1 rounded-full bg-coral/10 px-3 py-1.5 font-medium text-coral">
            <MapPin size={13} /> {post.preferred_location}
          </span>
        )}
        {fmtDate(post.move_in_date) && (
          <span className="inline-flex items-center gap-1 rounded-full bg-ink/5 px-3 py-1.5 font-medium text-ink/60">
            <CalendarDays size={13} /> {post.post_type === "have_place" ? "Available" : "Move-in"} {fmtDate(post.move_in_date)}
          </span>
        )}
      </div>

      {post.description && (
        <p className="mt-4 line-clamp-3 flex-1 text-sm leading-relaxed text-ink/65">{post.description}</p>
      )}

      <div className="mt-6 flex items-center justify-end border-t border-ink/10 pt-4">
        <RoommatePostActions post={post} onDeleted={onDeleted} active={active} onToggle={setActive} />
      </div>
    </div>
  );
}
