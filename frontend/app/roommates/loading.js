// Instant skeleton shown the moment you switch to the Roommates tab, while the
// server component fetches posts. Keeps navigation feeling immediate.
import Navbar from "@/components/public/Navbar";

function RowSkeleton() {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <div className="mb-3 h-5 w-2/3 animate-pulse rounded bg-black/5" />
      <div className="mb-2 h-3 w-full animate-pulse rounded bg-black/5" />
      <div className="mb-4 h-3 w-4/5 animate-pulse rounded bg-black/5" />
      <div className="h-8 w-32 animate-pulse rounded-full bg-black/5" />
    </div>
  );
}

export default function Loading() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-cream">
        <div className="mx-auto max-w-[1440px] px-4 py-10 sm:px-6 lg:px-10">
          <div className="mb-8 h-8 w-72 animate-pulse rounded bg-black/5" />
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <RowSkeleton key={i} />
            ))}
          </div>
        </div>
      </main>
    </>
  );
}
