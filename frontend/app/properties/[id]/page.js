// ───────────────────────────────────────────────────────────────────────────
// Property detail page  (URL: "/properties/<id>")
// The main page where a seeker views a listing and connects with the owner.
// SERVER component → SEO-friendly.  NOTE (Next 16): `params` is a Promise.
// ───────────────────────────────────────────────────────────────────────────

import Link from "next/link";
import {
  ArrowLeft, MapPin, ShieldCheck, Users, Home, BadgeCheck, Map as MapIcon, Info,
} from "lucide-react";
import Navbar from "@/components/public/Navbar";
import Footer from "@/components/public/Footer";
import ImageCarousel from "@/components/public/ImageCarousel";
import ContactOwnerButton from "@/components/public/ContactOwnerButton";
import WishlistButton from "@/components/public/WishlistButton";
import AvatarPopover from "@/components/public/AvatarPopover";
import { apiGet } from "@/lib/api";
import {
  AMENITY_LABEL, AMENITY_ICON, AMENITY_FALLBACK_ICON,
  FURNISHING_LABEL, PETS_LABEL, ELECTRICITY_LABEL, PREFERRED_TENANT_LABEL, FOOD_LABEL,
  PROPERTY_TYPE_LABEL,
} from "@/lib/listingMeta";

const OCCUPANCY = {
  available: { label: "Available", dot: "#16a34a", cls: "bg-green-100 text-green-700" },
  partially_occupied: { label: "Partially occupied", dot: "#d97706", cls: "bg-amber-100 text-amber-700" },
  occupied: { label: "Occupied", dot: "#dc2626", cls: "bg-red-100 text-red-700" },
};

async function getProperty(id) {
  try {
    const data = await apiGet(`/properties/${id}`);
    return data?.property || null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }) {
  const { id } = await params;
  const p = await getProperty(id);
  if (!p) return { title: "Listing not found" };
  return {
    title: p.title,
    description: p.description || `${p.property_type} in ${p.city || "your city"} on Parppidam.`,
  };
}

// A titled white card section.
function Section({ title, icon: Icon, children }) {
  return (
    <section className="rounded-2xl border border-line bg-white p-6 shadow-sm sm:p-7">
      <h2 className="flex items-center gap-2 text-lg font-bold text-ink">
        {Icon && <Icon size={18} className="text-brand" />} {title}
      </h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

// A key-fact tile (icon chip + label + value).
function Fact({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-line bg-white px-4 py-3">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand/10 text-brand">
        <Icon size={17} />
      </span>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-ink/45">{label}</p>
        <p className="truncate text-sm font-semibold capitalize text-ink">{value}</p>
      </div>
    </div>
  );
}

export default async function PropertyDetailPage({ params }) {
  const { id } = await params;
  const p = await getProperty(id);

  if (!p) {
    return (
      <>
        <Navbar />
        <main className="grid min-h-[60vh] place-items-center bg-cream px-4 text-center">
          <div>
            <h1 className="text-2xl font-bold text-ink">Listing not found</h1>
            <p className="mt-2 text-ink/55">It may have been removed or is no longer available.</p>
            <Link href="/properties" className="mt-6 inline-flex items-center gap-1.5 font-semibold text-brand hover:underline">
              <ArrowLeft size={16} /> Back to listings
            </Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const imageUrls = (p.images || []).map((img) => img.image_url).filter(Boolean);
  const occ = OCCUPANCY[p.occupancy_status] || OCCUPANCY.available;
  const rent = `₹${Number(p.rent_amount).toLocaleString("en-IN")}`;
  const typeLabel = PROPERTY_TYPE_LABEL[p.property_type] || p.property_type;
  const location = [p.address, p.landmark, p.city, p.district, p.state].filter(Boolean).join(", ") || "—";

  const amenities = (p.amenities || []).map((a) => ({
    key: a, Icon: AMENITY_ICON[a] || AMENITY_FALLBACK_ICON, label: AMENITY_LABEL[a] || a,
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
      <main className="min-h-screen bg-cream">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
          <Link href="/properties" className="inline-flex items-center gap-1.5 text-sm font-medium text-ink/60 transition-colors hover:text-brand">
            <ArrowLeft size={15} /> Back to listings
          </Link>

          {/* Gallery */}
          <div className="relative mt-4 overflow-hidden rounded-3xl border border-line shadow-sm">
            <ImageCarousel images={imageUrls} alt={p.title} heightClass="h-72 sm:h-[26rem]" />
            {/* Badges over the image */}
            <div className="pointer-events-none absolute left-4 top-4 flex flex-wrap items-center gap-2">
              <span className="rounded-full px-3 py-1 text-xs font-bold text-white" style={{ background: "rgba(30,37,33,.72)" }}>
                {typeLabel}
              </span>
              <span className="rounded-full px-3 py-1 text-xs font-bold text-white" style={{ background: occ.dot }}>
                {occ.label}
              </span>
              {p.field_visited && (
                <span className="inline-flex items-center gap-1 rounded-full bg-white/95 px-3 py-1 text-xs font-bold text-[#2E8B57] shadow">
                  <ShieldCheck size={13} /> Verified by our team
                </span>
              )}
            </div>
            <div className="absolute right-4 top-4">
              <WishlistButton propertyId={p.id} size={17} />
            </div>
          </div>

          {/* Video */}
          {p.video_url && (
            <video
              src={p.video_url}
              controls
              className="mt-4 w-full rounded-2xl border border-line bg-black"
              style={{ maxHeight: "26rem" }}
            />
          )}

          {/* Title */}
          <div className="mt-7">
            <h1 className="text-2xl font-bold leading-tight text-ink sm:text-3xl">{p.title}</h1>
            <p className="mt-2 flex items-start gap-1.5 text-ink/60">
              <MapPin size={16} className="mt-0.5 shrink-0 text-gold" />
              <span>{location}{p.pincode ? ` · ${p.pincode}` : ""}</span>
            </p>
          </div>

          <div className="mt-7 grid items-start gap-7 lg:grid-cols-[1fr_360px]">
            {/* Main column */}
            <div className="space-y-6">
              {/* Key facts */}
              <div className="grid gap-3 sm:grid-cols-3">
                <Fact icon={Home} label="Type" value={typeLabel} />
                <Fact icon={Users} label="Capacity" value={`${p.max_persons || 1} ${p.max_persons === 1 ? "person" : "persons"}`} />
                <Fact icon={BadgeCheck} label="Status" value={occ.label} />
              </div>

              {p.description && (
                <Section title="About this place" icon={Info}>
                  <p className="whitespace-pre-line leading-relaxed text-ink/70">{p.description}</p>
                </Section>
              )}

              {amenities.length > 0 && (
                <Section title="Amenities" icon={Sparkle}>
                  <div className="grid gap-2.5 sm:grid-cols-2">
                    {amenities.map(({ key, Icon, label }) => (
                      <div key={key} className="flex items-center gap-3 rounded-xl bg-mist/60 px-3.5 py-2.5">
                        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-brand/10 text-brand">
                          <Icon size={16} strokeWidth={2} />
                        </span>
                        <span className="text-sm font-medium text-ink/80">{label}</span>
                      </div>
                    ))}
                  </div>
                </Section>
              )}

              {policies.length > 0 && (
                <Section title="Good to know" icon={Info}>
                  <dl className="grid gap-x-8 sm:grid-cols-2">
                    {policies.map((row) => (
                      <div key={row.label} className="flex items-center justify-between border-b border-line py-2.5">
                        <dt className="text-sm text-ink/55">{row.label}</dt>
                        <dd className="text-sm font-semibold text-ink">{row.value}</dd>
                      </div>
                    ))}
                  </dl>
                </Section>
              )}

              {p.map_link && (
                <Section title="Location" icon={MapPin}>
                  <p className="text-sm text-ink/70">{location}{p.pincode ? ` · ${p.pincode}` : ""}</p>
                  <a
                    href={p.map_link}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-4 inline-flex items-center gap-2 rounded-xl border border-brand/40 px-4 py-2.5 text-sm font-semibold text-brand transition-colors hover:bg-brand/5"
                  >
                    <MapIcon size={16} /> Open in Google Maps
                  </a>
                </Section>
              )}
            </div>

            {/* Sticky sidebar */}
            <aside className="lg:sticky lg:top-24">
              <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-sm">
                {/* Price */}
                <div className="border-b border-line p-6">
                  <p className="text-xs font-semibold uppercase tracking-wide text-ink/45">Monthly rent</p>
                  <div className="mt-1 flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-brand">{rent}</span>
                    <span className="text-sm font-medium text-ink/50">/ month</span>
                  </div>
                </div>

                {/* Owner */}
                <div className="p-6">
                  <p className="text-xs font-semibold uppercase tracking-wide text-ink/45">Listed by</p>
                  <div className="mt-2.5 flex items-center gap-3">
                    <AvatarPopover user={p.owner} className="shrink-0">
                      {p.owner?.avatar_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.owner.avatar_url} alt="" referrerPolicy="no-referrer" className="h-11 w-11 rounded-full object-cover ring-2 ring-line" />
                      ) : (
                        <span className="grid h-11 w-11 place-items-center rounded-full bg-brand text-base font-bold text-white">
                          {(p.owner?.name || "U").charAt(0).toUpperCase()}
                        </span>
                      )}
                    </AvatarPopover>
                    <div className="min-w-0">
                      <p className="truncate font-semibold capitalize text-ink">{p.owner?.name || "Owner"}</p>
                      {p.owner?.phone_verified ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-[#2E8B57]">
                          <ShieldCheck size={13} /> Verified owner
                        </span>
                      ) : (
                        <span className="text-xs text-ink/40">Owner on Parppidam</span>
                      )}
                    </div>
                  </div>

                  {p.owner?.id && (
                    <div className="mt-5">
                      <ContactOwnerButton ownerId={p.owner.id} propertyId={p.id} />
                    </div>
                  )}

                  <p className="mt-4 flex items-start gap-1.5 text-xs leading-relaxed text-ink/45">
                    <Info size={13} className="mt-0.5 shrink-0" />
                    For your safety, always visit the place in person and never pay before you see it.
                  </p>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

// A small four-point sparkle used as the Amenities heading icon.
function Sparkle({ size = 18, className }) {
  return (
    <svg width={size} height={size} className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3z" />
    </svg>
  );
}
