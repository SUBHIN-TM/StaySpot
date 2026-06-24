// A single roommate-post card. Used by /roommates and /roommates/mine.
// `onDeleted` is optional — passed through to the actions (used by "My posts").

import RoommatePostActions from "./RoommatePostActions";

function fmtDate(d) {
  if (!d) return null;
  try {
    return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return null;
  }
}

export default function RoommatePostCard({ post, onDeleted }) {
  return (
    <div className="rounded-2xl border border-ink/10 bg-white p-5 transition hover:-translate-y-1 hover:shadow-xl hover:shadow-grape/10">
      <h2 className="text-lg font-semibold text-ink">{post.title}</h2>

      <div className="mt-2 flex flex-wrap gap-2 text-xs">
        {post.preferred_location && (
          <span className="rounded-full bg-coral/10 px-2.5 py-1 font-medium text-coral">
            📍 {post.preferred_location}
          </span>
        )}
        {post.budget != null && (
          <span className="rounded-full bg-cream px-2.5 py-1 font-medium text-ink/60">
            💰 ₹{Number(post.budget).toLocaleString("en-IN")}/mo
          </span>
        )}
        {fmtDate(post.move_in_date) && (
          <span className="rounded-full bg-cream px-2.5 py-1 font-medium text-ink/60">
            📅 from {fmtDate(post.move_in_date)}
          </span>
        )}
      </div>

      {post.description && (
        <p className="mt-3 line-clamp-3 text-sm text-ink/60">{post.description}</p>
      )}

      <div className="mt-4 flex items-center justify-between border-t border-ink/10 pt-4">
        <span className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-sun via-coral to-grape text-xs font-bold text-white">
            {post.user?.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={post.user.avatar_url} alt="" referrerPolicy="no-referrer" className="h-full w-full object-cover" />
            ) : (
              (post.user?.name || "U").charAt(0).toUpperCase()
            )}
          </span>
          <span className="text-sm font-medium capitalize text-ink/70">
            {post.user?.name || "User"}
          </span>
        </span>
        <RoommatePostActions post={post} onDeleted={onDeleted} />
      </div>
    </div>
  );
}
