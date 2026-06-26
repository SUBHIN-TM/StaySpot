"use client";

// User login page  (URL: "/login")  — seekers/owners, NOT admins.
//
// Three ways to log in:
//   1. Google           → direct, one click.
//   2. Username/email + password.
//   3. Username/email + OTP  → a real code is emailed by the backend.

import { GoogleLogin } from "@react-oauth/google";
import { useEffect, useState } from "react";
import Link from "next/link";
import { apiPost } from "@/lib/api";
import { saveUser, getNextPath } from "@/lib/userAuth";
import { consumePendingWishlist } from "@/lib/wishlist";
import PasswordInput from "@/components/PasswordInput";

export default function LoginPage() {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  const [identifier, setIdentifier] = useState(""); // username OR email
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState("password"); // "password" | "otp"

  // OTP state
  const [otpSent, setOtpSent] = useState(false);
  const [otpInput, setOtpInput] = useState("");

  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false); // verify / password buttons
  const [sending, setSending] = useState(false); // send / resend OTP button

  // Where to go after a successful login: the page the user came from (?next=…),
  // or home. Read once on mount.
  const [nextUrl, setNextUrl] = useState("/");
  useEffect(() => {
    setNextUrl(getNextPath("/"));
  }, []);

  // 1. Google → direct login.
  async function handleGoogle(credentialResponse) {
    setError("");
    try {
      const data = await apiPost("/auth/google", { credential: credentialResponse.credential });
      saveUser(data.token, data.user);
      await consumePendingWishlist(data.token); // save the heart they tapped, if any
      window.location.assign(nextUrl);
    } catch (err) {
      setError(err.message || "Sign-in failed");
    }
  }

  // 2. Username/email + password.
  async function handlePasswordLogin(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await apiPost("/auth/login", { identifier, password });
      saveUser(data.token, data.user);
      await consumePendingWishlist(data.token);
      window.location.assign(nextUrl);
    } catch (err) {
      setError(err.message || "Invalid username/email or password");
      setLoading(false);
    }
  }

  // 3a. Ask the backend to email a login code. Clears the old message + any
  // typed code first, so it's clear that a brand-new code has been emailed.
  async function sendOtp() {
    setError("");
    setInfo("");
    if (!identifier.trim()) {
      setError("Enter your username or email first.");
      return;
    }
    const isResend = otpSent;
    setSending(true);
    try {
      const res = await apiPost("/auth/send-otp", { purpose: "login", identifier });
      setOtpInput(""); // drop any previously typed code
      setOtpSent(true);
      setInfo(
        isResend
          ? `We sent a new 6-digit code to ${res.email || "your email"}.`
          : `We emailed a 6-digit code to ${res.email || "your email"}.`
      );
    } catch (err) {
      setError(err.message || "Couldn’t send the code");
    } finally {
      setSending(false);
    }
  }

  // 3b. Verify the code and log in.
  async function verifyOtpAndLogin() {
    setError("");
    setLoading(true);
    try {
      const data = await apiPost("/auth/otp-login", { identifier, code: otpInput });
      saveUser(data.token, data.user);
      await consumePendingWishlist(data.token);
      window.location.assign(nextUrl);
    } catch (err) {
      setError(err.message || "OTP login failed");
      setLoading(false);
    }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-slate-100 px-4 py-10">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-md">
        {/* Logo */}
        <Link href="/" className="mb-6 flex items-center justify-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand font-bold text-white">
            S
          </span>
          <span className="text-xl font-bold text-slate-900">StayMate</span>
        </Link>

        <h1 className="text-center text-xl font-semibold text-slate-900">Welcome back</h1>
        <p className="mt-1 text-center text-sm text-slate-500">
          Sign in to save favourites and message owners.
        </p>

        {error && (
          <p className="mt-5 rounded-lg bg-red-50 px-3 py-2 text-center text-sm text-red-700">{error}</p>
        )}
        {info && !error && (
          <p className="mt-5 rounded-lg bg-blue-50 px-3 py-2 text-center text-sm text-brand">{info}</p>
        )}

        {/* 1. Google */}
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

        {/* Divider */}
        <div className="my-6 flex items-center gap-3 text-xs text-slate-400">
          <span className="h-px flex-1 bg-slate-200" />
          OR
          <span className="h-px flex-1 bg-slate-200" />
        </div>

        {/* Username / email (shared) */}
        <div>
          <label className="block text-sm font-medium text-slate-700">Username or email</label>
          <input
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            placeholder="username or you@gmail.com"
            // Once a code is sent it's locked — use "Edit" below to change it.
            readOnly={mode === "otp" && otpSent}
            className={
              "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-brand" +
              (mode === "otp" && otpSent ? " cursor-not-allowed bg-slate-100 text-slate-500" : "")
            }
          />
        </div>

        {/* 2. Password mode */}
        {mode === "password" && (
          <form onSubmit={handlePasswordLogin} className="mt-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">Password</label>
              <PasswordInput
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
              {loading ? "Signing in…" : "Log in with password"}
            </button>
            <button
              type="button"
              onClick={() => { setMode("otp"); setError(""); setInfo(""); }}
              className="w-full text-center text-sm font-medium text-brand hover:underline"
            >
              Log in with OTP instead
            </button>
          </form>
        )}

        {/* 3. OTP mode */}
        {mode === "otp" && (
          <div className="mt-4 space-y-4">
            {!otpSent ? (
              <button
                type="button"
                onClick={sendOtp}
                disabled={sending}
                className="w-full rounded-lg bg-slate-900 py-2.5 font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
              >
                {sending ? "Sending…" : "Send OTP to my email"}
              </button>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Enter the code</label>
                  <input
                    value={otpInput}
                    onChange={(e) => setOtpInput(e.target.value)}
                    placeholder="6-digit code from your email"
                    inputMode="numeric"
                    maxLength={6}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 tracking-widest outline-none focus:border-brand"
                  />
                </div>
                <button
                  type="button"
                  onClick={verifyOtpAndLogin}
                  disabled={loading}
                  className="w-full rounded-lg bg-brand py-2.5 font-semibold text-white hover:bg-brand-dark disabled:opacity-60"
                >
                  {loading ? "Verifying…" : "Verify & log in"}
                </button>

                {/* Didn't get it? Resend the same way, or go back to edit the email/username. */}
                <div className="flex items-center justify-between text-sm">
                  <button
                    type="button"
                    onClick={sendOtp}
                    disabled={sending}
                    className="font-medium text-brand hover:underline disabled:opacity-60"
                  >
                    {sending ? "Sending…" : "Resend code"}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setOtpSent(false); setOtpInput(""); setError(""); setInfo(""); }}
                    className="font-medium text-slate-500 hover:underline"
                  >
                    Edit email/username
                  </button>
                </div>
              </>
            )}
            <button
              type="button"
              onClick={() => { setMode("password"); setOtpSent(false); setOtpInput(""); setError(""); setInfo(""); }}
              className="w-full text-center text-sm font-medium text-brand hover:underline"
            >
              Use password instead
            </button>
          </div>
        )}

        <p className="mt-6 text-center text-sm text-slate-500">
          New to StayMate?{" "}
          <Link
            href={nextUrl !== "/" ? `/signup?next=${encodeURIComponent(nextUrl)}` : "/signup"}
            className="font-medium text-brand hover:underline"
          >
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
