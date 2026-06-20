"use client";

// Reusable chat UI: a conversation list on the left + the message thread on the
// right. Token-driven so the same panel works for users/owners and for admin.
// Updates via simple polling (every few seconds) — no sockets needed.
//
// Props:
//   token       - JWT of the logged-in account (user/owner or admin)
//   userId      - id of the logged-in account (to tell "my" messages apart)
//   initialConversationId - optional conversation to open on load

import { useEffect, useRef, useState } from "react";
import { apiGet, apiPost } from "@/lib/api";

function initials(name = "") {
  return (name.trim().split(/\s+/).slice(0, 2).map((p) => p[0]).join("") || "U").toUpperCase();
}
function timeOf(d) {
  try {
    return new Date(d).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

export default function ChatPanel({ token, userId, initialConversationId }) {
  const [conversations, setConversations] = useState([]);
  const [activeId, setActiveId] = useState(initialConversationId || null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [loadingConvs, setLoadingConvs] = useState(true);
  const bottomRef = useRef(null);

  async function loadConversations() {
    try {
      const d = await apiGet("/chat/conversations", token);
      setConversations(d.conversations || []);
    } catch {
      /* ignore poll errors */
    } finally {
      setLoadingConvs(false);
    }
  }

  async function loadMessages(id) {
    if (!id) return;
    try {
      const d = await apiGet(`/chat/conversations/${id}/messages`, token);
      setMessages(d.messages || []);
    } catch {
      /* ignore */
    }
  }

  async function markRead(id) {
    try {
      await apiPost(`/chat/conversations/${id}/read`, {}, token);
    } catch {
      /* ignore */
    }
  }

  // Poll the conversation list.
  useEffect(() => {
    loadConversations();
    const t = setInterval(loadConversations, 8000);
    return () => clearInterval(t);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // When a conversation is open: load + mark read + poll its messages.
  useEffect(() => {
    if (!activeId) return;
    loadMessages(activeId);
    markRead(activeId);
    loadConversations();
    const t = setInterval(() => loadMessages(activeId), 4000);
    return () => clearInterval(t);
  }, [activeId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-scroll to the newest message.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send(e) {
    e.preventDefault();
    const content = text.trim();
    if (!content || !activeId) return;
    setText("");
    try {
      await apiPost(`/chat/conversations/${activeId}/messages`, { content }, token);
      loadMessages(activeId);
      loadConversations();
    } catch (err) {
      alert(err.message);
      setText(content);
    }
  }

  const active = conversations.find((c) => c.id === activeId);

  return (
    <div className="flex h-[72vh] overflow-hidden rounded-2xl border border-slate-200 bg-white">
      {/* Conversation list */}
      <div className={`w-full border-r border-slate-200 md:w-80 ${activeId ? "hidden md:block" : "block"}`}>
        <div className="border-b border-slate-200 px-4 py-3 font-semibold text-slate-900">Chats</div>
        <div className="h-[calc(72vh-49px)] overflow-y-auto">
          {loadingConvs ? (
            <p className="p-4 text-sm text-slate-500">Loading…</p>
          ) : conversations.length === 0 ? (
            <p className="p-4 text-sm text-slate-500">No conversations yet.</p>
          ) : (
            conversations.map((c) => (
              <button
                key={c.id}
                onClick={() => setActiveId(c.id)}
                className={`flex w-full items-center gap-3 border-b border-slate-100 px-4 py-3 text-left hover:bg-slate-50 ${
                  c.id === activeId ? "bg-blue-50" : ""
                }`}
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full bg-brand text-sm font-bold text-white">
                  {c.other_user?.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={c.other_user.avatar_url} alt="" referrerPolicy="no-referrer" className="h-full w-full object-cover" />
                  ) : (
                    initials(c.other_user?.name)
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between">
                    <span className="truncate font-medium capitalize text-slate-900">
                      {c.other_user?.name || "User"}
                      {c.other_user?.role === "admin" && " (Support)"}
                    </span>
                    {c.unread_count > 0 && (
                      <span className="ml-2 rounded-full bg-brand px-1.5 text-xs font-bold text-white">
                        {c.unread_count}
                      </span>
                    )}
                  </span>
                  <span className="block truncate text-xs text-slate-500">
                    {c.property?.title ? `🏠 ${c.property.title} · ` : ""}
                    {c.last_message?.content || "No messages yet"}
                  </span>
                </span>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Thread */}
      <div className={`flex-1 flex-col ${activeId ? "flex" : "hidden md:flex"}`}>
        {!active ? (
          <div className="grid flex-1 place-items-center text-slate-400">
            Select a conversation to start chatting.
          </div>
        ) : (
          <>
            {/* Thread header */}
            <div className="flex items-center gap-3 border-b border-slate-200 px-4 py-3">
              <button onClick={() => setActiveId(null)} className="text-slate-500 md:hidden" aria-label="Back">
                ‹
              </button>
              <span className="font-semibold capitalize text-slate-900">
                {active.other_user?.name}
                {active.other_user?.role === "admin" && " (Support)"}
              </span>
              {active.property?.title && (
                <span className="truncate text-sm text-slate-500">· {active.property.title}</span>
              )}
            </div>

            {/* Messages */}
            <div className="flex-1 space-y-2 overflow-y-auto bg-slate-50 p-4">
              {messages.map((m) => {
                const mine = m.sender_id === userId;
                return (
                  <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${
                        mine ? "bg-brand text-white" : "bg-white text-slate-800 ring-1 ring-slate-200"
                      }`}
                    >
                      <p className="whitespace-pre-line break-words">{m.content}</p>
                      <p className={`mt-1 text-right text-[10px] ${mine ? "text-blue-100" : "text-slate-400"}`}>
                        {timeOf(m.created_at)}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>

            {/* Composer */}
            <form onSubmit={send} className="flex gap-2 border-t border-slate-200 p-3">
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Type a message…"
                className="flex-1 rounded-full border border-slate-300 px-4 py-2 outline-none focus:border-brand"
              />
              <button
                type="submit"
                className="rounded-full bg-brand px-5 py-2 font-semibold text-white hover:bg-brand-dark"
              >
                Send
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
