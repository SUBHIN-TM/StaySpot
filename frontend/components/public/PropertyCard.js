// A single property card used in listings grids.
// `property` is one item from GET /api/properties. Styled to match the design:
// rounded white card, a type badge, a "Verified" tag, location, price and a
// View Details button. Kept as a server component (no client state needed).

import Link from "next/link";
import { MapPin, ShieldCheck } from "lucide-react";
import { imageUrl } from "@/lib/api";
import ImageCarousel from "./ImageCarousel";
import WishlistButton from "./WishlistButton";
import { SAGE, GOLD, OLIVE, SUCCESS } from "./palette";

// Show rent like "₹18,000".
function formatRent(amount) {
  return `₹${Number(amount).toLocaleString("en-IN")}`;
}

// Badge tint per property type (falls back to sage).
const TYPE_COLOR = {
  flat: GOLD,
  apartment: GOLD,
  room: SAGE,
  house: "#7B9E87",
  pg: SUCCESS,
  studio: "#8B7355",
  hostel: "#8B7355",
};

export default function PropertyCard({ property }) {
  const imageUrls = (property.images || [])
    .map((img) => img.image_url || imageUrl(img.image_key))
    .filter(Boolean);

  const type = property.property_type || "";
  const badgeColor = TYPE_COLOR[type.toLowerCase()] || SAGE;
  const place = [property.city, property.district].filter(Boolean).join(", ") || "—";

  return (
    <Link
      href={`/properties/${property.id}`}
      className="group block rounded-3xl overflow-hidden bg-white transition-all duration-300 hover:-translate-y-1.5"
      style={{ border: "1px solid var(--color-line)", boxShadow: "0 4px 20px rgba(30,37,33,.07)" }}
    >
      {/* Image + badges */}
      <div className="relative overflow-hidden" style={{ height: 215, background: "var(--color-line)" }}>
        <div className="h-full transition-transform duration-700 group-hover:scale-105">
          <ImageCarousel images={imageUrls} alt={property.title} heightClass="h-[215px]" />
        </div>
        {type && (
          <span className="absolute top-3 left-3 z-10 px-3 py-1 rounded-full text-xs font-bold text-white capitalize" style={{ background: badgeColor }}>
            {type} Available
          </span>
        )}
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
          <div className="flex items-center gap-1">
            <ShieldCheck size={12} color={SUCCESS} />
            <span className="text-xs font-medium" style={{ color: SUCCESS }}>Verified</span>
          </div>
        </div>
        <span
          className="block w-full py-2.5 rounded-2xl text-sm font-semibold text-white text-center transition-transform group-hover:scale-[1.02]"
          style={{ background: SAGE }}
        >
          View Details
        </span>
      </div>
    </Link>
  );
}
