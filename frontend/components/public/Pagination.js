// Premium pagination for the /properties browse page.
//
// Server component: every control is a plain <Link> that preserves the current
// filters and just swaps `page`, so it works without client JS and keeps the
// page shareable. Styled to the sage/cream theme to match the cards.
//
// `baseQuery` is the current URL query string WITHOUT `page` (e.g.
// "district=Kochi&sort=price_low"); we append `&page=N` to it.

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

// Build a compact page list with ellipses, e.g. 1 … 4 5 [6] 7 8 … 20.
// Always keeps the first/last page and one neighbour on each side of current.
function pageItems(current, total) {
  const items = [];
  for (let p = 1; p <= total; p++) {
    const isEdge = p === 1 || p === total;
    const isNear = p >= current - 1 && p <= current + 1;
    if (isEdge || isNear) {
      items.push(p);
    } else if (items[items.length - 1] !== "…") {
      items.push("…");
    }
  }
  return items;
}

export default function Pagination({ page, totalPages, baseQuery = "" }) {
  if (!totalPages || totalPages <= 1) return null;

  const href = (p) => `/properties?${baseQuery ? `${baseQuery}&` : ""}page=${p}`;
  const items = pageItems(page, totalPages);

  // Shared pill geometry so arrows + numbers line up perfectly.
  const pill =
    "inline-flex h-10 min-w-10 items-center justify-center rounded-xl px-3 text-sm font-semibold transition";

  // Prev / Next: a real Link when usable, a muted disabled span at the edges.
  const Arrow = ({ dir }) => {
    const isPrev = dir === "prev";
    const target = isPrev ? page - 1 : page + 1;
    const disabled = isPrev ? page <= 1 : page >= totalPages;
    const Icon = isPrev ? ChevronLeft : ChevronRight;
    const label = isPrev ? "Previous" : "Next";
    const base = `${pill} gap-1 border`;

    if (disabled) {
      return (
        <span className={`${base} cursor-not-allowed border-line bg-white text-ink/25`} aria-disabled="true">
          {isPrev && <Icon size={16} />}
          <span className="hidden sm:inline">{label}</span>
          {!isPrev && <Icon size={16} />}
        </span>
      );
    }
    return (
      <Link href={href(target)} scroll className={`${base} border-line bg-white text-ink hover:border-sage hover:text-sage`} aria-label={label}>
        {isPrev && <Icon size={16} />}
        <span className="hidden sm:inline">{label}</span>
        {!isPrev && <Icon size={16} />}
      </Link>
    );
  };

  return (
    <nav className="mt-12 flex flex-col items-center gap-3" aria-label="Pagination">
      <div className="flex items-center gap-1.5">
        <Arrow dir="prev" />

        {items.map((it, idx) =>
          it === "…" ? (
            <span key={`gap-${idx}`} className="inline-flex h-10 w-8 items-center justify-center text-ink/30">
              …
            </span>
          ) : it === page ? (
            <span
              key={it}
              aria-current="page"
              className={`${pill} bg-sage text-white shadow-[0_4px_14px_rgba(74,90,80,.35)]`}
            >
              {it}
            </span>
          ) : (
            <Link
              key={it}
              href={href(it)}
              scroll
              className={`${pill} border border-line bg-white text-ink hover:border-sage hover:text-sage`}
            >
              {it}
            </Link>
          )
        )}

        <Arrow dir="next" />
      </div>

      <p className="text-xs text-ink/45">
        Page {page} of {totalPages}
      </p>
    </nav>
  );
}
