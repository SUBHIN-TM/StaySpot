// Infinite scrolling strip of cities & property types — adds motion and quickly
// tells visitors what kinds of stays they'll find. Purely decorative.

export default function Marquee() {
  const items = [
    "Bengaluru", "PG", "Kochi", "Apartments", "Single rooms", "Roommates",
    "Shared flats", "Rentals", "Studios", "Hostels", "Co-living", "₹ Budget-friendly",
  ];
  // Duplicate the list so the -50% scroll loops seamlessly.
  const loop = [...items, ...items];

  return (
    <div className="border-y border-ink/10 bg-white py-5">
      <div className="relative flex overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
        <ul className="marquee-track flex shrink-0 items-center gap-4 pr-4">
          {loop.map((label, i) => (
            <li
              key={i}
              className="flex items-center gap-2 whitespace-nowrap rounded-full border border-ink/10 bg-cream px-5 py-2 text-sm font-medium text-ink/70"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-gradient-to-r from-sun to-grape" />
              {label}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
