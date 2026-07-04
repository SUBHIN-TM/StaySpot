"use client";

// Admin → Messages  (URL: "/admin/messages")
// Two views:
//  - "Support chats": the admin's own conversations (contact-support).
//  - "All conversations": read-only oversight of EVERY chat between users.

import { useEffect, useState } from "react";
import { LifeBuoy, Users } from "lucide-react";
import AdminShell from "@/components/admin/AdminShell";
import ChatPanel from "@/components/chat/ChatPanel";
import AllChatsMonitor from "@/components/admin/AllChatsMonitor";
import { getToken, getUser } from "@/lib/auth";

export default function AdminMessagesPage() {
  const [auth, setAuth] = useState(null);
  const [conv, setConv] = useState(null);
  const [tab, setTab] = useState("support");

  useEffect(() => {
    const u = getUser();
    const c = new URLSearchParams(window.location.search).get("c");
    setConv(c);
    if (c) setTab("support"); // a deep link to a support chat opens that view
    setAuth({ token: getToken(), userId: u?.id });
  }, []);

  const tabs = [
    { key: "support", label: "Support chats", icon: LifeBuoy },
    { key: "all", label: "All conversations", icon: Users },
  ];

  return (
    <AdminShell active="messages">
      <h1 className="text-2xl font-bold text-ink">Messages</h1>
      <p className="mt-1 text-ink/60">Chat with users, or monitor every conversation on the platform.</p>

      {/* Tabs */}
      <div className="mt-4 inline-flex rounded-xl border border-line bg-white p-1">
        {tabs.map((t) => {
          const Icon = t.icon;
          const on = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                on ? "bg-brand text-white shadow-sm" : "text-ink/55 hover:text-ink"
              }`}
            >
              <Icon size={15} /> {t.label}
            </button>
          );
        })}
      </div>

      <div className="mt-4">
        {tab === "support"
          ? auth && <ChatPanel token={auth.token} userId={auth.userId} initialConversationId={conv} />
          : <AllChatsMonitor />}
      </div>
    </AdminShell>
  );
}
