"use client";

// Admin → Settings  (URL: "/admin/settings")
// Initial config. Right now: a toggle for auto-approving new property listings.

import { useEffect, useState } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { apiGet, apiPatch } from "@/lib/api";
import { getToken } from "@/lib/auth";

export default function AdminSettingsPage() {
  const [autoApprove, setAutoApprove] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const d = await apiGet("/settings", getToken());
        setAutoApprove(d.settings?.auto_approve_listings === "true");
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function toggle() {
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

  return (
    <AdminShell active="settings">
      <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
      <p className="mt-1 text-slate-500">Configure how StayMate behaves.</p>

      {error && (
        <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      <div className="mt-6 max-w-2xl rounded-2xl border border-slate-200 bg-white p-6">
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
            onClick={toggle}
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
    </AdminShell>
  );
}
