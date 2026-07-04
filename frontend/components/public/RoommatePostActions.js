"use client";

// Actions shown on a roommate post:
//  - If it's YOUR post → Edit + Delete.
//  - Otherwise → a "Message" button to chat with the poster.

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import MessageUserButton from "./MessageUserButton";
import { apiDelete } from "@/lib/api";
import { getCurrentUser, getUserToken } from "@/lib/userAuth";
import { useToast } from "@/components/ToastProvider";

// onDeleted (optional): called with the post id after a successful delete.
// If not provided, we refresh the server-rendered route instead.
export default function RoommatePostActions({ post, onDeleted }) {
  const router = useRouter();
  const toast = useToast();
  const [me, setMe] = useState(null);

  useEffect(() => {
    setMe(getCurrentUser());
  }, []);

  const mine = me && me.id === post.user?.id;

  if (!mine) {
    return post.user?.id ? <MessageUserButton userId={post.user.id} label="Message" /> : null;
  }

  async function del() {
    if (!confirm("Delete this post?")) return;
    try {
      await apiDelete(`/roommate-posts/${post.id}`, getUserToken());
      toast("Post deleted.", "success");
      if (onDeleted) onDeleted(post.id);
      else router.refresh(); // re-fetch the server-rendered list
    } catch (e) {
      toast(e.message || "Couldn’t delete the post", "error");
    }
  }

  return (
    <div className="flex gap-2">
      <Link
        href={`/roommates/${post.id}/edit`}
        className="rounded-lg border border-ink/15 px-3.5 py-1.5 text-sm font-medium text-ink/70 transition-colors hover:border-grape/40 hover:text-grape"
      >
        Edit
      </Link>
      <button
        onClick={del}
        className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-1.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-100"
      >
        Delete
      </button>
    </div>
  );
}
