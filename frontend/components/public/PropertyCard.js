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
      className="block overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:shadow-lg"
    >
      {/* Swipeable image gallery with dots */}
      <div className="relative">
        <ImageCarousel images={imageUrls} alt={property.title} heightClass="h-48" />
        <span className="absolute left-3 top-3 z-10 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold capitalize text-slate-700">
          {property.property_type}
        </span>
      </div>

      {/* Details */}
      <div className="p-4">
        <h3 className="line-clamp-1 text-lg font-semibold text-slate-900">{property.title}</h3>
        <p className="mt-1 line-clamp-1 text-sm text-slate-500">
          📍 {property.address ? `${property.address}, ` : ""}
          {property.city || "—"}
        </p>
        <div className="mt-4 flex items-center justify-between">
          <span className="text-lg font-bold text-brand">
            {formatRent(property.rent_amount)}
            <span className="text-sm font-normal text-slate-500"> / mo</span>
          </span>
          {property.owner?.name && (
            <span className="text-xs text-slate-400">by {property.owner.name}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
