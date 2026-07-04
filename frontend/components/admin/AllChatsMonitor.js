"use client";

// Admin oversight: a read-only monitor of EVERY conversation on the platform.
// Left = list of all conversations (who ↔ who, last message). Right = the full
// message thread of the selected conversation, shown read-only with sender names.

import { useEffect, useState } from "react";
import { MessageSquare, Search, Home, RefreshCw } from "lucide-react";
import { apiGet } from "@/lib/api";
import { getToken } from "@/lib/auth";

function initials(name = "") {
  return (name.trim().split(/\s+/).slice(0, 2).map((p) => p[0]).join("") || "U").toUpperCase();
}
function timeOf(d) {
  try {
    return new Date(d).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}
function roleTag(role) {
  if (role === "owner") return { label: "Owner", cls: "bg-gold/15 text-[#9A6B18]" };
  if (role === "admin") return { label: "Admin", cls: "bg-brand/15 text-brand" };
  return { label: "Seeker", cls: "bg-mist text-ink/55" };
}

export default function AllChatsMonitor() {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState(null); // selected conversation object
  const [messages, setMessages] = useState([]);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [q, setQ] = useState("");

  async function load() {
    setLoading(true);
    try {
      const d = await apiGet("/chat/admin/conversations", getToken());
      setConversations(d.conversations || []);
    } catch {
      setConversations([]);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); }, []);

  async function open(c) {
    setActive(c);
    setLoadingMsgs(true);
    setMessages([]);
    try {
      const d = await apiGet(`/chat/admin/conversations/${c.id}/messages`, getToken());
      setMessages(d.messages || []);
    } catch {
      setMessages([]);
    } finally {
      setLoadingMsgs(false);
    }
  }

  const term = q.trim().toLowerCase();
  const list = term
    ? conversations.filter((c) =>
        [c.user_a?.name, c.user_b?.name, c.user_a?.email, c.user_b?.email, c.property?.title]
          .filter(Boolean).some((s) => s.toLowerCase().includes(term)))
    : conversations;

  // Resolve a sender id to a name/role using the active conversation's pair.
  function sender(id) {
    if (!active) return { name: "User", role: "seeker" };
    return active.user_a?.id === id ? active.user_a : active.user_b || { name: "User", role: "seeker" };
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
      {/* LEFT: conversation list */}
      <div className="overflow-hidden rounded-2xl border border-line bg-white">
        <div className="flex items-center gap-2 border-b border-line p-3">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/40" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by name, email, listing…"
              className="w-full rounded-lg border border-line bg-cream/60 py-2 pl-9 pr-3 text-sm text-ink outline-none focus:border-brand"
            />
          </div>
          <button onClick={load} title="Refresh" className="grid h-9 w-9 place-items-center rounded-lg border border-line text-ink/60 hover:bg-mist">
            <RefreshCw size={15} />
          </button>
        </div>

        <div className="max-h-[70vh] divide-y divide-line overflow-y-auto">
          {loading ? (
            <p className="p-6 text-sm text-ink/50">Loading conversations…</p>
          ) : list.length === 0 ? (
            <p className="p-6 text-sm text-ink/50">No conversations found.</p>
          ) : (
            list.map((c) => (
              <button
                key={c.id}
                onClick={() => open(c)}
                className={`flex w-full items-start gap-3 p-3 text-left transition-colors hover:bg-mist/50 ${active?.id === c.id ? "bg-mist/70" : ""}`}
              >
                <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand/10 text-xs font-bold text-brand">
                  {initials(c.user_a?.name)}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-semibold text-ink">
                      {c.user_a?.name} <span className="text-ink/40">↔</span> {c.user_b?.name}
                    </p>
                    <span className="shrink-0 text-[11px] text-ink/40">{c.message_count} msg</span>
                  </div>
                  <p className="mt-0.5 truncate text-xs text-ink/55">
                    {c.property ? `🏠 ${c.property.title} · ` : ""}
                    {c.last_message?.content || "No messages yet"}
                  </p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* RIGHT: message thread (read-only) */}
      <div className="flex min-h-[60vh] flex-col overflow-hidden rounded-2xl border border-line bg-white">
        {!active ? (
          <div className="grid flex-1 place-items-center p-8 text-center text-ink/45">
            <div>
              <MessageSquare size={30} className="mx-auto text-ink/25" />
              <p className="mt-3 text-sm">Select a conversation to read it.</p>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between gap-3 border-b border-line p-4">
              <div className="min-w-0">
                <p className="truncate font-semibold text-ink">
                  {active.user_a?.name} <span className="text-ink/40">↔</span> {active.user_b?.name}
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-1.5">
                  {[active.user_a, active.user_b].map((u, i) => {
                    const t = roleTag(u?.role);
                    return <span key={i} className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${t.cls}`}>{u?.name}: {t.label}</span>;
                  })}
                  {active.property && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-mist px-2 py-0.5 text-[10px] font-semibold text-ink/55">
                      <Home size={10} /> {active.property.title}
                    </span>
                  )}
                </div>
              </div>
              <span className="shrink-0 rounded-full bg-mist px-2.5 py-1 text-[11px] font-semibold text-ink/50">read-only</span>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto bg-cream/40 p-4">
              {loadingMsgs ? (
                <p className="text-sm text-ink/50">Loading messages…</p>
              ) : messages.length === 0 ? (
                <p className="text-sm text-ink/50">No messages in this conversation.</p>
              ) : (
                messages.map((m) => {
                  const s = sender(m.sender_id);
                  const isA = active.user_a?.id === m.sender_id;
                  return (
                    <div key={m.id} className={`flex ${isA ? "justify-start" : "justify-end"}`}>
                      <div className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-sm shadow-sm ${isA ? "bg-white text-ink" : "bg-brand text-white"}`}>
                        <p className={`mb-0.5 text-[11px] font-semibold ${isA ? "text-brand" : "text-white/80"}`}>{s?.name}</p>
                        <p className="whitespace-pre-wrap break-words">{m.content}</p>
                        <p className={`mt-1 text-[10px] ${isA ? "text-ink/40" : "text-white/60"}`}>{timeOf(m.created_at)}</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
