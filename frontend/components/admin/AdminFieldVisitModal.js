"use client";

// Admin popup to record a FIELD VISIT — our team physically went to the place
// and confirmed it exists. Attach proof (photos / video / audio) + remarks.
// Marking a property as visited is what shows the public "Verified" shield.

import { useState } from "react";
import { apiPost, apiPatch, uploadToPresignedUrl } from "@/lib/api";
import { getToken } from "@/lib/auth";

export default function AdminFieldVisitModal({ property, onClose, onChanged }) {
  const p = property;
  const [remarks, setRemarks] = useState(p.field_visit_remarks || "");
  // Keys already saved on the property (kept so editing remarks doesn't drop them).
  const [keys, setKeys] = useState(Array.isArray(p.field_visit_proof_keys) ? p.field_visit_proof_keys : []);
  const existingUrls = Array.isArray(p.field_visit_proof_urls) ? p.field_visit_proof_urls : [];
  const [uploads, setUploads] = useState([]); // newly added files this session
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function pickFiles(e) {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    for (const file of files) {
      const tag = `${file.name}-${file.size}`;
      setUploads((u) => [...u, { tag, name: file.name, progress: 0, key: null }]);
      try {
        const presigned = await apiPost(
          "/uploads/presign",
          { folder: "proof", fileName: file.name, mimeType: file.type, size: file.size },
          getToken()
        );
        await uploadToPresignedUrl(presigned, file, (pr) =>
          setUploads((u) => u.map((x) => (x.tag === tag ? { ...x, progress: pr } : x)))
        );
        setUploads((u) => u.map((x) => (x.tag === tag ? { ...x, progress: 100, key: presigned.key } : x)));
        setKeys((k) => [...k, presigned.key]);
      } catch (err) {
        setError(err.message || "Upload failed");
        setUploads((u) => u.filter((x) => x.tag !== tag));
      }
    }
  }

  const uploading = uploads.some((u) => u.progress < 100);

  async function save(visited) {
    setBusy(true);
    setError("");
    try {
      const { property: updated } = await apiPatch(
        `/properties/${p.id}/field-visit`,
        { field_visited: visited, remarks: remarks || null, proof_keys: visited ? keys : [] },
        getToken()
      );
      onChanged(updated);
      onClose();
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] grid place-items-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
          <h2 className="font-semibold text-slate-900">Record field visit</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100" aria-label="Close">
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 5l10 10M15 5L5 15" strokeLinecap="round" /></svg>
          </button>
        </div>

        <div className="space-y-4 p-5">
          <p className="text-sm text-slate-600">
            Confirm our team physically visited <strong>{p.title}</strong> and it exists.
          </p>

          <label className="block">
            <span className="text-xs text-slate-500">Remarks (optional)</span>
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              rows={2}
              placeholder="e.g. Visited on 28 Jun, matches photos, owner present."
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand"
            />
          </label>

          <div>
            <span className="text-xs text-slate-500">Proof — photos / video / audio</span>
            <div className="mt-1">
              <label className="cursor-pointer rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50">
                + Add files
                <input type="file" multiple className="hidden" onChange={pickFiles} accept="image/*,video/*,audio/*,application/pdf" />
              </label>
            </div>
            {existingUrls.length > 0 && (
              <p className="mt-2 text-xs text-slate-500">{existingUrls.length} proof file(s) already saved.</p>
            )}
            {uploads.length > 0 && (
              <ul className="mt-2 space-y-1 text-sm text-slate-600">
                {uploads.map((u) => (
                  <li key={u.tag} className="truncate">
                    {u.name} {u.progress < 100 ? `· ${u.progress}%` : "✓"}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>

        <div className="flex flex-wrap gap-2 border-t border-slate-100 px-5 py-4">
          <button
            onClick={() => save(true)}
            disabled={busy || uploading}
            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
          >
            {busy ? "Saving…" : "📍 Mark as visited"}
          </button>
          {p.field_visited && (
            <button
              onClick={() => save(false)}
              disabled={busy}
              className="rounded-lg border border-amber-300 px-4 py-2 text-sm font-medium text-amber-700 hover:bg-amber-50 disabled:opacity-50"
            >
              Clear field visit
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
