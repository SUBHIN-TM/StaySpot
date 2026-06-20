"use client";

// Edit your roommate post  (URL: "/roommates/<id>/edit")  — requires login.

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Navbar from "@/components/public/Navbar";
import RoommatePostForm from "@/components/public/RoommatePostForm";
import { apiGet } from "@/lib/api";
import { getCurrentUser, getUserToken } from "@/lib/userAuth";

export default function EditRoommatePostPage() {
  const { id } = useParams();
  const router = useRouter();
  const [post, setPost] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const me = getCurrentUser();
    if (!me || !getUserToken()) {
      router.replace("/login");
      return;
    }
    (async () => {
      try {
        const data = await apiGet(`/roommate-posts/${id}`);
        if (data.post?.user?.id !== me.id) {
          setError("You can only edit your own post.");
          return;
        }
        setPost(data.post);
      } catch (e) {
        setError(e.message);
      }
    })();
  }, [id, router]);

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-xl px-4 py-10 sm:px-6">
        <h1 className="text-2xl font-bold text-slate-900">Edit your post</h1>
        <p className="mt-1 mb-6 text-slate-500">Update your roommate requirement.</p>
        {error ? (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-red-700">{error}</p>
        ) : !post ? (
          <p className="text-slate-500">Loading…</p>
        ) : (
          <RoommatePostForm existing={post} />
        )}
      </main>
    </>
  );
}
