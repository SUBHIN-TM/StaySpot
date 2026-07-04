// Blog / guides index  (URL: "/blog")
// SEO landing page: server-rendered, links to every guide, and describes what
// Parppidam is using the phrases people search for. Crawlable static content.

import Link from "next/link";
import { ArrowRight, BookOpen } from "lucide-react";
import Navbar from "@/components/public/Navbar";
import Footer from "@/components/public/Footer";
import { ARTICLES, SITE_URL, SITE_NAME } from "@/lib/blog";

export const metadata = {
  title: "Guides to renting rooms, PGs and finding roommates in Kerala",
  description:
    "Free guides to finding rooms, PGs, flats and roommates across Kerala with zero brokerage. City guides for Kochi and Thiruvananthapuram, plus tips on verification and sharing rent.",
  keywords: [
    "rooms for rent in Kerala", "PG in Kochi", "PG in Trivandrum",
    "find a roommate in Kerala", "no brokerage rentals Kerala", "flats for rent Kerala",
  ],
  alternates: { canonical: `${SITE_URL}/blog` },
  openGraph: {
    title: "Guides to renting and finding roommates in Kerala | Parppidam",
    description: "Free, practical guides to renting rooms, PGs and flats, and finding roommates across Kerala.",
    url: `${SITE_URL}/blog`,
    type: "website",
  },
};

export default function BlogIndexPage() {
  // Structured data: a list of the guides for richer search results.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: `${SITE_NAME} guides`,
    url: `${SITE_URL}/blog`,
    blogPost: ARTICLES.map((a) => ({
      "@type": "BlogPosting",
      headline: a.title,
      description: a.description,
      url: `${SITE_URL}/blog/${a.slug}`,
      dateModified: a.updated,
    })),
  };

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-cream">
        <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
          {/* Hero */}
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-brand/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-brand">
              <BookOpen size={13} /> Guides
            </span>
            <h1 className="mt-4 text-3xl font-bold leading-tight text-ink sm:text-4xl">
              Renting and finding roommates in Kerala, made simple
            </h1>
            <p className="mt-3 text-ink/65">
              Parppidam helps you find your next stay, roommate or rental space in minutes, with
              zero brokerage and verified owners. These guides cover rooms, PGs, flats and shared
              homes across Kochi, Thiruvananthapuram and the rest of Kerala.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link href="/properties" className="inline-flex items-center gap-1.5 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-dark">
                Browse listings <ArrowRight size={15} />
              </Link>
              <Link href="/roommates" className="inline-flex items-center gap-1.5 rounded-xl border border-brand/40 px-4 py-2.5 text-sm font-semibold text-brand transition-colors hover:bg-brand/5">
                Find roommates
              </Link>
            </div>
          </div>

          {/* Article grid */}
          <div className="mt-12 grid gap-5 sm:grid-cols-2">
            {ARTICLES.map((a) => (
              <Link
                key={a.slug}
                href={`/blog/${a.slug}`}
                className="group flex flex-col rounded-2xl border border-line bg-white p-6 shadow-sm transition-all hover:border-brand/40 hover:shadow-md"
              >
                <span className="text-xs font-bold uppercase tracking-widest text-gold">{a.category}</span>
                <h2 className="mt-2 text-lg font-bold text-ink group-hover:text-brand">{a.title}</h2>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-ink/60">{a.description}</p>
                <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand">
                  Read guide <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </main>
      <Footer />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </>
  );
}
