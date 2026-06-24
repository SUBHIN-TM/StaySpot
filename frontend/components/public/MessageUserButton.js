"use client";

// Generic "message this person" button. Starts (or reuses) a 1:1 chat with the
// given user and opens it. Used by roommate posts (and anywhere we want a quick
// "chat with this user" action). Requires login.

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiPost } from "@/lib/api";
import { getCurrentUser, getUserToken } from "@/lib/userAuth";

export default function MessageUserButton({ userId, label = "Message", className }) {
  const router = useRouter();
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setMe(getCurrentUser());
  }, []);

  // Don't message yourself.
  if (me && me.id === userId) {
    return <span className="text-xs font-medium text-slate-400">Your post</span>;
  }

  async function go() {
    if (!getUserToken()) {
      // Remember this page so login can bring them right back here.
      const next = window.location.pathname + window.location.search;
      router.push(`/login?next=${encodeURIComponent(next)}`);
      return;
    }
    setLoading(true);
    try {
      const d = await apiPost("/chat/conversations", { other_user_id: userId }, getUserToken());
      router.push(`/messages?c=${d.conversation_id}`);
    } catch (e) {
      alert(e.message);
      setLoading(false);
    }
  }

  return (
    <button
      onClick={go}
      disabled={loading}
      className={
        className ||
        "rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60"
      }
    >
      {loading ? "Opening…" : label}
    </button>
  );
}
