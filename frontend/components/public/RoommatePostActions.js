"use client";

// Actions shown on a roommate post:
//  - If it's YOUR post → Edit + Delete.
//  - Otherwise → a "Message" button to chat with the poster.

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Pencil, Lock, RotateCcw, Trash2 } from "lucide-react";
import MessageUserButton from "./MessageUserButton";
import { apiDelete, apiPatch } from "@/lib/api";
import { getCurrentUser, getUserToken } from "@/lib/userAuth";
import { useToast } from "@/components/ToastProvider";
import { useConfirm } from "@/components/ConfirmProvider";

// onDeleted (optional): called with the post id after a successful delete.
// active / onToggle: the post's open/closed status, owned by the parent card.
// If onDeleted isn't provided, we refresh the server-rendered route instead.
export default function RoommatePostActions({ post, onDeleted, active = true, onToggle }) {
  const router = useRouter();
  const toast = useToast();
  const confirm = useConfirm();
  const [me, setMe] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setMe(getCurrentUser());
  }, []);

  const mine = me && me.id === post.user?.id;

  // Non-owner: message the poster, but only while the post is open. A closed post
  // stays visible so seekers can read it, with the Message button disabled.
  if (!mine) {
    if (!post.user?.id) return null;
    if (!active) {
      return (
        <button
          type="button"
          disabled
          title="This post is closed"
          className="cursor-not-allowed rounded-lg bg-ink/10 px-4 py-2 text-sm font-semibold text-ink/40"
        >
          Message
        </button>
      );
    }
    return <MessageUserButton userId={post.user.id} label="Message" />;
  }

  // Owner: flip the post between open (active) and closed. Always confirm first,
  // spelling out what the change means for seekers.
  async function toggleActive() {
    const ok = active
      ? await confirm({
          title: "Close this post?",
          message: "It stays visible to seekers, but they can no longer message you about it. You can reopen it anytime.",
          confirmLabel: "Close post",
          tone: "danger",
        })
      : await confirm({
          title: "Reopen this post?",
          message: "It becomes active again and seekers will be able to message you about it.",
          confirmLabel: "Reopen post",
          tone: "info",
        });
    if (!ok) return;
    setBusy(true);
    try {
      await apiPatch(`/roommate-posts/${post.id}`, { is_active: !active }, getUserToken());
      onToggle?.(!active);
      toast(active ? "Post closed." : "Post reopened.", "success");
    } catch (e) {
      toast(e.message || "Couldn’t update the post", "error");
    } finally {
      setBusy(false);
    }
  }

  async function del() {
    if (!(await confirm({ title: "Delete this post?", message: "This can't be undone.", confirmLabel: "Delete" }))) return;
    try {
      await apiDelete(`/roommate-posts/${post.id}`, getUserToken());
      toast("Post deleted.", "success");
      if (onDeleted) onDeleted(post.id);
      else router.refresh(); // re-fetch the server-rendered list
    } catch (e) {
      toast(e.message || "Couldn’t delete the post", "error");
    }
  }

  const btn =
    "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-semibold transition-all active:scale-95 disabled:opacity-60";

  return (
    <div className="flex flex-wrap gap-2">
      <Link
        href={`/roommates/${post.id}/edit`}
        className={`${btn} border-grape/25 bg-grape/5 text-grape hover:bg-grape/10 hover:shadow-sm`}
      >
        <Pencil size={14} /> Edit
      </Link>
      <button
        onClick={toggleActive}
        disabled={busy}
        className={
          active
            ? `${btn} border-amber-300/70 bg-amber-50 text-amber-700 hover:bg-amber-100 hover:shadow-sm`
            : `${btn} border-green-300/70 bg-green-50 text-green-700 hover:bg-green-100 hover:shadow-sm`
        }
      >
        {active ? <><Lock size={14} /> Close</> : <><RotateCcw size={14} /> Reopen</>}
      </button>
      <button
        onClick={del}
        className={`${btn} border-red-200 bg-red-50 text-red-600 hover:bg-red-100 hover:shadow-sm`}
      >
        <Trash2 size={14} /> Delete
      </button>
    </div>
  );
}
