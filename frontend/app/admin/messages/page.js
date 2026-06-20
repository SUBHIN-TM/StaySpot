"use client";

// Admin → Messages  (URL: "/admin/messages")
// Admin chats with users/owners (the "contact support" conversations).

import { useEffect, useState } from "react";
import AdminShell from "@/components/admin/AdminShell";
import ChatPanel from "@/components/chat/ChatPanel";
import { getToken, getUser } from "@/lib/auth";

export default function AdminMessagesPage() {
  const [auth, setAuth] = useState(null);
  const [conv, setConv] = useState(null);

  useEffect(() => {
    const u = getUser();
    setConv(new URLSearchParams(window.location.search).get("c"));
    setAuth({ token: getToken(), userId: u?.id });
  }, []);

  return (
    <AdminShell active="messages">
      <h1 className="text-2xl font-bold text-slate-900">Messages</h1>
      <p className="mt-1 mb-4 text-slate-500">Conversations from users and owners.</p>
      {auth && <ChatPanel token={auth.token} userId={auth.userId} initialConversationId={conv} />}
    </AdminShell>
  );
}
