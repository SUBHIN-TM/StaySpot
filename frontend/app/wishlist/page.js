"use client";

// Wishlist page  (URL: "/wishlist")  — requires login.
// Shows the properties the current user has saved (hearted). Removing a heart
// here drops the card live, since the shared wishlist store notifies us.

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Heart } from "lucide-react";
import Navbar from "@/components/public/Navbar";
import Footer from "@/components/public/Footer";
import PropertyCard from "@/components/public/PropertyCard";
import { apiGet } from "@/lib/api";
import { getUserToken } from "@/lib/userAuth";
import { loadWishlist, subscribe, isFavorited, wishlistReady } from "@/lib/wishlist";

export default function WishlistPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [, rerender] = useState(0);

  useEffect(() => {
    const token = getUserToken();
    if (!token) {
      router.replace("/login");
      return;
    }
    setReady(true);
    loadWishlist(true); // keep the shared store (and every heart) in sync

    (async () => {
      try {
        const d = await apiGet("/favorites", token);
        setProperties(d.properties || []);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();

    return subscribe(() => rerender((n) => n + 1));
  }, [router]);

  if (!ready) {
    return <div className="grid min-h-screen place-items-center bg-cream text-ink/40">Loading…</div>;
  }

  // Only show cards still in the wishlist (so un-hearting removes them live).
  // Before the store has loaded, show everything we fetched to avoid a flicker.
  const visible = wishlistReady()
    ? properties.filter((p) => isFavorited(p.id))
    : properties;

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-cream">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-10">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-brand/10">
              <Heart size={20} fill="#E86A6A" color="#E86A6A" />
            </span>
            <div>
              <h1 className="text-3xl font-bold text-ink">Your Wishlist</h1>
              <p className="mt-1 text-ink/60">Places you&apos;ve saved to come back to.</p>
            </div>
          </div>

          {error ? (
            <p className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">{error}</p>
          ) : loading ? (
            <p className="mt-8 text-ink/50">Loading…</p>
          ) : visible.length === 0 ? (
            <div className="mt-10 rounded-3xl border border-dashed border-ink/20 bg-white p-12 text-center">
              <div className="mb-3 text-4xl">🤍</div>
              <p className="text-ink/60">
                Your wishlist is empty. Tap the{" "}
                <Heart size={14} className="inline" color="#E86A6A" /> heart on any listing to save it here.
              </p>
              <Link
                href="/properties"
                className="mt-5 inline-block rounded-full bg-brand px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark"
              >
                Browse listings
              </Link>
            </div>
          ) : (
            <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {visible.map((p) => (
                <PropertyCard key={p.id} property={p} />
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
