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
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <h2 className="text-lg font-semibold text-slate-900">{post.title}</h2>

      <div className="mt-2 flex flex-wrap gap-2 text-xs">
        {post.preferred_location && (
          <span className="rounded-full bg-blue-50 px-2.5 py-1 font-medium text-brand">
            📍 {post.preferred_location}
          </span>
        )}
        {post.budget != null && (
          <span className="rounded-full bg-slate-100 px-2.5 py-1 font-medium text-slate-600">
            💰 ₹{Number(post.budget).toLocaleString("en-IN")}/mo
          </span>
        )}
        {fmtDate(post.move_in_date) && (
          <span className="rounded-full bg-slate-100 px-2.5 py-1 font-medium text-slate-600">
            📅 from {fmtDate(post.move_in_date)}
          </span>
        )}
      </div>

      {post.description && (
        <p className="mt-3 line-clamp-3 text-sm text-slate-600">{post.description}</p>
      )}

      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
        <span className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center overflow-hidden rounded-full bg-brand text-xs font-bold text-white">
            {post.user?.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={post.user.avatar_url} alt="" referrerPolicy="no-referrer" className="h-full w-full object-cover" />
            ) : (
              (post.user?.name || "U").charAt(0).toUpperCase()
            )}
          </span>
          <span className="text-sm font-medium capitalize text-slate-700">
            {post.user?.name || "User"}
          </span>
        </span>
        <RoommatePostActions post={post} onDeleted={onDeleted} />
      </div>
    </div>
  );
}
