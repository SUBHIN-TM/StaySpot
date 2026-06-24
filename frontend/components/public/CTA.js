// Final call-to-action band before the footer. Bold animated sunset gradient.

import Link from "next/link";
import Reveal from "./Reveal";

export default function CTA() {
  return (
    <section className="px-4 pb-24 sm:px-6 lg:px-10">
      <Reveal>
        <div className="gradient-pan relative mx-auto max-w-[1440px] overflow-hidden rounded-[2.5rem] bg-gradient-to-r from-sun via-coral to-grape px-6 py-16 text-center text-white shadow-2xl shadow-coral/30 sm:py-20">
          {/* faint floating rings */}
          <div aria-hidden className="pointer-events-none absolute inset-0 opacity-30">
            <div className="floaty absolute -left-10 -top-10 h-40 w-40 rounded-full border border-white/40" />
            <div className="floaty-slow absolute -bottom-12 right-6 h-56 w-56 rounded-full border border-white/30" />
          </div>

          <h2 className="relative text-3xl font-black sm:text-5xl">
            Ready to find your next home?
          </h2>
          <p className="relative mx-auto mt-4 max-w-xl text-white/90">
            Browsing is free and needs no sign-up. Start exploring real, admin-checked
            listings — or list your own place in minutes.
          </p>
          <div className="relative mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/properties"
              className="rounded-2xl bg-white px-8 py-3.5 font-semibold text-ink transition hover:scale-[1.03] hover:shadow-lg"
            >
              Explore listings
            </Link>
            <Link
              href="/owner/signup"
              className="rounded-2xl border border-white/60 px-8 py-3.5 font-semibold text-white transition hover:bg-white/10"
            >
              List your property
            </Link>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
