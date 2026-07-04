// ───────────────────────────────────────────────────────────────────────────
// Roommate / people-finder page  (URL: "/roommates")
// People post "looking for a roommate / room to share" requirements; anyone can
// browse them and message the poster. SERVER component → SEO-friendly.
// ───────────────────────────────────────────────────────────────────────────

import Link from "next/link";
import { Users, Plus, Sparkles } from "lucide-react";
import Navbar from "@/components/public/Navbar";
import Footer from "@/components/public/Footer";
import RoommateFilters from "@/components/public/RoommateFilters";
import { apiGet } from "@/lib/api";

export const metadata = {
  title: "Find roommates & room-sharing partners",
  description:
    "Browse roommate requirements or post your own. Find compatible people to share a room or flat with on Parppidam.",
};

async function getPosts() {
  try {
    const data = await apiGet("/roommate-posts?limit=50");
    return data?.posts || [];
  } catch {
    return [];
  }
}

export default async function RoommatesPage() {
  const posts = await getPosts();

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-cream">
        <div className="mx-auto max-w-[1320px] px-4 py-10 sm:px-6 lg:px-10">
          {/* Premium gradient hero header */}
          <div className="relative overflow-hidden rounded-3xl p-8 text-white shadow-[0_20px_50px_rgba(74,90,80,0.25)] sm:p-10"
               style={{ background: "linear-gradient(135deg, #4A5A50 0%, #3C4A41 55%, #2A332C 100%)" }}>
            {/* Glow orbs */}
            <span className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full" style={{ background: "radial-gradient(circle, rgba(212,163,89,0.35), transparent 70%)" }} />
            <span className="pointer-events-none absolute -bottom-20 left-10 h-56 w-56 rounded-full" style={{ background: "radial-gradient(circle, rgba(212,163,89,0.18), transparent 70%)" }} />

            <div className="relative flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/12 px-3 py-1 text-xs font-semibold backdrop-blur" style={{ color: "#E9C88A" }}>
                  <Users size={14} /> Roommate Finder
                </span>
                <h1 className="mt-4 text-3xl font-bold leading-tight sm:text-4xl">
                  Find your perfect roommate
                </h1>
                <p className="mt-2 max-w-lg text-sm text-white/80">
                  Share a room or flat with compatible people. Browse requirements or post your
                  own. It&apos;s free.
                </p>
                <p className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-white/70">
                  <Sparkles size={14} style={{ color: "#E9C88A" }} />
                  {posts.length} active {posts.length === 1 ? "requirement" : "requirements"}
                </p>
              </div>

              <div className="flex shrink-0 gap-2">
                <Link
                  href="/roommates/mine"
                  className="rounded-xl border border-white/25 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white backdrop-blur transition-colors hover:bg-white/20"
                >
                  My posts
                </Link>
                <Link
                  href="/roommates/new"
                  className="inline-flex items-center gap-1.5 rounded-xl px-5 py-2.5 text-sm font-semibold text-ink shadow-lg transition-transform hover:scale-105"
                  style={{ background: "linear-gradient(135deg, #E9C88A, #D4A359)" }}
                >
                  <Plus size={16} /> Post a requirement
                </Link>
              </div>
            </div>
          </div>

          {/* Posts */}
          {posts.length === 0 ? (
            <div className="mt-10 rounded-3xl border border-dashed border-ink/20 bg-white/60 p-14 text-center">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-grape/10">
                <Users size={26} className="text-grape" />
              </div>
              <p className="mt-4 font-semibold text-ink">No roommate requirements yet</p>
              <p className="mt-1 text-sm text-ink/50">
                Be the first to{" "}
                <Link href="/roommates/new" className="font-semibold text-coral hover:underline">
                  post one
                </Link>
                .
              </p>
            </div>
          ) : (
            <RoommateFilters posts={posts} />
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
