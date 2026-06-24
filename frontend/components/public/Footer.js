// Site footer shown on all public pages. Dark "ink" background with sunset
// accents, matching the landing-page theme.

import Link from "next/link";

export default function Footer() {
  // Footer link columns. Add/remove items freely — it's just data.
  const columns = [
    {
      title: "Explore",
      links: [
        { href: "/properties", label: "Browse rentals" },
        { href: "/roommates", label: "Find roommates" },
      ],
    },
    {
      title: "For owners",
      links: [
        { href: "/owner/signup", label: "List a property" },
        { href: "/owner/login", label: "Owner login" },
      ],
    },
    {
      title: "Company",
      links: [
        { href: "/#", label: "About us" },
        { href: "/#", label: "Contact" },
        { href: "/#", label: "Privacy" },
      ],
    },
  ];

  return (
    <footer className="mt-auto bg-ink text-white">
      <div className="mx-auto grid max-w-[1440px] gap-10 px-4 py-14 sm:px-6 md:grid-cols-4 lg:px-10">
        {/* Brand blurb */}
        <div className="md:pr-6">
          <div className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-sun via-coral to-grape font-black text-white shadow-md shadow-coral/30">
              S
            </span>
            <span className="text-xl font-black tracking-tight">StayMate</span>
          </div>
          <p className="mt-4 max-w-xs text-sm text-white/55">
            Find your next stay, roommate, or rental space in minutes — every listing
            admin-checked.
          </p>
        </div>

        {/* Link columns */}
        {columns.map((col) => (
          <div key={col.title}>
            <h3 className="text-sm font-bold uppercase tracking-wider text-white/40">
              {col.title}
            </h3>
            <ul className="mt-4 space-y-2.5">
              {col.links.map((l, idx) => (
                <li key={idx}>
                  <Link
                    href={l.href}
                    className="text-sm text-white/70 transition hover:text-white"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* gradient hairline + copyright */}
      <div className="h-px bg-gradient-to-r from-transparent via-coral/40 to-transparent" />
      <div className="py-6 text-center text-sm text-white/40">
        © {new Date().getFullYear()} StayMate. All rights reserved.
      </div>
    </footer>
  );
}
