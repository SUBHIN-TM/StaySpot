// ───────────────────────────────────────────────────────────────────────────
// Roommate / people-finder page  (URL: "/roommates")
// People post "looking for a roommate / room to share" requirements; anyone can
// browse them and message the poster. SERVER component → SEO-friendly.
// ───────────────────────────────────────────────────────────────────────────

import Link from "next/link";
import Navbar from "@/components/public/Navbar";
import Footer from "@/components/public/Footer";
import RoommatePostCard from "@/components/public/RoommatePostCard";
import { apiGet } from "@/lib/api";

export const metadata = {
  title: "Find roommates & room-sharing partners",
  description:
    "Browse roommate requirements or post your own. Find compatible people to share a room or flat with on StayMate.",
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
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        {/* Header */}
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Find a roommate</h1>
            <p className="mt-2 text-slate-600">
              Looking to share a room or flat? Browse requirements or post your own.
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/roommates/mine"
              className="rounded-lg border border-slate-300 px-4 py-2.5 font-medium text-slate-700 hover:bg-slate-50"
            >
              My posts
            </Link>
            <Link
              href="/roommates/new"
              className="rounded-lg bg-brand px-5 py-2.5 font-semibold text-white hover:bg-brand-dark"
            >
              + Post a requirement
            </Link>
          </div>
        </div>

        {/* Posts */}
        {posts.length === 0 ? (
          <p className="mt-10 rounded-xl border border-dashed border-slate-300 p-10 text-center text-slate-500">
            No roommate requirements yet. Be the first to{" "}
            <Link href="/roommates/new" className="font-semibold text-brand hover:underline">
              post one
            </Link>
            .
          </p>
        ) : (
          <div className="mt-8 grid gap-5 sm:grid-cols-2">
            {posts.map((post) => (
              <RoommatePostCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
