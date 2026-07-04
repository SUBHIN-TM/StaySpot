"use client";

// Floating, WhatsApp-style chat widget shown site-wide (bottom-right launcher,
// panel opens above it). Dark-olive + gold theme (matches the design).
//
// Three modes, resolved from the browser session:
//   • signed OUT  → a demo "Raj (Owner)" preview; tapping the composer sends the
//                   visitor to /login?next=<current page>, then back here.
//   • seeker/owner→ their real chats (user session, lib/userAuth) → /messages
//   • admin       → their real chats (admin session, lib/auth)   → /admin/messages
//
// Single-pane (list ↔ thread with a back button) so it always fits the widget,
// unlike the two-pane full-page ChatPanel. Uses the same chat REST endpoints.

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { MessageCircle, X, Send, ChevronLeft, Home, Search } from "lucide-react";
import { getUserToken, getCurrentUser } from "@/lib/userAuth";
import { getToken, getUser } from "@/lib/auth";
import { apiGet, apiPost } from "@/lib/api";
import { RoofMark } from "@/components/public/Logo";

// ── Theme (from the design screenshot) ──────────────────────────────────────
const PANEL_BG = "linear-gradient(160deg,#3A473D 0%,#2A332C 100%)";
const GOLD = "#D4A359";
const OLIVE = "#1E2521";
const SAGE = "#4A5A50";
const RECV_BG = "rgba(255,255,255,0.10)";
const RECV_TX = "rgba(255,255,255,0.92)";
const SUBTLE = "rgba(255,255,255,0.55)";
const LINE = "rgba(255,255,255,0.08)";

// Static preview shown to signed-out visitors.
const DEMO = [
  { mine: false, text: "Hi! Is the 2BHK in Kochi still available?" },
  { mine: true, text: "Yes, available from 1st August!" },
  { mine: false, text: "Can I visit this Saturday at 11 AM?" },
  { mine: true, text: "Perfect! See you then 🎉" },
];

function initials(name = "") {
  return (name.trim().split(/\s+/).slice(0, 2).map((p) => p[0]).join("") || "U").toUpperCase();
}
// The admin support contact shows a short name + our roof-mark logo as its avatar.
function contactName(u) {
  return u?.role === "admin" ? "Parppidam Support" : u?.name || "User";
}
function isSupport(u) {
  return u?.role === "admin";
}
function SupportMark({ size = 20 }) {
  return <RoofMark size={size} stroke="#FFFFFF" door={GOLD} />;
}
function timeOf(d) {
  try {
    return new Date(d).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

// Resolve which session is active. Prefer the user (public) session; fall back to
// an admin session. Returns { kind, token, user, messagesPath }.
function resolveAuth() {
  const uTok = getUserToken();
  if (uTok) {
    return { kind: "user", token: uTok, user: getCurrentUser(), messagesPath: "/messages" };
  }
  const aTok = getToken();
  if (aTok) {
    const a = getUser();
    if (a?.role === "admin") return { kind: "admin", token: aTok, user: a, messagesPath: "/admin/messages" };
  }
  return { kind: "none" };
}

export default function ChatWidget() {
  const pathname = usePathname();
  const router = useRouter();

  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [auth, setAuth] = useState({ kind: "none" });

  const [conversations, setConversations] = useState([]);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [activeId, setActiveId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [search, setSearch] = useState(""); // filter the conversation list
  const bottomRef = useRef(null);

  // Client-only: read the session after mount (avoids SSR/localStorage mismatch).
  useEffect(() => {
    setMounted(true);
    setAuth(resolveAuth());
  }, [pathname]);

  // A "Message this person" button elsewhere asks us to open a specific chat.
  useEffect(() => {
    function onOpenChat(e) {
      setAuth(resolveAuth()); // ensure we reflect the current session
      setOpen(true);
      const id = e.detail?.conversationId;
      if (id) setActiveId(id);
    }
    window.addEventListener("staymate:open-chat", onOpenChat);
    return () => window.removeEventListener("staymate:open-chat", onOpenChat);
  }, []);

  const loggedIn = auth.kind === "user" || auth.kind === "admin";
  const meId = auth.user?.id;

  // Poll the conversation list while signed in (for the list + unread badge).
  useEffect(() => {
    if (!loggedIn) return;
    let alive = true;
    async function load() {
      try {
        const d = await apiGet("/chat/conversations", auth.token);
        if (alive) setConversations(d.conversations || []);
      } catch {
        /* ignore poll errors */
      } finally {
        if (alive) setLoadingConvs(false);
      }
    }
    load();
    const t = setInterval(load, open ? 8000 : 20000);
    return () => { alive = false; clearInterval(t); };
  }, [loggedIn, auth.token, open]);

  // When a thread is open: load + mark read + poll it.
  useEffect(() => {
    if (!activeId || !loggedIn) return;
    let alive = true;
    async function loadMsgs() {
      try {
        const d = await apiGet(`/chat/conversations/${activeId}/messages`, auth.token);
        if (alive) setMessages(d.messages || []);
      } catch {
        /* ignore */
      }
    }
    loadMsgs();
    apiPost(`/chat/conversations/${activeId}/read`, {}, auth.token).catch(() => {});
    const t = setInterval(loadMsgs, 4000);
    return () => { alive = false; clearInterval(t); };
  }, [activeId, loggedIn, auth.token]);

  // Auto-scroll to newest.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, activeId, open]);

  const unread = conversations.reduce((n, c) => n + (c.unread_count || 0), 0);
  const active = conversations.find((c) => c.id === activeId);

  // Whether the header shows the search bar (logged-in list view with chats).
  const showSearch = loggedIn && !activeId && conversations.length > 0;
  // The "Messages" list header uses the app icon (distinct from gold contact
  // avatars) — a translucent circle, NOT a gold background.
  const listHeader = loggedIn && !activeId;

  // Conversation list filtered by the search box (name or property title).
  const filtered = conversations.filter((c) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      (c.other_user?.name || "").toLowerCase().includes(q) ||
      (c.property?.title || "").toLowerCase().includes(q)
    );
  });

  // Hide on auth screens and the dedicated full chat pages (redundant there).
  const hidden =
    /(?:^|\/)(?:login|signup)(?:$|\/)/.test(pathname) ||
    pathname.startsWith("/messages") ||
    pathname.startsWith("/admin/messages");

  if (!mounted || hidden) return null;

  function goSignIn() {
    router.push(`/login?next=${encodeURIComponent(pathname || "/")}`);
  }

  async function send(e) {
    e.preventDefault();
    const content = text.trim();
    if (!content || !activeId) return;
    setText("");
    // Optimistic append so it feels instant.
    setMessages((m) => [...m, { id: `tmp-${Date.now()}`, sender_id: meId, content, created_at: new Date().toISOString(), _tmp: true }]);
    try {
      await apiPost(`/chat/conversations/${activeId}/messages`, { content }, auth.token);
    } catch {
      setText(content); // restore on failure
    }
  }

  return (
    <div className="fixed bottom-5 right-4 z-[70] sm:bottom-6 sm:right-6">
      {/* Panel */}
      {open && (
        <div
          className="absolute bottom-[4.75rem] right-0 flex w-[calc(100vw-2rem)] max-w-[380px] flex-col overflow-hidden rounded-3xl"
          style={{
            height: "min(70vh, 560px)",
            background: PANEL_BG,
            border: `1px solid ${LINE}`,
            boxShadow: "0 30px 80px rgba(0,0,0,0.45)",
          }}
        >
          {/* Header — branded top section (gold wash). The divider sits BELOW the
              search bar when it's shown, so no line splits the title + search. */}
          <div
            className="flex items-center gap-3 px-4 py-3.5"
            style={{
              background: "linear-gradient(180deg,rgba(212,163,89,0.14),rgba(212,163,89,0))",
              borderBottom: showSearch ? "none" : `1px solid ${LINE}`,
            }}
          >
            {loggedIn && activeId ? (
              <button onClick={() => setActiveId(null)} className="-ml-1 text-white/70 transition-colors hover:text-white" aria-label="Back">
                <ChevronLeft size={22} />
              </button>
            ) : null}

            <span
              className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full"
              style={
                loggedIn && active && isSupport(active.other_user)
                  ? { background: SAGE, boxShadow: "0 4px 14px rgba(74,90,80,0.45)" }
                  : listHeader
                  ? { background: "rgba(255,255,255,0.10)", border: "1px solid rgba(255,255,255,0.16)" }
                  : { background: GOLD, boxShadow: "0 4px 14px rgba(212,163,89,0.4)" }
              }
            >
              {loggedIn && active && isSupport(active.other_user) ? (
                <SupportMark size={22} />
              ) : loggedIn && active?.other_user?.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={active.other_user.avatar_url} alt="" referrerPolicy="no-referrer" className="h-full w-full object-cover" />
              ) : loggedIn && active ? (
                <span className="text-sm font-bold" style={{ color: OLIVE }}>{initials(active.other_user?.name)}</span>
              ) : listHeader ? (
                <MessageCircle size={19} color={GOLD} />
              ) : (
                <Home size={18} color={OLIVE} />
              )}
            </span>

            <div className="min-w-0 flex-1">
              <p className={`truncate font-semibold text-white ${loggedIn && active && isSupport(active.other_user) ? "" : "capitalize"}`}>
                {loggedIn && active
                  ? contactName(active.other_user)
                  : loggedIn
                  ? "Messages"
                  : "Raj (Owner)"}
              </p>
              <p className="flex items-center gap-1.5 text-xs" style={{ color: SUBTLE }}>
                {loggedIn && !active ? (
                  "Your conversations"
                ) : (() => {
                  // Preview contact is always "online"; a real thread reflects the
                  // other user's presence (admins are always online — set server-side).
                  const isOnline = !loggedIn ? true : !!active?.other_user?.online;
                  return (
                    <>
                      <span className="h-2 w-2 rounded-full" style={{ background: isOnline ? "#5BAA6F" : "rgba(255,255,255,0.35)" }} />
                      {isOnline ? "Online now" : "Offline"}
                    </>
                  );
                })()}
              </p>
            </div>

            <button onClick={() => setOpen(false)} className="text-white/60 transition-colors hover:text-white" aria-label="Close chat">
              <X size={20} />
            </button>
          </div>

          {/* Search bar — part of the branded title section. The ONLY divider is
              this section's bottom border (nothing splits the title from search). */}
          {showSearch && (
            <div className="px-4 pb-3" style={{ background: "rgba(212,163,89,0.05)", borderBottom: `1px solid ${LINE}` }}>
              <div className="flex items-center gap-2 rounded-full px-3.5 py-2" style={{ background: "rgba(255,255,255,0.08)", border: `1px solid rgba(212,163,89,0.28)` }}>
                <Search size={15} color={SUBTLE} className="shrink-0" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search chats…"
                  className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/40"
                />
                {search && (
                  <button type="button" onClick={() => setSearch("")} aria-label="Clear search" className="shrink-0">
                    <X size={14} color={SUBTLE} />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-4 py-4">
            {/* Signed-out preview */}
            {!loggedIn && (
              <Bubbles items={DEMO.map((d, i) => ({ id: i, mine: d.mine, content: d.text }))} />
            )}

            {/* Signed-in: conversation list */}
            {loggedIn && !activeId && (
              loadingConvs ? (
                <p className="pt-6 text-center text-sm" style={{ color: SUBTLE }}>Loading…</p>
              ) : conversations.length === 0 ? (
                <div className="pt-10 text-center">
                  <MessageCircle size={30} color={SUBTLE} className="mx-auto" />
                  <p className="mt-2 text-sm" style={{ color: SUBTLE }}>No conversations yet.</p>
                </div>
              ) : (
                <div className="-mx-4 -my-4">
                  {filtered.length === 0 ? (
                    <p className="px-4 py-8 text-center text-sm" style={{ color: SUBTLE }}>
                      No chats match “{search}”.
                    </p>
                  ) : filtered.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setActiveId(c.id)}
                      className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-white/5"
                      style={{ borderBottom: `1px solid ${LINE}` }}
                    >
                      <span className="relative shrink-0">
                        <span className="grid h-10 w-10 place-items-center overflow-hidden rounded-full" style={{ background: isSupport(c.other_user) ? SAGE : GOLD }}>
                          {isSupport(c.other_user) ? (
                            <SupportMark size={22} />
                          ) : c.other_user?.avatar_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={c.other_user.avatar_url} alt="" referrerPolicy="no-referrer" className="h-full w-full object-cover" />
                          ) : (
                            <span className="text-sm font-bold" style={{ color: OLIVE }}>{initials(c.other_user?.name)}</span>
                          )}
                        </span>
                        {c.other_user?.online && (
                          <span
                            className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full"
                            style={{ background: "#5BAA6F", border: "2px solid #2E382F" }}
                          />
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center justify-between gap-2">
                          <span className={`truncate font-medium text-white ${isSupport(c.other_user) ? "" : "capitalize"}`}>
                            {contactName(c.other_user)}
                          </span>
                          {c.unread_count > 0 && (
                            <span className="rounded-full px-1.5 text-xs font-bold" style={{ background: GOLD, color: OLIVE }}>
                              {c.unread_count}
                            </span>
                          )}
                        </span>
                        <span className="block truncate text-xs" style={{ color: SUBTLE }}>
                          {c.property?.title ? `🏠 ${c.property.title} · ` : ""}
                          {c.last_message?.content || "No messages yet"}
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
              )
            )}

            {/* Signed-in: open thread */}
            {loggedIn && activeId && (
              <>
                {/* Which listing this enquiry is about — pinned so the owner always sees it. */}
                {active?.property && (
                  <a
                    href={`/properties/${active.property.id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="sticky top-0 z-10 mb-3 flex items-center gap-2.5 rounded-xl px-3 py-2"
                    style={{ background: "#38463C", border: "1px solid rgba(212,163,89,0.30)" }}
                  >
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg" style={{ background: "rgba(212,163,89,0.2)" }}>
                      <Home size={15} color={GOLD} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: SUBTLE }}>Enquiry about</p>
                      <p className="truncate text-sm font-semibold text-white">{active.property.title}</p>
                    </div>
                    <span className="shrink-0 text-sm font-bold" style={{ color: GOLD }}>
                      ₹{Number(active.property.rent_amount).toLocaleString("en-IN")}
                    </span>
                  </a>
                )}
                <Bubbles items={messages.map((m) => ({ id: m.id, mine: m.sender_id === meId, content: m.content, time: timeOf(m.created_at) }))} />
              </>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Composer */}
          {(!loggedIn || activeId) && (
            <form
              onSubmit={loggedIn ? send : (e) => { e.preventDefault(); goSignIn(); }}
              className="flex items-center gap-2 px-3 py-3"
              style={{ borderTop: `1px solid ${LINE}` }}
            >
              <input
                value={loggedIn ? text : ""}
                onChange={(e) => loggedIn && setText(e.target.value)}
                onFocus={() => { if (!loggedIn) goSignIn(); }}
                readOnly={!loggedIn}
                placeholder={loggedIn ? "Type a message…" : "Sign in to send a message…"}
                className="min-w-0 flex-1 rounded-full px-4 py-2.5 text-sm text-white outline-none placeholder:text-white/40"
                style={{ background: "rgba(255,255,255,0.06)", border: `1px solid ${LINE}` }}
              />
              <button
                type="submit"
                className="grid h-10 w-10 shrink-0 place-items-center rounded-full transition-transform hover:scale-105"
                style={{ background: GOLD }}
                aria-label={loggedIn ? "Send" : "Sign in to chat"}
              >
                <Send size={17} color={OLIVE} />
              </button>
            </form>
          )}

        </div>
      )}

      {/* Launcher */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="grid h-14 w-14 place-items-center rounded-full shadow-xl transition-transform hover:scale-105"
        style={{ background: GOLD, boxShadow: "0 12px 30px rgba(212,163,89,0.5)" }}
        aria-label={open ? "Close chat" : "Open chat"}
      >
        {open ? <X size={24} color={OLIVE} /> : <MessageCircle size={24} color={OLIVE} />}
        {!open && loggedIn && unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-red-500 px-1 text-xs font-bold text-white ring-2 ring-cream">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>
    </div>
  );
}

// Renders a stack of chat bubbles (gold for mine, translucent for received).
function Bubbles({ items }) {
  return (
    <div className="space-y-2.5">
      {items.map((m) => (
        <div key={m.id} className={`flex ${m.mine ? "justify-end" : "justify-start"}`}>
          <div
            className="max-w-[78%] rounded-2xl px-3.5 py-2 text-sm leading-snug"
            style={
              m.mine
                ? { background: GOLD, color: OLIVE, borderBottomRightRadius: 6 }
                : { background: RECV_BG, color: RECV_TX, borderBottomLeftRadius: 6 }
            }
          >
            <p className="whitespace-pre-line break-words">{m.content}</p>
            {m.time && (
              <p className="mt-1 text-right text-[10px]" style={{ color: m.mine ? "rgba(30,37,33,0.55)" : "rgba(255,255,255,0.45)" }}>
                {m.time}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
