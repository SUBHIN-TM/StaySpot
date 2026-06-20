// Final call-to-action band before the footer.

import Link from "next/link";

export default function CTA() {
  return (
    <section className="bg-brand">
      <div className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6">
        <h2 className="text-3xl font-bold text-white sm:text-4xl">
          Ready to find your next home?
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-blue-100">
          Start browsing thousands of verified listings — no sign-up required to look.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/properties"
            className="rounded-xl bg-white px-8 py-3 font-semibold text-brand hover:bg-blue-50"
          >
            Browse listings
          </Link>
          <Link
            href="/owner/signup"
            className="rounded-xl border border-white/40 px-8 py-3 font-semibold text-white hover:bg-white/10"
          >
            List your property
          </Link>
        </div>
      </div>
    </section>
  );
}
