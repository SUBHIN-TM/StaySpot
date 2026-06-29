// A single property card used in listings grids.
// `property` is one item from GET /api/properties. Styled to match the design:
// rounded white card, a type badge, a "Verified" tag, location, price and a
// View Details button. Kept as a server component (no client state needed).

import Link from "next/link";
import { MapPin, ShieldCheck, Users } from "lucide-react";
import { imageUrl } from "@/lib/api";
import ImageCarousel from "./ImageCarousel";
import WishlistButton from "./WishlistButton";
import { SAGE, GOLD, OLIVE, SUCCESS } from "./palette";
import {
  AMENITY_LABEL,
  AMENITY_ICON,
  AMENITY_FALLBACK_ICON,
  FURNISHING_ICON,
  FURNISHING_SHORT,
} from "@/lib/listingMeta";

// Show rent like "₹18,000".
function formatRent(amount) {
  return `₹${Number(amount).toLocaleString("en-IN")}`;
}

// Top-left badge shows the rental's CURRENT occupancy status, with only three
// colours: green = available, yellow = partially occupied, red = occupied.
const OCCUPANCY = {
  available: { label: "Available", color: "#16a34a" },          // green
  partially_occupied: { label: "Partially Occupied", color: "#d97706" }, // yellow/amber
  occupied: { label: "Occupied", color: "#dc2626" },            // red
};

export default function PropertyCard({ property }) {
  const imageUrls = (property.images || [])
    .map((img) => img.image_url || imageUrl(img.image_key))
    .filter(Boolean);

  const type = property.property_type || "";
  const occ = OCCUPANCY[property.occupancy_status] || OCCUPANCY.available;
  const place = [property.city, property.district].filter(Boolean).join(", ") || "—";

  // A balanced set of feature chips for the card (max 4): capacity first (max
  // persons), then furnishing, then amenities. FULL list lives on the detail page.
  const featureChips = [];
  if (property.max_persons) {
    featureChips.push({
      key: "persons",
      Icon: Users,
      label: `${property.max_persons} ${property.max_persons === 1 ? "person" : "persons"}`,
    });
  }
  if (property.furnishing) {
    featureChips.push({
      key: "furnishing",
      Icon: FURNISHING_ICON,
      label: FURNISHING_SHORT[property.furnishing] || "Furnished",
    });
  }
  for (const a of property.amenities || []) {
    if (featureChips.length >= 4) break;
    featureChips.push({ key: a, Icon: AMENITY_ICON[a] || AMENITY_FALLBACK_ICON, label: AMENITY_LABEL[a] || a });
  }
  const totalFeatures =
    (property.amenities || []).length + (property.furnishing ? 1 : 0) + (property.max_persons ? 1 : 0);
  const moreFeatures = totalFeatures - featureChips.length;

  return (
    <Link
      href={`/properties/${property.id}`}
      // On hover we only HIGHLIGHT the card (brand outline + stronger shadow) —
      // no zoom or movement. The base border/shadow are inline styles, so the
      // highlight uses `outline` (a separate property that follows the radius).
      className="group/card block rounded-3xl overflow-hidden bg-white transition-all duration-300 shadow-[0_4px_20px_rgba(30,37,33,.07)] hover:outline hover:outline-2 hover:[outline-color:var(--color-brand)] hover:shadow-[0_10px_30px_rgba(30,37,33,.16)]"
      style={{ border: "1px solid var(--color-line)" }}
    >
      {/* Image + badges. The zoom-on-hover is applied to the image itself
          (inside the carousel) — NOT to a wrapper — so the arrows don't scale
          out to the card edges. */}
      <div className="relative overflow-hidden" style={{ height: 215, background: "var(--color-line)" }}>
        <ImageCarousel images={imageUrls} alt={property.title} heightClass="h-[215px]" />
        {/* Top-left badges in a single row: rental TYPE first (neutral pill),
            then the colour-coded occupancy STATUS. */}
        <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5">
          {type && (
            <span className="px-3 py-1 rounded-full text-xs font-bold text-white capitalize" style={{ background: "rgba(30,37,33,.72)" }}>
              {type}
            </span>
          )}
          <span className="px-3 py-1 rounded-full text-xs font-bold text-white" style={{ background: occ.color }}>
            {occ.label}
          </span>
        </div>
        {/* Wishlist heart (saves the property to the user's favorites) */}
        <div className="absolute top-3 right-3 z-10">
          <WishlistButton propertyId={property.id} />
        </div>
      </div>

      {/* Details */}
      <div className="p-5">
        <div className="flex items-center gap-1 mb-2">
          <MapPin size={11} color={GOLD} />
          <span className="text-xs line-clamp-1" style={{ color: "#7A8A83" }}>{place}</span>
        </div>
        <h3 className="font-bold text-base mb-2 line-clamp-1" style={{ color: OLIVE }}>{property.title}</h3>
        <div className="flex items-center justify-between mb-4">
          <span className="text-lg font-bold" style={{ color: SAGE }}>
            {formatRent(property.rent_amount)}
            <span className="text-xs font-normal" style={{ color: "#9AA6A0" }}> / mo</span>
          </span>
          {/* "Verified" shield shows ONLY when our team has physically visited
              the place (admin field-visit). Approved-but-not-visited = no shield. */}
          {property.field_visited && (
            <div className="flex items-center gap-1">
              <ShieldCheck size={12} color={SUCCESS} />
              <span className="text-xs font-medium" style={{ color: SUCCESS }}>Verified</span>
            </div>
          )}
        </div>
        {/* A few feature chips (icon + label) — full list on the detail page. */}
        {featureChips.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {featureChips.map(({ key, Icon, label }) => (
              <span
                key={key}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium"
                style={{ background: "var(--color-line)", color: "#5B6B63" }}
              >
                <Icon size={12} strokeWidth={2} />
                {label}
              </span>
            ))}
            {moreFeatures > 0 && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-[11px] font-medium" style={{ color: "#9AA6A0" }}>
                +{moreFeatures} more
              </span>
            )}
          </div>
        )}
        <span
          className="block w-full py-2.5 rounded-2xl text-sm font-semibold text-white text-center"
          style={{ background: SAGE }}
        >
          View Details
        </span>
      </div>
    </Link>
  );
}
