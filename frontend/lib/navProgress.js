// Manually kick off the global top progress bar for programmatic navigations
// (router.push / router.replace), which the click listener can't see. Call it
// right before the push so the bar shows instantly.
export function startNavProgress() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("navprogress:start"));
  }
}
