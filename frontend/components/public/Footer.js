// Site footer shown on all public pages.

import Link from "next/link";

export default function Footer() {
  // Footer link columns. Add/remove items freely — it's just data.
  const columns = [
    {
      title: "Explore",
      links: [
        { href: "/properties", label: "Browse rentals" },
        { href: "/properties", label: "Find roommates" },
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
    <footer className="mt-auto border-t border-slate-200 bg-slate-50">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-4">
        {/* Brand blurb */}
        <div>
          <div className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand font-bold text-white">
              S
            </span>
            <span className="text-xl font-bold text-slate-900">StayMate</span>
          </div>
          <p className="mt-3 text-sm text-slate-500">
            Find your next stay, roommate, or rental space in minutes.
          </p>
        </div>

        {/* Link columns */}
        {columns.map((col) => (
          <div key={col.title}>
            <h3 className="text-sm font-semibold text-slate-900">{col.title}</h3>
            <ul className="mt-3 space-y-2">
              {col.links.map((l, idx) => (
                <li key={idx}>
                  <Link href={l.href} className="text-sm text-slate-500 hover:text-brand">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-slate-200 py-6 text-center text-sm text-slate-400">
        © {new Date().getFullYear()} StayMate. All rights reserved.
      </div>
    </footer>
  );
}
