// ───────────────────────────────────────────────────────────────────────────
// Public landing page  (URL: "/")
// This is a SERVER component, so the property data is fetched on the server
// and rendered into the HTML — great for SEO. Each section is its own small
// component in components/public for easy reading.
// ───────────────────────────────────────────────────────────────────────────

import Navbar from "@/components/public/Navbar";
import Footer from "@/components/public/Footer";
import Hero from "@/components/public/Hero";
import FeaturedListings from "@/components/public/FeaturedListings";
import Features from "@/components/public/Features";
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

export default async function HomePage() {
  const properties = await getFeatured();

  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <FeaturedListings properties={properties} />
        <Features />
        <Testimonials />
        <CTA />
      </main>
      <Footer />
    </>
  );
}
