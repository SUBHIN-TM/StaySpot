"use client";

// Messages page for users + owners  (URL: "/messages", optional ?c=<conversationId>)
// Shows the chat panel and a "Contact support" button (chat with admin).

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/public/Navbar";
import ChatPanel from "@/components/chat/ChatPanel";
import { apiPost } from "@/lib/api";
import { getCurrentUser, getUserToken } from "@/lib/userAuth";

export default function MessagesPage() {
  const router = useRouter();
  const [auth, setAuth] = useState(null); // { token, userId }
  const [conv, setConv] = useState(null); // initial conversation id from ?c=
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const u = getCurrentUser();
    const t = getUserToken();
    if (!u || !t) {
      router.replace("/login");
      return;
    }
    setConv(new URLSearchParams(window.location.search).get("c"));
    setAuth({ token: t, userId: u.id });
    setReady(true);
  }, [router]);

  async function contactSupport() {
    try {
      const d = await apiPost("/chat/support", {}, getUserToken());
      window.location.assign(`/messages?c=${d.conversation_id}`);
    } catch (e) {
      alert(e.message);
    }
  }

  if (!ready) {
    return <div className="grid min-h-screen place-items-center text-slate-400">Loading…</div>;
  }

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-900">Messages</h1>
          <button
            onClick={contactSupport}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            💬 Contact support
          </button>
        </div>
        <ChatPanel token={auth.token} userId={auth.userId} initialConversationId={conv} />
      </main>
    </>
  );
}
