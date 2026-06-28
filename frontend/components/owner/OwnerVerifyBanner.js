"use client";

// Owner phone-verification banner shown on the owner dashboard.
// One-time, account-level (NOT per property). Three states, all derived from
// the owner's user record:
//   1. No number yet            → "Human verification needed" + phone form.
//   2. Number set, not verified → "Verification in progress — we'll call you".
//   3. phone_verified           → small "Verified owner" confirmation.
//
// We only COLLECT the number here; an admin verifies it after a phone call.
// The number is private — never shown publicly (see backend serialize.js).

import { useState } from "react";
import { apiPost } from "@/lib/api";
import { getUserToken } from "@/lib/userAuth";

export default function OwnerVerifyBanner({ user, onChange }) {
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // State 3 — already verified. A quiet confirmation chip.
  if (user?.phone_verified) {
    return (
      <div className="mt-6 flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
        <span className="text-base">✓</span>
        <span>
          You’re a <strong>verified owner</strong>. Your listings can show the verified badge.
        </span>
      </div>
    );
  }

  // State 2 — number submitted, waiting for the admin's call.
  if (user?.mobile_number) {
    return (
      <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        <p className="font-semibold">⏳ Verification in progress</p>
        <p className="mt-1">
          Our team will call you on <strong>+91 {user.mobile_number}</strong> to confirm you’re a
          real person. Your listings stay <em>pending</em> until then.
        </p>
        <p className="mt-1 text-xs text-amber-700">
          🔒 Your number is private — it’s only for this one-time verification and is never shown to
          the public or shared with anyone.
        </p>
      </div>
    );
  }

  // State 1 — no number yet. Ask for it.
  async function submit(e) {
    e.preventDefault();
    setError("");
    const ten = phone.replace(/\D/g, "");
    if (!/^[6-9]\d{9}$/.test(ten)) {
      setError("Enter a valid 10-digit mobile number.");
      return;
    }
    setBusy(true);
    try {
      const { user: updated } = await apiPost("/users/me/phone", { mobile_number: ten }, getUserToken());
      onChange?.(updated);
    } catch (err) {
      setError(err.message || "Couldn’t save your number.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-4">
      <p className="font-semibold text-emerald-900">🛡️ Human verification needed</p>
      <p className="mt-1 text-sm text-emerald-800">
        Add your phone number so our team can verify you’re a real person. This is a one-time step —
        once verified, all your listings are covered and can be approved & badged.
      </p>

      <form onSubmit={submit} className="mt-3 flex flex-wrap items-start gap-2">
        <div className="flex overflow-hidden rounded-lg border border-emerald-300 bg-white">
          {/* +91 is locked for now (Kerala/India). More countries can be enabled later. */}
          <span className="grid place-items-center bg-slate-100 px-3 text-sm font-medium text-slate-500">
            +91
          </span>
          <input
            type="tel"
            inputMode="numeric"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="98xxxxxxxx"
            maxLength={10}
            className="w-40 px-3 py-2 text-sm outline-none"
          />
        </div>
        <button
          type="submit"
          disabled={busy}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
        >
          {busy ? "Saving…" : "Submit for verification"}
        </button>
      </form>

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      <p className="mt-2 text-xs text-emerald-700">
        🔒 Your number stays private — only used for this one-time verification, never shown publicly.
      </p>
    </div>
  );
}
