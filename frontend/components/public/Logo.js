// Parppidam brand mark + wordmark (chosen direction 01: a gabled roof with a gold
// door — "parppidam" is Malayalam for a dwelling). The wordmark is two-tone:
// "Par" in the base colour, "ppidam" in gold, set in the DM Sans heading face.
//
//   tone="light"  → dark text (olive) + sage roof  — for light backgrounds
//   tone="dark"   → light text + soft-sage roof     — for dark / photo backgrounds

import { SAGE, GOLD, OLIVE } from "./palette";

// The roof glyph on its own (also used as the standalone icon / favicon shape).
export function RoofMark({ size = 28, stroke = SAGE, door = GOLD, className }) {
  return (
    <svg width={size} height={size} viewBox="0 0 44 44" fill="none" className={className} aria-hidden="true">
      <path d="M7 21 L22 8.5 L37 21" stroke={stroke} strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M11.5 19.5 V35 H32.5 V19.5" stroke={stroke} strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="19.5" y="26" width="5" height="9" rx="1" fill={door} />
    </svg>
  );
}

export default function Logo({ size = 28, textClass = "text-lg", tone = "light", showWord = true }) {
  const stroke = tone === "dark" ? "#9DB39F" : SAGE;
  const base = tone === "dark" ? "#F3EEE3" : OLIVE;
  return (
    <span className="inline-flex items-center gap-2">
      <RoofMark size={size} stroke={stroke} />
      {showWord && (
        <span
          className={`font-bold leading-none tracking-tight ${textClass}`}
          style={{ color: base, fontFamily: "var(--font-heading), var(--font-sans), sans-serif" }}
        >
          Par<span style={{ color: GOLD }}>ppidam</span>
        </span>
      )}
    </span>
  );
}
