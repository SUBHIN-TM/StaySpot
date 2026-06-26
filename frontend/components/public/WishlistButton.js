"use client";

// Heart toggle used on property cards and the detail page. Clicking it saves /
// removes the property from the user's wishlist (favorites). Reads its filled /
// empty state from the shared wishlist store so all hearts stay in sync.
//
// When placed on top of a clickable card (a <Link>), it stops the click from
// also navigating. Logged-out users are sent to /login.

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { isFavorited, toggleFavorite, subscribe, loadWishlist, setPendingWishlist } from "@/lib/wishlist";
import { getUserToken } from "@/lib/userAuth";
import { OLIVE } from "./palette";

const LIKED = "#E86A6A"; // soft red when saved (matches the design)

export default function WishlistButton({ propertyId, size = 14, className = "" }) {
  const router = useRouter();
  const [, rerender] = useState(0);
  const [busy, setBusy] = useState(false);

  // Load the wishlist once and re-render whenever it changes.
  useEffect(() => {
    loadWishlist();
    return subscribe(() => rerender((n) => n + 1));
  }, []);

  const fav = isFavorited(propertyId);

  async function onClick(e) {
    e.preventDefault();
    e.stopPropagation();
    if (!getUserToken()) {
      // Remember the property + the page we're on, so login can save it and
      // bring the user right back here (heart already filled).
      setPendingWishlist(propertyId);
      const here = window.location.pathname + window.location.search;
      router.push(`/login?next=${encodeURIComponent(here)}`);
      return;
    }
    if (busy) return;
    setBusy(true);
    try {
      await toggleFavorite(propertyId);
    } catch {
      /* store already rolled back; ignore */
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={fav ? "Remove from wishlist" : "Save to wishlist"}
      aria-pressed={fav}
      className={`flex items-center justify-center rounded-full transition-transform duration-200 hover:scale-110 active:scale-95 ${className}`}
      style={{ width: 32, height: 32, background: "rgba(255,255,255,.92)", backdropFilter: "blur(8px)", boxShadow: "0 2px 8px rgba(30,37,33,.12)" }}
    >
      <Heart size={size} fill={fav ? LIKED : "none"} color={fav ? LIKED : OLIVE} />
    </button>
  );
}
