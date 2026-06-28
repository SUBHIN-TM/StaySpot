"use client";

// Admin popup to verify an OWNER's phone after a verification call.
// Shows the submitted number, an optional note, and an OPTIONAL proof file
// (call recording / screenshot / pdf — uploaded direct-to-storage). Confirm
// flips the owner to phone_verified, which:
//   • shows the green ✓ tick next to their name, and
//   • unlocks admin approval of their listings.

import { useState } from "react";
import { apiPost, apiPatch, uploadToPresignedUrl } from "@/lib/api";
import { getToken } from "@/lib/auth";

export default function AdminVerifyOwnerModal({ owner, onClose, onChanged }) {
  const [note, setNote] = useState(owner.phone_verify_note || "");
  const [proofKey, setProofKey] = useState(null);
  const [proofName, setProofName] = useState("");
  const [progress, setProgress] = useState(null); // 0–100 while uploading
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function pickProof(e) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-picking the same file
    if (!file) return;
    setError("");
    setProofName(file.name);
    setProgress(0);
    try {
      const presigned = await apiPost(
        "/uploads/presign",
        { folder: "proof", fileName: file.name, mimeType: file.type, size: file.size },
        getToken()
      );
      await uploadToPresignedUrl(presigned, file, setProgress);
      setProofKey(presigned.key);
      setProgress(100);
    } catch (err) {
      setError(err.message || "Upload failed");
      setProofName("");
      setProgress(null);
    }
  }

  async function confirm(verified) {
    setBusy(true);
    setError("");
    try {
      const { user } = await apiPatch(
        `/users/${owner.id}/verify-phone`,
        { phone_verified: verified, note: note || null, proof_key: verified ? proofKey : null },
        getToken()
      );
      onChanged(user);
      onClose();
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
          <h2 className="font-semibold text-slate-900">Verify owner</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100" aria-label="Close">
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 5l10 10M15 5L5 15" strokeLinecap="round" /></svg>
          </button>
        </div>

        <div className="space-y-4 p-5">
          <div>
            <p className="text-xs text-slate-500">Owner</p>
            <p className="font-medium capitalize text-slate-900">{owner.name}</p>
            <p className="text-sm text-slate-500">{owner.email}</p>
          </div>

          <div>
            <p className="text-xs text-slate-500">Phone number (call this to confirm)</p>
            <p className="text-lg font-semibold text-slate-900">
              {owner.mobile_number ? `+91 ${owner.mobile_number}` : "— not submitted —"}
            </p>
          </div>

          <label className="block">
            <span className="text-xs text-slate-500">Note (optional)</span>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              placeholder="e.g. Spoke to owner, confirmed identity."
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand"
            />
          </label>

          <div>
            <span className="text-xs text-slate-500">Proof (optional) — recording / screenshot / pdf</span>
            <div className="mt-1 flex items-center gap-2">
              <label className="cursor-pointer rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50">
                Choose file
                <input type="file" className="hidden" onChange={pickProof} accept="image/*,video/*,audio/*,application/pdf" />
              </label>
              {proofName && (
                <span className="truncate text-sm text-slate-600">
                  {proofName}
                  {progress !== null && progress < 100 ? ` · ${progress}%` : proofKey ? " ✓" : ""}
                </span>
              )}
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>

        <div className="flex flex-wrap gap-2 border-t border-slate-100 px-5 py-4">
          <button
            onClick={() => confirm(true)}
            disabled={busy || !owner.mobile_number || (progress !== null && progress < 100)}
            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
          >
            {busy ? "Saving…" : "✓ Confirm verified"}
          </button>
          {owner.phone_verified && (
            <button
              onClick={() => confirm(false)}
              disabled={busy}
              className="rounded-lg border border-amber-300 px-4 py-2 text-sm font-medium text-amber-700 hover:bg-amber-50 disabled:opacity-50"
            >
              Remove verification
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
