// ───────────────────────────────────────────────────────────────────────────
// Public landing page  (URL: "/")
// SERVER component: listings + live stats are fetched on the server (good SEO)
// and passed into the section components. Each section lives in its own small
// file under components/public. Sunset palette + scroll/looping animations.
// ───────────────────────────────────────────────────────────────────────────

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

// Fetch the latest 6 listings to feature. If the backend is offline we just
// show an empty state instead of crashing the page.
async function getFeatured() {
  try {
    const data = await apiGet("/properties?limit=6");
    return data?.properties || [];
  } catch {
    return [];
  }
}

// Live counts for the hero + stats band (listings / seekers / owners). Falls
// back to zeros if the backend is offline so the page still renders.
async function getStats() {
  try {
    return await apiGet("/stats");
  } catch {
    return { listings: 0, seekers: 0, owners: 0 };
  }
}

// Real user reviews for the testimonials section. Empty list if backend is down.
async function getReviews() {
  try {
    const data = await apiGet("/reviews?limit=12");
    return data?.reviews || [];
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const [properties, stats, reviews] = await Promise.all([
    getFeatured(),
    getStats(),
    getReviews(),
  ]);

  return (
    <>
      <Navbar />
      <main className="bg-cream">
        <Hero />
        <Marquee />
        <Audience />
        <FeaturedListings properties={properties} />
        <HowItWorks />
        <Features />
        <StatsBand stats={stats} />
        <Testimonials initialReviews={reviews} />
        <CTA />
      </main>
      <Footer />
    </>
  );
}
