// A single property card used in listings grids.
// `property` is one item from GET /api/properties.

import Link from "next/link";
import { imageUrl } from "@/lib/api";
import ImageCarousel from "./ImageCarousel";

// Show rent like "₹18,000 / mo".
function formatRent(amount) {
  return `₹${Number(amount).toLocaleString("en-IN")}`;
}

export default function PropertyCard({ property }) {
  // All image URLs for this property (used by the swipeable carousel).
  const imageUrls = (property.images || [])
    .map((img) => img.image_url || imageUrl(img.image_key))
    .filter(Boolean);

  return (
    <Link
      href={`/properties/${property.id}`}
      className="block overflow-hidden rounded-2xl border border-ink/10 bg-white transition hover:-translate-y-1 hover:shadow-xl hover:shadow-grape/10"
    >
      {/* Swipeable image gallery with dots */}
      <div className="relative">
        <ImageCarousel images={imageUrls} alt={property.title} heightClass="h-48" />
        <span className="absolute left-3 top-3 z-10 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold capitalize text-ink/70 backdrop-blur">
          {property.property_type}
        </span>
      </div>

      {/* Details */}
      <div className="p-4">
        <h3 className="line-clamp-1 text-lg font-semibold text-ink">{property.title}</h3>
        <p className="mt-1 line-clamp-1 text-sm text-ink/50">
          📍 {[property.city, property.district].filter(Boolean).join(", ") || "—"}
        </p>
        <div className="mt-4 flex items-center justify-between">
          <span className="text-lg font-bold text-coral">
            {formatRent(property.rent_amount)}
            <span className="text-sm font-normal text-ink/50"> / mo</span>
          </span>
          {property.owner?.name && (
            <span className="text-xs text-ink/40">by {property.owner.name}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
