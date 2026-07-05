"use client";

// There is NO dedicated messages page for seekers/owners — messaging lives in
// the floating chat widget (bottom-right, available site-wide). This route only
// exists to catch old links / bookmarks / message notifications: it opens the
// chat widget (on the conversation from ?c= if present) and sends the visitor to
// the home page. (Admins have their own full page at /admin/messages.)

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser, getUserToken } from "@/lib/userAuth";

export default function MessagesRedirect() {
  const router = useRouter();

  useEffect(() => {
    if (!getCurrentUser() || !getUserToken()) {
      router.replace("/login");
      return;
    }
    const c = new URLSearchParams(window.location.search).get("c");
    // The chat widget is mounted site-wide and listens for this event even while
    // this (hidden) route is showing, so it opens as soon as we land on home.
    window.dispatchEvent(
      new CustomEvent("staymate:open-chat", { detail: c ? { conversationId: c } : {} })
    );
    router.replace("/");
  }, [router]);

  return (
    <div className="grid min-h-screen place-items-center bg-cream text-ink/40">Opening chat…</div>
  );
}
