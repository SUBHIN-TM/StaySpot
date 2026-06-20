"use client";

// Swipeable image gallery with dots.
// - Mobile: swipe left/right.
// - Desktop: hover to reveal ‹ › arrows; click dots to jump.
// Props: images (array of URLs), alt, heightClass (Tailwind height, e.g. "h-48").

import { useState } from "react";

export default function ImageCarousel({ images = [], alt = "", heightClass = "h-48" }) {
  const [index, setIndex] = useState(0);
  const [touchX, setTouchX] = useState(null);

  // Empty state — coloured placeholder.
  if (!images.length) {
    return (
      <div className={`grid ${heightClass} w-full place-items-center bg-gradient-to-br from-blue-100 to-slate-200 text-4xl`}>
        🏠
      </div>
    );
  }

  const go = (n) => setIndex((n + images.length) % images.length);

  // When the carousel sits inside a clickable card (a link), the control
  // clicks must not also trigger the card's navigation.
  const stop = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  function onTouchStart(e) {
    setTouchX(e.touches[0].clientX);
  }
  function onTouchEnd(e) {
    if (touchX == null) return;
    const dx = e.changedTouches[0].clientX - touchX;
    if (dx > 40) go(index - 1); // swiped right → previous
    else if (dx < -40) go(index + 1); // swiped left → next
    setTouchX(null);
  }

  const multiple = images.length > 1;

  return (
    <div
      className={`group relative ${heightClass} w-full overflow-hidden bg-slate-200`}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={images[index]} alt={alt} className="h-full w-full object-cover" />

      {multiple && (
        <>
          {/* Prev / next arrows (visible on hover for desktop) */}
          <button
            type="button"
            onClick={(e) => { stop(e); go(index - 1); }}
            aria-label="Previous image"
            className="absolute left-2 top-1/2 hidden -translate-y-1/2 rounded-full bg-white/80 p-1.5 text-slate-700 shadow group-hover:block hover:bg-white"
          >
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 15l-5-5 5-5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
          <button
            type="button"
            onClick={(e) => { stop(e); go(index + 1); }}
            aria-label="Next image"
            className="absolute right-2 top-1/2 hidden -translate-y-1/2 rounded-full bg-white/80 p-1.5 text-slate-700 shadow group-hover:block hover:bg-white"
          >
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 5l5 5-5 5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>

          {/* Dots */}
          <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1.5">
            {images.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={(e) => { stop(e); setIndex(i); }}
                aria-label={`Go to image ${i + 1}`}
                className={`h-2 w-2 rounded-full transition ${
                  i === index ? "bg-white" : "bg-white/50 hover:bg-white/80"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
