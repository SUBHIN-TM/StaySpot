"use client";

// Admin → Settings  (URL: "/admin/settings")
// • Auto-approve new listings (toggle)
// • Orphaned uploads: TTL before the cleanup sweep, + a manual flush.

import { useEffect, useState } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { apiGet, apiPatch, apiPost } from "@/lib/api";
import { getToken } from "@/lib/auth";

export default function AdminSettingsPage() {
  const [autoApprove, setAutoApprove] = useState(false);
  const [ttl, setTtl] = useState("60"); // pending_upload_ttl_minutes
  const [maxImageMb, setMaxImageMb] = useState("8");
  const [maxVideoMb, setMaxVideoMb] = useState("50");
  const [pending, setPending] = useState(0); // current orphan candidates
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [flushing, setFlushing] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function load() {
    const d = await apiGet("/settings", getToken());
    setAutoApprove(d.settings?.auto_approve_listings === "true");
    setTtl(d.settings?.pending_upload_ttl_minutes || "60");
    setMaxImageMb(d.settings?.max_image_mb || "8");
    setMaxVideoMb(d.settings?.max_video_mb || "50");
    setPending(d.pendingUploads ?? 0);
  }

  useEffect(() => {
    (async () => {
      try {
        await load();
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function toggleAutoApprove() {
    const next = !autoApprove;
    setAutoApprove(next); // optimistic
    setSaving(true);
    setError("");
    try {
      await apiPatch("/settings", { auto_approve_listings: next }, getToken());
    } catch (e) {
      setAutoApprove(!next); // revert on failure
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function saveTtl() {
    const n = parseInt(ttl, 10);
    if (!Number.isFinite(n) || n < 1) return setError("TTL must be a whole number of minutes (≥ 1).");
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const d = await apiPatch("/settings", { pending_upload_ttl_minutes: n }, getToken());
      setPending(d.pendingUploads ?? pending);
      setNotice("Saved.");
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function saveLimits() {
    const img = parseInt(maxImageMb, 10);
    const vid = parseInt(maxVideoMb, 10);
    if (!Number.isFinite(img) || img < 1 || img > 1024) return setError("Image size must be 1–1024 MB.");
    if (!Number.isFinite(vid) || vid < 1 || vid > 1024) return setError("Video size must be 1–1024 MB.");
    setSaving(true);
    setError("");
    setNotice("");
    try {
      await apiPatch("/settings", { max_image_mb: img, max_video_mb: vid }, getToken());
      setNotice("Saved.");
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function flushNow() {
    setFlushing(true);
    setError("");
    setNotice("");
    try {
      const d = await apiPost("/settings/flush-pending", {}, getToken());
      setPending(d.pendingUploads ?? 0);
      setNotice(`Deleted ${d.deleted} pending upload(s)${d.failed ? `, ${d.failed} failed` : ""}.`);
    } catch (e) {
      setError(e.message);
    } finally {
      setFlushing(false);
    }
  }

  const card = "mt-6 max-w-2xl rounded-2xl border border-slate-200 bg-white p-6";

  return (
    <AdminShell active="settings">
      <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
      <p className="mt-1 text-slate-500">Configure how StayMate behaves.</p>

      {error && (
        <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}
      {notice && (
        <p className="mt-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{notice}</p>
      )}

      {/* Auto-approve listings */}
      <div className={card}>
        <div className="flex items-start justify-between gap-6">
          <div>
            <h2 className="font-semibold text-slate-900">Auto-approve new listings</h2>
            <p className="mt-1 text-sm text-slate-500">
              <strong>On:</strong> a property goes live the moment an owner creates it.<br />
              <strong>Off:</strong> new properties stay <em>pending</em> until you approve them
              in the Properties page.
            </p>
          </div>

          {/* Toggle switch */}
          <button
            type="button"
            onClick={toggleAutoApprove}
            disabled={loading || saving}
            aria-pressed={autoApprove}
            className={`relative h-7 w-12 shrink-0 rounded-full transition disabled:opacity-50 ${
              autoApprove ? "bg-brand" : "bg-slate-300"
            }`}
          >
            <span
              className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all ${
                autoApprove ? "left-[22px]" : "left-0.5"
              }`}
            />
          </button>
        </div>

        <p className="mt-4 text-sm font-medium text-slate-600">
          Status:{" "}
          {loading ? (
            "…"
          ) : autoApprove ? (
            <span className="text-green-600">Automatic — listings publish instantly</span>
          ) : (
            <span className="text-amber-600">Manual — you approve each listing</span>
          )}
        </p>
      </div>

      {/* Upload size limits */}
      <div className={card}>
        <h2 className="font-semibold text-slate-900">Upload size limits</h2>
        <p className="mt-1 text-sm text-slate-500">
          Maximum file size owners can attach to a listing. Enforced in the browser
          (the file is rejected before uploading) and again on the server.
        </p>

        <div className="mt-4 flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">Max photo (MB)</label>
            <input
              type="number"
              min={1}
              max={1024}
              value={maxImageMb}
              onChange={(e) => setMaxImageMb(e.target.value)}
              disabled={loading}
              className="mt-1 w-28 rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-brand"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Max video (MB)</label>
            <input
              type="number"
              min={1}
              max={1024}
              value={maxVideoMb}
              onChange={(e) => setMaxVideoMb(e.target.value)}
              disabled={loading}
              className="mt-1 w-28 rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-brand"
            />
          </div>
          <button
            type="button"
            onClick={saveLimits}
            disabled={loading || saving}
            className="rounded-lg bg-brand px-5 py-2 font-semibold text-white hover:opacity-90 disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>

      {/* Orphaned uploads cleanup */}
      <div className={card}>
        <h2 className="font-semibold text-slate-900">Unused attachment cleanup</h2>
        <p className="mt-1 text-sm text-slate-500">
          When someone attaches a photo or video but never submits the listing, the file is
          uploaded but unused. A background sweep deletes anything left unattached for longer
          than this many minutes.
        </p>

        <div className="mt-4 flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-sm font-medium text-slate-700">Delete after (minutes)</label>
            <input
              type="number"
              min={1}
              value={ttl}
              onChange={(e) => setTtl(e.target.value)}
              disabled={loading}
              className="mt-1 w-32 rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-brand"
            />
          </div>
          <button
            type="button"
            onClick={saveTtl}
            disabled={loading || saving}
            className="rounded-lg bg-brand px-5 py-2 font-semibold text-white hover:opacity-90 disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
          <p className="text-sm text-slate-600">
            Currently waiting:{" "}
            <span className="font-semibold text-slate-900">{loading ? "…" : pending}</span>{" "}
            pending upload{pending === 1 ? "" : "s"}
          </p>
          <button
            type="button"
            onClick={flushNow}
            disabled={loading || flushing}
            className="rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
          >
            {flushing ? "Flushing…" : "Flush pending now"}
          </button>
        </div>
      </div>
    </AdminShell>
  );
}
