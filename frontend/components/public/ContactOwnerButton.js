"use client";

// "Contact owner" button on the property detail page.
// Starts (or reuses) a chat with the owner about this property, then opens it.
// If the visitor isn't logged in, sends them to login first.

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiPost } from "@/lib/api";
import { getCurrentUser, getUserToken } from "@/lib/userAuth";

export default function ContactOwnerButton({ ownerId, propertyId }) {
  const router = useRouter();
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
      router.push("/login");
      return;
    }
    setLoading(true);
    try {
      const d = await apiPost(
        "/chat/conversations",
        { other_user_id: ownerId, property_id: propertyId },
        getUserToken()
      );
      router.push(`/messages?c=${d.conversation_id}`);
    } catch (e) {
      alert(e.message);
      setLoading(false);
    }
  }

  return (
    <button
      onClick={contact}
      disabled={loading}
      className="mt-4 block w-full rounded-lg bg-brand py-2.5 text-center font-semibold text-white hover:bg-brand-dark disabled:opacity-60"
    >
      {loading ? "Opening chat…" : "Contact owner"}
    </button>
  );
}
