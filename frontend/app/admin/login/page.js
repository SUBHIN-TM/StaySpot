"use client";

// Admin login page  (URL: "/admin/login")
// Posts to the backend's /api/auth/login, checks the returned role is "admin",
// stores the token, then sends the user to the dashboard.

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiPost } from "@/lib/api";
import { saveAuth } from "@/lib/auth";
import PasswordInput from "@/components/PasswordInput";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await apiPost("/auth/login", { email, password });
      // Only admins may use this dashboard.
      if (data.user?.role !== "admin") {
        setError("This account is not an admin.");
        setLoading(false);
        return;
      }
      saveAuth(data.token, data.user);
      router.replace("/admin");
    } catch (err) {
      setError(err.message || "Login failed");
      setLoading(false);
    }
  }

  return (
    <div className="grid min-h-screen place-items-center px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-md">
        {/* Logo */}
        <Link href="/" className="mb-6 flex items-center justify-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand font-bold text-white">
            S
          </span>
          <span className="text-xl font-bold text-slate-900">StayMate</span>
        </Link>

        <h1 className="text-center text-xl font-semibold text-slate-900">Admin sign in</h1>
        <p className="mt-1 text-center text-sm text-slate-500">
          Sign in to manage listings and users.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@staymate.com"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-brand"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">Password</label>
            <PasswordInput
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-brand"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-brand py-2.5 font-semibold text-white hover:bg-brand-dark disabled:opacity-60"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <Link href="/" className="mt-6 block text-center text-sm text-slate-500 hover:text-brand">
          ← Back to website
        </Link>
      </div>
    </div>
  );
}
