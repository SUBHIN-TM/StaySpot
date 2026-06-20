"use client";

// OWNER login page  (URL: "/owner/login")
// Same methods as the user login (Google / password / OTP) but EMERALD-themed
// so the owner side is visually distinct. Only accounts with role "owner" are
// allowed in — others are rejected. A successful login overwrites any previous
// (user) session, so there's never a token clash.

import { GoogleLogin } from "@react-oauth/google";
import { useState } from "react";
import Link from "next/link";
import { apiPost } from "@/lib/api";
import { saveUser, clearUser } from "@/lib/userAuth";
import PasswordInput from "@/components/PasswordInput";

export default function OwnerLoginPage() {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState("password");
  const [otpSent, setOtpSent] = useState(false);
  const [otpInput, setOtpInput] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);

  // Accept the login only if the account is an owner; otherwise reject cleanly.
  function finishLogin(data) {
    if (data.user?.role !== "owner") {
      clearUser();
      setError("This account isn’t registered as an owner. Please sign up as an owner.");
      return;
    }
    clearUser(); // drop any previous (user) session — no clash
    saveUser(data.token, data.user);
    window.location.assign("/owner");
  }

  async function handleGoogle(credentialResponse) {
    setError("");
    try {
      const data = await apiPost("/auth/google", {
        credential: credentialResponse.credential,
        role: "owner",
      });
      finishLogin(data);
    } catch (err) {
      setError(err.message || "Sign-in failed");
    }
  }

  async function handlePasswordLogin(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await apiPost("/auth/login", { identifier, password });
      finishLogin(data);
    } catch (err) {
      setError(err.message || "Invalid username/email or password");
    } finally {
      setLoading(false);
    }
  }

  async function sendOtp() {
    setError("");
    setInfo("");
    if (!identifier.trim()) return setError("Enter your username or email first.");
    setLoading(true);
    try {
      const res = await apiPost("/auth/send-otp", { purpose: "login", identifier });
      setOtpSent(true);
      setInfo(`We emailed a 6-digit code to ${res.email || "your email"}.`);
    } catch (err) {
      setError(err.message || "Couldn’t send the code");
    } finally {
      setLoading(false);
    }
  }

  async function verifyOtpAndLogin() {
    setError("");
    setLoading(true);
    try {
      const data = await apiPost("/auth/otp-login", { identifier, code: otpInput });
      finishLogin(data);
    } catch (err) {
      setError(err.message || "OTP login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-emerald-50 px-4 py-10">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-md ring-1 ring-emerald-100">
        <Link href="/" className="mb-6 flex items-center justify-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-emerald-600 font-bold text-white">
            S
          </span>
          <span className="text-xl font-bold text-slate-900">StayMate</span>
          <span className="rounded bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
            OWNER
          </span>
        </Link>

        <h1 className="text-center text-xl font-semibold text-slate-900">Owner sign in</h1>
        <p className="mt-1 text-center text-sm text-slate-500">Manage and list your properties.</p>

        {error && (
          <p className="mt-5 rounded-lg bg-red-50 px-3 py-2 text-center text-sm text-red-700">{error}</p>
        )}
        {info && !error && (
          <p className="mt-5 rounded-lg bg-emerald-50 px-3 py-2 text-center text-sm text-emerald-700">{info}</p>
        )}

        <div className="mt-6 flex justify-center">
          {clientId ? (
            <GoogleLogin
              onSuccess={handleGoogle}
              onError={() => setError("Google sign-in was cancelled or failed.")}
              theme="outline"
              size="large"
              width="320"
            />
          ) : (
            <p className="text-sm text-slate-400">Google sign-in isn’t configured yet.</p>
          )}
        </div>

        <div className="my-6 flex items-center gap-3 text-xs text-slate-400">
          <span className="h-px flex-1 bg-slate-200" />
          OR
          <span className="h-px flex-1 bg-slate-200" />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">Username or email</label>
          <input
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            placeholder="username or you@gmail.com"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-emerald-500"
          />
        </div>

        {mode === "password" && (
          <form onSubmit={handlePasswordLogin} className="mt-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">Password</label>
              <PasswordInput
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-emerald-500"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-emerald-600 py-2.5 font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
            >
              {loading ? "Signing in…" : "Log in with password"}
            </button>
            <button
              type="button"
              onClick={() => { setMode("otp"); setError(""); setInfo(""); }}
              className="w-full text-center text-sm font-medium text-emerald-700 hover:underline"
            >
              Log in with OTP instead
            </button>
          </form>
        )}

        {mode === "otp" && (
          <div className="mt-4 space-y-4">
            {!otpSent ? (
              <button
                type="button"
                onClick={sendOtp}
                disabled={loading}
                className="w-full rounded-lg bg-slate-900 py-2.5 font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
              >
                {loading ? "Sending…" : "Send OTP to my email"}
              </button>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Enter the code</label>
                  <input
                    value={otpInput}
                    onChange={(e) => setOtpInput(e.target.value)}
                    placeholder="6-digit code from your email"
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-emerald-500"
                  />
                </div>
                <button
                  type="button"
                  onClick={verifyOtpAndLogin}
                  disabled={loading}
                  className="w-full rounded-lg bg-emerald-600 py-2.5 font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                >
                  {loading ? "Verifying…" : "Verify & log in"}
                </button>
              </>
            )}
            <button
              type="button"
              onClick={() => { setMode("password"); setOtpSent(false); setOtpInput(""); setError(""); setInfo(""); }}
              className="w-full text-center text-sm font-medium text-emerald-700 hover:underline"
            >
              Use password instead
            </button>
          </div>
        )}

        <p className="mt-6 text-center text-sm text-slate-500">
          New owner?{" "}
          <Link href="/owner/signup" className="font-medium text-emerald-700 hover:underline">
            Create an owner account
          </Link>
        </p>
        <Link href="/" className="mt-3 block text-center text-sm text-slate-400 hover:text-emerald-700">
          ← Back to website
        </Link>
      </div>
    </div>
  );
}
