// ───────────────────────────────────────────────────────────────────────────
// Public landing page  (URL: "/")
// SERVER component. The navbar + hero render and stream to the browser IMMEDIATELY;
// the three data-backed sections (featured listings, stats, testimonials) each
// fetch their own data inside a <Suspense> boundary, so a slow backend can never
// hold up the top of the page — React streams each section in when it's ready.
// Each visual section lives in its own small file under components/public.
// ───────────────────────────────────────────────────────────────────────────

import { Suspense } from "react";
import Navbar from "@/components/public/Navbar";
import Footer from "@/components/public/Footer";
import Hero from "@/components/public/Hero";
import Marquee from "@/components/public/Marquee";
import Audience from "@/components/public/Audience";
import FeaturedListings from "@/components/public/FeaturedListings";
import HowItWorks from "@/components/public/HowItWorks";
import Features from "@/components/public/Features";
import StatsBand from "@/components/public/StatsBand";
import Testimonials from "@/components/public/Testimonials";
import CTA from "@/components/public/CTA";
import { apiGet } from "@/lib/api";

// ── Data-backed sections ────────────────────────────────────────────────────
// Each is its own async server component so it fetches independently and streams
// in as soon as ITS data is ready (they do not block each other or the hero).
// If the backend is offline we render the section's empty state instead of
// crashing the page (the warning is logged to the server terminal).

async function FeaturedSection() {
  let properties = [];
  try {
    const data = await apiGet("/properties?limit=6");
    properties = data?.properties || [];
  } catch (err) {
    console.warn("[home] failed to load featured listings:", err?.message || err);
  }
  return <FeaturedListings properties={properties} />;
}

async function StatsSection() {
  let stats = { listings: 0, seekers: 0, owners: 0 };
  try {
    stats = await apiGet("/stats");
  } catch (err) {
    console.warn("[home] failed to load stats:", err?.message || err);
  }
  return <StatsBand stats={stats} />;
}

async function TestimonialsSection() {
  let reviews = [];
  let prefillEnabled = true;
  try {
    const data = await apiGet("/reviews?limit=12");
    reviews = data?.reviews || [];
    prefillEnabled = data?.prefillEnabled !== false;
  } catch (err) {
    console.warn("[home] failed to load reviews:", err?.message || err);
  }
  return <Testimonials initialReviews={reviews} prefillEnabled={prefillEnabled} />;
}

// ── Skeleton placeholders shown while each section streams ───────────────────
// They reserve roughly the same space + section background as the real content
// so there's no jarring layout shift when the data arrives.

function Block({ className = "", style }) {
  return <div className={`animate-pulse rounded-2xl ${className}`} style={{ background: "rgba(30,37,33,.07)", ...style }} />;
}

function FeaturedSkeleton() {
  return (
    <section className="py-24 px-6" style={{ background: "var(--color-mist)" }}>
      <div className="max-w-6xl mx-auto">
        <div className="mb-12">
          <Block className="h-4 w-40 mb-3" />
          <Block className="h-9 w-64" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Block key={i} className="h-[360px] w-full rounded-3xl" />
          ))}
        </div>
      </div>
    </section>
  );
}

function StatsSkeleton() {
  return (
    <section className="py-24 px-6 text-center" style={{ background: "var(--color-cream)" }}>
      <div className="max-w-4xl mx-auto">
        <Block className="h-4 w-32 mx-auto mb-4" />
        <Block className="h-10 w-80 max-w-full mx-auto mb-16" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center">
              <Block className="h-14 w-24 mb-3" />
              <Block className="h-4 w-20" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function TestimonialsSkeleton() {
  return (
    <section className="py-24 px-6" style={{ background: "var(--color-mist)" }}>
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <Block className="h-4 w-36 mx-auto mb-3" />
          <Block className="h-9 w-96 max-w-full mx-auto" />
        </div>
        <Block className="mx-auto mb-12 h-56 max-w-2xl rounded-3xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <Block key={i} className="h-52 w-full rounded-3xl" />
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────
// Not async: the hero + static sections don't await anything, so they stream
// first. The Suspense-wrapped sections fill in behind them.

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main className="bg-cream">
        <Hero />
        <Marquee />
        <Audience />

        <Suspense fallback={<FeaturedSkeleton />}>
          <FeaturedSection />
        </Suspense>

        <HowItWorks />
        <Features />

        <Suspense fallback={<StatsSkeleton />}>
          <StatsSection />
        </Suspense>

        <Suspense fallback={<TestimonialsSkeleton />}>
          <TestimonialsSection />
        </Suspense>

        <CTA />
      </main>
      <Footer />
    </>
  );
}
