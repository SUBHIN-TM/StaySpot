"use client";

// Post a roommate requirement  (URL: "/roommates/new")  — requires login.

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/public/Navbar";
import RoommatePostForm from "@/components/public/RoommatePostForm";
import { getCurrentUser, getUserToken } from "@/lib/userAuth";

export default function NewRoommatePostPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!getCurrentUser() || !getUserToken()) {
      router.replace("/login");
      return;
    }
    setReady(true);
  }, [router]);

  if (!ready) {
    return <div className="grid min-h-screen place-items-center text-slate-400">Loading…</div>;
  }

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-xl px-4 py-10 sm:px-6">
        <h1 className="text-2xl font-bold text-slate-900">Post a roommate requirement</h1>
        <p className="mt-1 mb-6 text-slate-500">Tell people what you’re looking for.</p>
        <RoommatePostForm existing={null} />
      </main>
    </>
  );
}
