"use client";

// "Loved by renters across India" — REAL reviews from StayMate users (seekers &
// owners), fetched on the server and passed in. Logged-in users can leave / edit
// their own star rating + comment right here; logged-out users are sent to login.

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { Star, Send } from "lucide-react";
import { apiPost } from "@/lib/api";
import { getCurrentUser, getUserToken } from "@/lib/userAuth";
import { GOLD, SAGE, OLIVE, LINE } from "./palette";

const EASE = [0.22, 1, 0.36, 1];

// Sentiment-matched comment suggestions, built COMBINATORIALLY: each rating has
// a few openers, middles and closers, and a suggestion is "{opener} — {middle}.
// {closer}". A dozen fragments per rating yields hundreds of natural variations
// (e.g. ★5 alone = 8×6×5 = 240) — so suggestions never feel copy-pasted, with no
// thousands of lines to write and nothing stored in the database. Tapping a star
// rolls a fresh one; the user can edit it freely.
const FRAGMENTS = {
  5: {
    o: ["Excellent experience", "Brilliant platform", "Absolutely loved it", "Top-notch all round", "Couldn't be happier", "A fantastic find", "Genuinely impressed", "Five stars from me"],
    m: ["smooth from search to move-in", "no brokers and zero hassle", "the verified listings built real trust", "chatting with owners was effortless", "everything just worked the way it should", "fast, simple and reliable"],
    c: ["Highly recommend!", "Would absolutely use it again.", "Exactly what house-hunting needed.", "Found my place in no time.", "StayMate made the whole thing easy."],
  },
  4: {
    o: ["Really good experience", "A solid platform", "Happy with how it went", "Worked well for me", "Pretty great overall", "Genuinely useful", "A reliable choice"],
    m: ["finding a place was much easier", "the listings were helpful and clear", "talking to owners was straightforward", "mostly smooth with just a few minor bumps", "browsing and shortlisting felt simple", "it saved me a lot of time"],
    c: ["Would recommend.", "Glad I used it.", "A little polish and it's perfect.", "Did the job nicely.", "I'd come back to it."],
  },
  3: {
    o: ["A decent experience", "It did the job", "Fair enough overall", "Average, but useful", "Okay for what it is", "Mixed feelings"],
    m: ["it works, though there's room to improve", "a few things could be smoother", "nothing wrong, nothing amazing", "I got there in the end", "fine for browsing, slower elsewhere", "useful but a bit rough in places"],
    c: ["Worth a look.", "Could be better with time.", "Does the basics well enough.", "I'd consider it again."],
  },
  2: {
    o: ["Below my expectations", "A frustrating experience", "Not the smoothest", "Could be a lot better", "Left me a bit disappointed", "Struggled with it"],
    m: ["I ran into a few too many issues", "things felt clunky and slow", "it took more effort than it should", "some parts just didn't work for me", "the flow needs real work"],
    c: ["Needs improvement.", "Hope it gets better.", "Wouldn't fully recommend yet.", "Not quite there."],
  },
  1: {
    o: ["Disappointing experience", "Didn't work out for me", "Not what I hoped for", "A rough experience", "Quite frustrating", "Let down overall"],
    m: ["I hit too many problems to recommend it", "barely anything went smoothly", "it needs significant work", "the issues outweighed the good parts", "I gave up before getting far"],
    c: ["Needs a lot of improvement.", "Couldn't recommend it.", "Hope they fix the basics.", "Not for me."],
  },
};

const rand = (arr) => arr[Math.floor(Math.random() * arr.length)];

function suggestionFor(n) {
  const f = FRAGMENTS[n];
  if (!f) return "";
  return `${rand(f.o)} — ${rand(f.m)}. ${rand(f.c)}`;
}

function initials(name = "") {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return (parts.slice(0, 2).map((p) => p[0]).join("") || "U").toUpperCase();
}

// Subtitle under a reviewer's name: their occupation if set, else a role label.
function roleLabel(user) {
  if (user?.occupation) return user.occupation;
  if (user?.role === "owner") return "Property Owner";
  return "Seeker";
}

// Row of 5 stars (display only).
function Stars({ value }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} size={14} fill={i < value ? GOLD : "none"} color={GOLD} />
      ))}
    </div>
  );
}

export default function Testimonials({ initialReviews = [] }) {
  const router = useRouter();
  const [reviews, setReviews] = useState(initialReviews);
  const [user, setUser] = useState(null);

  // Form state
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  // Tracks whether the comment box currently holds an auto-suggestion (true) or
  // text the user typed themselves (false). We only overwrite suggestions, never
  // the user's own words.
  const autofilledRef = useRef(true);

  // On mount, see who's logged in and prefill their existing review (if any).
  useEffect(() => {
    const me = getCurrentUser();
    setUser(me);
    if (me) {
      const mine = initialReviews.find((r) => r.user?.id === me.id);
      if (mine) {
        setRating(mine.rating);
        setComment(mine.comment);
        autofilledRef.current = false; // their real review — don't overwrite it
      }
    }
  }, [initialReviews]);

  // Tapping a star: set the rating and drop in a random suggestion — but only if
  // the box is empty or still showing a previous suggestion.
  function pickStar(n) {
    if (!loggedIn) {
      router.push(`/login?next=${encodeURIComponent("/")}`);
      return;
    }
    setRating(n);
    setDone(false);
    setComment((prev) => {
      if (prev.trim() === "" || autofilledRef.current) {
        autofilledRef.current = true;
        return suggestionFor(n);
      }
      return prev; // keep what the user typed
    });
  }

  const loggedIn = !!user && !!getUserToken();
  const avg = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  async function submit() {
    setError("");
    if (!loggedIn) {
      router.push(`/login?next=${encodeURIComponent("/")}`);
      return;
    }
    if (!rating) return setError("Please pick a star rating.");
    if (comment.trim().length < 3) return setError("Please write a short comment.");

    setSubmitting(true);
    try {
      const { review } = await apiPost(
        "/reviews",
        { rating, comment: comment.trim() },
        getUserToken()
      );
      // Replace my old review (if any) and show mine first.
      setReviews((prev) => [review, ...prev.filter((r) => r.user?.id !== review.user.id)]);
      setDone(true);
    } catch (e) {
      setError(e.message || "Couldn't submit your review.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="py-24 px-6" style={{ background: "var(--color-mist)" }}>
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <motion.p initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.5 }} className="text-sm font-bold uppercase tracking-widest mb-3" style={{ color: GOLD }}>
            What people say
          </motion.p>
          <motion.h2 initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.5 }} transition={{ delay: 0.08 }} className="text-4xl font-bold" style={{ color: OLIVE }}>
            Loved by renters across India
          </motion.h2>
          {avg && (
            <div className="mt-4 inline-flex items-center gap-2 rounded-full px-4 py-1.5" style={{ background: "white", border: `1px solid ${LINE}` }}>
              <Stars value={Math.round(avg)} />
              <span className="text-sm font-semibold" style={{ color: OLIVE }}>{avg}</span>
              <span className="text-sm" style={{ color: "#8A9A92" }}>· {reviews.length} review{reviews.length === 1 ? "" : "s"}</span>
            </div>
          )}
        </div>

        {/* ── Write a review ─────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          className="mx-auto mb-12 max-w-2xl rounded-3xl p-6 sm:p-8"
          style={{ background: "white", border: `1px solid ${LINE}`, boxShadow: "0 4px 20px rgba(30,37,33,.06)" }}
        >
          <h3 className="text-lg font-bold mb-1" style={{ color: OLIVE }}>
            {loggedIn ? "Rate your StayMate experience" : "Share your experience"}
          </h3>
          <p className="text-sm mb-4" style={{ color: "#5A6B63" }}>
            {loggedIn
              ? "Tap a star and we'll suggest a comment — edit it however you like."
              : "Log in to leave a star rating and a short review."}
          </p>

          {/* Star picker */}
          <div className="flex items-center gap-1.5 mb-4" onMouseLeave={() => setHover(0)}>
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => pickStar(n)}
                onMouseEnter={() => setHover(n)}
                aria-label={`${n} star${n > 1 ? "s" : ""}`}
                className="transition-transform hover:scale-110"
              >
                <Star size={28} fill={(hover || rating) >= n ? GOLD : "none"} color={GOLD} />
              </button>
            ))}
            {rating > 0 && <span className="ml-2 text-sm font-medium" style={{ color: "#5A6B63" }}>{rating}/5</span>}
          </div>

          <textarea
            value={comment}
            onChange={(e) => { setComment(e.target.value); autofilledRef.current = false; setDone(false); }}
            onFocus={() => { if (!loggedIn) router.push(`/login?next=${encodeURIComponent("/")}`); }}
            placeholder={loggedIn ? "Tell others how StayMate worked for you…" : "Log in to write your review…"}
            maxLength={600}
            rows={3}
            readOnly={!loggedIn}
            className="w-full rounded-2xl px-4 py-3 text-sm outline-none resize-none"
            style={{ background: "var(--color-mist)", border: `1px solid ${LINE}`, color: OLIVE }}
          />

          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
          {done && !error && <p className="mt-2 text-sm" style={{ color: SAGE }}>Thanks for sharing your review! 🙌</p>}

          <div className="mt-4 flex items-center justify-end">
            {loggedIn ? (
              <motion.button
                type="button"
                onClick={submit}
                disabled={submitting}
                whileHover={submitting ? {} : { scale: 1.04, y: -2 }}
                whileTap={submitting ? {} : { scale: 0.97 }}
                className="inline-flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-semibold text-white transition-colors disabled:opacity-60"
                style={{ background: SAGE, boxShadow: `0 8px 22px ${SAGE}55` }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "#3C4A41"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = SAGE; }}
              >
                {submitting ? "Submitting…" : "Submit review"} <Send size={14} />
              </motion.button>
            ) : (
              <motion.button
                type="button"
                onClick={() => router.push(`/login?next=${encodeURIComponent("/")}`)}
                whileHover={{ scale: 1.04, y: -2 }}
                whileTap={{ scale: 0.97 }}
                className="inline-flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-semibold text-white transition-colors"
                style={{ background: SAGE, boxShadow: `0 8px 22px ${SAGE}55` }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "#3C4A41"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = SAGE; }}
              >
                Log in to review
              </motion.button>
            )}
          </div>
        </motion.div>

        {/* ── Reviews grid ───────────────────────────────────────────────── */}
        {reviews.length === 0 ? (
          <p className="text-center text-sm" style={{ color: "#8A9A92" }}>
            No reviews yet — be the first to share your experience.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {reviews.map((r, i) => (
              <motion.div
                key={r.id}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ delay: 0.05 + (i % 3) * 0.1, duration: 0.6, ease: EASE }}
                whileHover={{ y: -8 }}
                className="p-6 rounded-3xl"
                style={{ background: "rgba(255,255,255,.9)", border: `1px solid ${LINE}`, backdropFilter: "blur(14px)", boxShadow: "0 4px 20px rgba(30,37,33,.06)" }}
              >
                <div className="mb-4"><Stars value={r.rating} /></div>
                <p className="text-sm leading-relaxed mb-6" style={{ color: "#3A4A42" }}>&ldquo;{r.comment}&rdquo;</p>
                <div className="flex items-center gap-3">
                  {r.user?.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={r.user.avatar_url} alt={r.user.name} referrerPolicy="no-referrer" className="w-10 h-10 rounded-full object-cover" style={{ border: `2px solid ${GOLD}55` }} />
                  ) : (
                    <span className="grid h-10 w-10 place-items-center rounded-full text-sm font-bold text-white" style={{ background: SAGE, border: `2px solid ${GOLD}55` }}>
                      {initials(r.user?.name)}
                    </span>
                  )}
                  <div>
                    <div className="text-sm font-bold capitalize" style={{ color: OLIVE }}>{r.user?.name || "StayMate user"}</div>
                    <div className="text-xs" style={{ color: "#8A9A92" }}>{roleLabel(r.user)}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
