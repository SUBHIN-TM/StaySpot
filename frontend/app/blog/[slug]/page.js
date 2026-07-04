// Blog article  (URL: "/blog/<slug>")
// Server-rendered SEO content page: its own <title>, meta description, keywords,
// canonical URL, Open Graph, and Article + Breadcrumb structured data.
// NOTE (Next 16): `params` is a Promise and must be awaited.

import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Clock } from "lucide-react";
import Navbar from "@/components/public/Navbar";
import Footer from "@/components/public/Footer";
import { ARTICLES, getArticle, SITE_URL, SITE_NAME } from "@/lib/blog";

// Pre-render every article at build time.
export function generateStaticParams() {
  return ARTICLES.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const a = getArticle(slug);
  if (!a) return { title: "Guide not found" };
  const url = `${SITE_URL}/blog/${a.slug}`;
  return {
    title: a.title,
    description: a.description,
    keywords: a.keywords,
    alternates: { canonical: url },
    openGraph: { title: a.title, description: a.description, url, type: "article" },
  };
}

// Where a call-to-action inside an article should point.
function ctaHref(slug) {
  return slug.includes("roommate") ? "/roommates" : "/properties";
}

export default async function ArticlePage({ params }) {
  const { slug } = await params;
  const a = getArticle(slug);
  if (!a) notFound();

  const url = `${SITE_URL}/blog/${a.slug}`;
  const href = ctaHref(a.slug);
  const related = ARTICLES.filter((x) => x.slug !== a.slug).slice(0, 2);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: a.title,
    description: a.description,
    keywords: a.keywords.join(", "),
    dateModified: a.updated,
    mainEntityOfPage: url,
    author: { "@type": "Organization", name: SITE_NAME },
    publisher: { "@type": "Organization", name: SITE_NAME },
  };
  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Guides", item: `${SITE_URL}/blog` },
      { "@type": "ListItem", position: 2, name: a.title, item: url },
    ],
  };

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-cream">
        <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
          <Link href="/blog" className="inline-flex items-center gap-1.5 text-sm font-medium text-ink/60 transition-colors hover:text-brand">
            <ArrowLeft size={15} /> All guides
          </Link>

          {/* Header */}
          <header className="mt-5">
            <span className="text-xs font-bold uppercase tracking-widest text-gold">{a.category}</span>
            <h1 className="mt-2 text-3xl font-bold leading-tight text-ink sm:text-4xl">{a.title}</h1>
            <p className="mt-3 flex items-center gap-3 text-sm text-ink/45">
              <span className="inline-flex items-center gap-1"><Clock size={13} /> {a.readMins} min read</span>
              <span>Updated {new Date(a.updated).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</span>
            </p>
            <p className="mt-5 text-lg leading-relaxed text-ink/75">{a.hero}</p>
          </header>

          {/* Body */}
          <div className="mt-8 space-y-5">
            {a.blocks.map((b, i) => {
              if (b.h2) return <h2 key={i} className="pt-3 text-xl font-bold text-ink">{b.h2}</h2>;
              if (b.ul)
                return (
                  <ul key={i} className="space-y-2">
                    {b.ul.map((li, j) => (
                      <li key={j} className="flex gap-2.5 text-ink/75">
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />
                        <span className="leading-relaxed">{li}</span>
                      </li>
                    ))}
                  </ul>
                );
              if (b.cta)
                return (
                  <Link
                    key={i}
                    href={href}
                    className="my-2 flex items-center justify-between gap-3 rounded-2xl border border-brand/25 bg-brand/5 px-5 py-4 transition-colors hover:bg-brand/10"
                  >
                    <span className="font-semibold text-brand">{b.cta}</span>
                    <ArrowRight size={18} className="shrink-0 text-brand" />
                  </Link>
                );
              return <p key={i} className="leading-relaxed text-ink/75">{b.p}</p>;
            })}
          </div>

          {/* Related */}
          {related.length > 0 && (
            <div className="mt-12 border-t border-line pt-8">
              <h2 className="text-lg font-bold text-ink">Keep reading</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {related.map((r) => (
                  <Link key={r.slug} href={`/blog/${r.slug}`} className="group rounded-xl border border-line bg-white p-5 transition-all hover:border-brand/40 hover:shadow-sm">
                    <span className="text-[11px] font-bold uppercase tracking-widest text-gold">{r.category}</span>
                    <p className="mt-1.5 font-semibold text-ink group-hover:text-brand">{r.title}</p>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </article>
      </main>
      <Footer />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
    </>
  );
}
