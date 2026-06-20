"use client";

// My roommate posts  (URL: "/roommates/mine")  — requires login.
// Lists only the current user's posts, each with Edit / Delete.

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/public/Navbar";
import RoommatePostCard from "@/components/public/RoommatePostCard";
import { apiGet } from "@/lib/api";
import { getCurrentUser, getUserToken } from "@/lib/userAuth";

export default function MyRoommatePostsPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const me = getCurrentUser();
    if (!me || !getUserToken()) {
      router.replace("/login");
      return;
    }
    setReady(true);
    (async () => {
      try {
        const d = await apiGet(`/roommate-posts?user_id=${me.id}&limit=50`);
        setPosts(d.posts || []);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  // Remove a post from the list after it's deleted.
  function handleDeleted(id) {
    setPosts((list) => list.filter((p) => p.id !== id));
  }

  if (!ready) {
    return <div className="grid min-h-screen place-items-center text-slate-400">Loading…</div>;
  }

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">My posts</h1>
            <p className="mt-2 text-slate-600">Your roommate requirements.</p>
          </div>
          <Link
            href="/roommates/new"
            className="rounded-lg bg-brand px-5 py-2.5 font-semibold text-white hover:bg-brand-dark"
          >
            + Post a requirement
          </Link>
        </div>

        {error ? (
          <p className="mt-8 rounded-xl border border-red-200 bg-red-50 p-6 text-red-700">{error}</p>
        ) : loading ? (
          <p className="mt-8 text-slate-500">Loading…</p>
        ) : posts.length === 0 ? (
          <div className="mt-10 rounded-xl border border-dashed border-slate-300 p-10 text-center text-slate-500">
            You haven’t posted any requirements yet.{" "}
            <Link href="/roommates/new" className="font-semibold text-brand hover:underline">
              Post one
            </Link>
            .
          </div>
        ) : (
          <div className="mt-8 grid gap-5 sm:grid-cols-2">
            {posts.map((post) => (
              <RoommatePostCard key={post.id} post={post} onDeleted={handleDeleted} />
            ))}
          </div>
        )}

        <Link href="/roommates" className="mt-8 inline-block text-sm text-slate-500 hover:text-brand">
          ← Back to all roommates
        </Link>
      </main>
    </>
  );
}
