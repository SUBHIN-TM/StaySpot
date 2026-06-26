// Instant skeleton shown the moment you switch to the Browse tab, while the
// server component fetches listings. Makes navigation feel immediate even when
// the DB/API is slow (the real content streams in and replaces this).
import Navbar from "@/components/public/Navbar";

function CardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
      <div className="aspect-[4/3] w-full animate-pulse bg-black/5" />
      <div className="space-y-3 p-4">
        <div className="h-4 w-3/4 animate-pulse rounded bg-black/5" />
        <div className="h-3 w-1/2 animate-pulse rounded bg-black/5" />
        <div className="h-5 w-1/3 animate-pulse rounded bg-black/5" />
      </div>
    </div>
  );
}

export default function Loading() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-cream">
        <div className="mx-auto max-w-[1440px] px-4 py-10 sm:px-6 lg:px-10">
          <div className="mb-8 h-8 w-64 animate-pulse rounded bg-black/5" />
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        </div>
      </main>
    </>
  );
}
