// ───────────────────────────────────────────────────────────────────────────
// Property detail page  (URL: "/properties/<id>")
// Full view a seeker sees when they click a listing: image gallery, video,
// all details, map link, and owner contact. SERVER component → SEO-friendly.
// NOTE (Next 16): `params` is a Promise and must be awaited.
// ───────────────────────────────────────────────────────────────────────────

import Link from "next/link";
import Navbar from "@/components/public/Navbar";
import Footer from "@/components/public/Footer";
import ImageCarousel from "@/components/public/ImageCarousel";
import ContactOwnerButton from "@/components/public/ContactOwnerButton";
import { apiGet } from "@/lib/api";
import {
  AMENITY_LABEL,
  AMENITY_ICON,
  AMENITY_FALLBACK_ICON,
  FURNISHING_LABEL,
  PETS_LABEL,
  ELECTRICITY_LABEL,
  PREFERRED_TENANT_LABEL,
  FOOD_LABEL,
} from "@/lib/listingMeta";

const OCCUPANCY = {
  available: { label: "Available", cls: "bg-green-100 text-green-700" },
  partially_occupied: { label: "Partially occupied", cls: "bg-amber-100 text-amber-700" },
  occupied: { label: "Occupied", cls: "bg-slate-200 text-slate-600" },
};

async function getProperty(id) {
  try {
    const data = await apiGet(`/properties/${id}`);
    return data?.property || null;
  } catch {
    return null;
  }
}

// SEO: use the property title/description for this page's metadata.
export async function generateMetadata({ params }) {
  const { id } = await params;
  const p = await getProperty(id);
  if (!p) return { title: "Listing not found" };
  return {
    title: p.title,
    description: p.description || `${p.property_type} in ${p.city || "your city"} on StayMate.`,
  };
}

export default async function PropertyDetailPage({ params }) {
  const { id } = await params;
  const p = await getProperty(id);

  if (!p) {
    return (
      <>
        <Navbar />
        <main className="mx-auto max-w-3xl px-4 py-20 text-center">
          <h1 className="text-2xl font-bold text-slate-900">Listing not found</h1>
          <p className="mt-2 text-slate-500">It may have been removed or is no longer available.</p>
          <Link href="/properties" className="mt-6 inline-block font-semibold text-brand hover:underline">
            ← Back to listings
          </Link>
        </main>
        <Footer />
      </>
    );
  }

  const imageUrls = (p.images || []).map((img) => img.image_url).filter(Boolean);
  const occ = OCCUPANCY[p.occupancy_status] || OCCUPANCY.available;
  const rent = `₹${Number(p.rent_amount).toLocaleString("en-IN")}`;

  // Amenities the owner ticked (with icons), and the "good to know" policy rows
  // that were actually set.
  const amenities = (p.amenities || []).map((a) => ({
    key: a,
    Icon: AMENITY_ICON[a] || AMENITY_FALLBACK_ICON,
    label: AMENITY_LABEL[a] || a,
  }));
  const policies = [
    p.furnishing && { label: "Furnishing", value: FURNISHING_LABEL[p.furnishing] },
    p.preferred_tenant && { label: "Preferred tenant", value: PREFERRED_TENANT_LABEL[p.preferred_tenant] },
    p.electricity_billing && { label: "Electricity", value: ELECTRICITY_LABEL[p.electricity_billing] },
    p.pets_allowed && { label: "Pets", value: PETS_LABEL[p.pets_allowed] },
    p.food_included && { label: "Food", value: FOOD_LABEL[p.food_included] },
  ].filter(Boolean);

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <Link href="/properties" className="text-sm font-medium text-brand hover:underline">
          ← Back to listings
        </Link>

        {/* Gallery */}
        <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200">
          <ImageCarousel images={imageUrls} alt={p.title} heightClass="h-72 sm:h-96" />
        </div>

        {/* Video */}
        {p.video_url && (
          <video
            src={p.video_url}
            controls
            className="mt-4 w-full rounded-2xl border border-slate-200 bg-black"
            style={{ maxHeight: "24rem" }}
          />
        )}

        <div className="mt-6 grid gap-8 lg:grid-cols-3">
          {/* Main details */}
          <div className="lg:col-span-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold capitalize text-brand">
                {p.property_type}
              </span>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${occ.cls}`}>
                {occ.label}
              </span>
              {p.max_persons ? (
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                  👥 {p.max_persons} persons
                </span>
              ) : null}
            </div>

            <h1 className="mt-4 text-3xl font-bold text-slate-900">{p.title}</h1>
            <p className="mt-2 text-slate-500">
              📍 {[p.address, p.landmark, p.city, p.district, p.state].filter(Boolean).join(", ") || "—"}
              {p.pincode ? ` - ${p.pincode}` : ""}
            </p>

            {p.description && (
              <div className="mt-6">
                <h2 className="text-lg font-semibold text-slate-900">About this place</h2>
                <p className="mt-2 whitespace-pre-line text-slate-600">{p.description}</p>
              </div>
            )}

            {amenities.length > 0 && (
              <div className="mt-6">
                <h2 className="text-lg font-semibold text-slate-900">Amenities</h2>
                <div className="mt-3 flex flex-wrap gap-2">
                  {amenities.map(({ key, Icon, label }) => (
                    <span
                      key={key}
                      className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700"
                    >
                      <Icon size={15} strokeWidth={2} />
                      {label}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {policies.length > 0 && (
              <div className="mt-6">
                <h2 className="text-lg font-semibold text-slate-900">Good to know</h2>
                <dl className="mt-3 grid gap-x-8 gap-y-2 sm:grid-cols-2">
                  {policies.map((row) => (
                    <div key={row.label} className="flex justify-between border-b border-slate-100 py-1.5">
                      <dt className="text-sm text-slate-500">{row.label}</dt>
                      <dd className="text-sm font-medium text-slate-800">{row.value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}

            {p.map_link && (
              <a
                href={p.map_link}
                target="_blank"
                rel="noreferrer"
                className="mt-6 inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                🗺️ View location on Google Maps
              </a>
            )}
          </div>

          {/* Sidebar: price + owner contact */}
          <aside className="lg:col-span-1">
            <div className="rounded-2xl border border-slate-200 p-6 shadow-sm">
              <div className="text-3xl font-bold text-brand">
                {rent}
                <span className="text-base font-normal text-slate-500"> / month</span>
              </div>

              <div className="mt-6 border-t border-slate-100 pt-4">
                <p className="text-xs text-slate-500">Listed by</p>
                <div className="mt-2 flex items-center gap-3">
                  {p.owner?.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.owner.avatar_url} alt="" referrerPolicy="no-referrer" className="h-10 w-10 rounded-full object-cover" />
                  ) : (
                    <span className="grid h-10 w-10 place-items-center rounded-full bg-brand font-bold text-white">
                      {(p.owner?.name || "U").charAt(0).toUpperCase()}
                    </span>
                  )}
                  <span className="font-medium capitalize text-slate-900">{p.owner?.name || "Owner"}</span>
                  {/* Green tick = this owner's phone was verified by our team. */}
                  {p.owner?.phone_verified && (
                    <span
                      title="Verified owner"
                      className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700"
                    >
                      ✓ Verified
                    </span>
                  )}
                </div>

                {p.owner?.id && <ContactOwnerButton ownerId={p.owner.id} propertyId={p.id} />}
              </div>
            </div>
          </aside>
        </div>
      </main>
      <Footer />
    </>
  );
}
