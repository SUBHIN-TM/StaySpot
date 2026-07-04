"use client";

// "Contact owner" button on the property detail page.
// Starts (or reuses) a chat with the owner about this property, then opens it.
// If the visitor isn't logged in, sends them to login first.

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { apiPost } from "@/lib/api";
import { getCurrentUser, getUserToken } from "@/lib/userAuth";
import { useToast } from "@/components/ToastProvider";

export default function ContactOwnerButton({ ownerId, propertyId, className, label = "Contact owner" }) {
  const router = useRouter();
  const toast = useToast();
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setMe(getCurrentUser());
  }, []);

  // Owners can't message themselves about their own listing.
  if (me && me.id === ownerId) {
    return (
      <p className="mt-4 rounded-lg bg-slate-100 px-4 py-2.5 text-center text-sm font-medium text-slate-500">
        This is your listing
      </p>
    );
  }

  async function contact() {
    if (!getUserToken()) {
      // Remember this page so login can bring them right back here to contact.
      const next = window.location.pathname + window.location.search;
      router.push(`/login?next=${encodeURIComponent(next)}`);
      return;
    }
    setLoading(true);
    try {
      const d = await apiPost(
        "/chat/conversations",
        { other_user_id: ownerId, property_id: propertyId },
        getUserToken()
      );
      // Open the floating chat widget on this conversation (no /messages page).
      window.dispatchEvent(
        new CustomEvent("staymate:open-chat", { detail: { conversationId: d.conversation_id } })
      );
      setLoading(false);
    } catch (e) {
      toast(e.message || "Couldn’t contact the owner", "error");
      setLoading(false);
    }
  }

  return (
    <button
      onClick={contact}
      disabled={loading}
      className={
        className ||
        "flex w-full items-center justify-center gap-2 rounded-xl bg-brand py-3 text-center font-semibold text-white shadow-sm transition-colors hover:bg-brand-dark disabled:opacity-60"
      }
    >
      <MessageCircle size={17} /> {loading ? "Opening chat…" : label}
    </button>
  );
}
