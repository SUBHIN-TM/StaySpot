"use client";

// Profile edit page  (URL: "/profile")  — for logged-in users.
// Edit name + username, and optionally change the password.
// Protected: redirects to /login if there's no signed-in user.

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiPatch } from "@/lib/api";
import { getUserToken, getCurrentUser, saveUser } from "@/lib/userAuth";
import PasswordInput from "@/components/PasswordInput";

export default function ProfilePage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  // On mount: must be logged in; prefill name + username.
  useEffect(() => {
    const u = getCurrentUser();
    if (!u || !getUserToken()) {
      router.replace("/login");
      return;
    }
    setName(u.name || "");
    setUsername(u.username || "");
    setReady(true);
  }, [router]);

  async function handleSave(e) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!name.trim()) return setError("Name can’t be empty.");
    if (!username.trim()) return setError("Username can’t be empty.");
    if (password || confirm) {
      if (password.length < 6) return setError("New password must be at least 6 characters.");
      if (password !== confirm) return setError("Passwords do not match.");
    }

    // Only send the password if the user typed one.
    const body = { name: name.trim(), username: username.trim() };
    if (password) body.password = password;

    setLoading(true);
    try {
      const data = await apiPatch("/users/me", body, getUserToken());
      saveUser(getUserToken(), data.user); // refresh the stored user
      setPassword("");
      setConfirm("");
      setSuccess("Profile updated.");
    } catch (err) {
      setError(err.message || "Couldn’t update profile");
    } finally {
      setLoading(false);
    }
  }

  if (!ready) {
    return <div className="grid min-h-screen place-items-center text-slate-400">Loading…</div>;
  }

  return (
    <div className="grid min-h-screen place-items-center bg-slate-100 px-4 py-10">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-md">
        <Link href="/" className="mb-6 flex items-center justify-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand font-bold text-white">
            S
          </span>
          <span className="text-xl font-bold text-slate-900">StayMate</span>
        </Link>

        <h1 className="text-center text-xl font-semibold text-slate-900">Edit profile</h1>

        {error && (
          <p className="mt-5 rounded-lg bg-red-50 px-3 py-2 text-center text-sm text-red-700">
            {error}
          </p>
        )}
        {success && (
          <p className="mt-5 rounded-lg bg-green-50 px-3 py-2 text-center text-sm text-green-700">
            {success}
          </p>
        )}

        <form onSubmit={handleSave} className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-brand"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">Username</label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-brand"
            />
          </div>

          {/* Password change */}
          <div className="border-t border-slate-100 pt-4">
            <p className="text-sm font-medium text-slate-700">Change password</p>
            <p className="text-xs text-slate-400">Leave blank to keep your current password.</p>
            <PasswordInput
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="New password"
              className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-brand"
            />
            <PasswordInput
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Confirm new password"
              className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-brand"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-brand py-2.5 font-semibold text-white hover:bg-brand-dark disabled:opacity-60"
          >
            {loading ? "Saving…" : "Save changes"}
          </button>
        </form>

        <Link href="/" className="mt-6 block text-center text-sm text-slate-500 hover:text-brand">
          ← Back to website
        </Link>
      </div>
    </div>
  );
}
