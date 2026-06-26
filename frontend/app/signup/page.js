"use client";

// User sign-up page  (URL: "/signup")  — seekers/owners, NOT admins.
//
// Two ways to sign up:
//  1. Google  → instant (name + email + photo come from Google).
//  2. Manual  → name, email (verified by a REAL OTP emailed to them), username, password.
//
// Emails are sent for real by the backend (nodemailer + Brevo):
//   - /auth/send-otp emails the code
//   - /auth/verify-otp checks it
//   - /auth/register sends a welcome email

import { GoogleLogin } from "@react-oauth/google";
import { useEffect, useState } from "react";
import Link from "next/link";
import { apiPost } from "@/lib/api";
import { saveUser, getNextPath } from "@/lib/userAuth";
import { consumePendingWishlist } from "@/lib/wishlist";
import PasswordInput from "@/components/PasswordInput";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function SignupPage() {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  // OTP / verification state
  const [otpSent, setOtpSent] = useState(false);
  const [maskedEmail, setMaskedEmail] = useState("");
  const [otpInput, setOtpInput] = useState("");
  const [emailVerified, setEmailVerified] = useState(false);

  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);

  // Where to go after signing up: the page the user came from (?next=…) or home.
  const [nextUrl, setNextUrl] = useState("/");
  useEffect(() => {
    setNextUrl(getNextPath("/"));
  }, []);

  // ── Google sign-up ────────────────────────────────────────────────────────
  async function handleGoogle(credentialResponse) {
    setError("");
    try {
      const data = await apiPost("/auth/google", { credential: credentialResponse.credential });
      saveUser(data.token, data.user);
      await consumePendingWishlist(data.token); // save the heart they tapped, if any
      window.location.assign(nextUrl);
    } catch (err) {
      setError(err.message || "Google sign-up failed");
    }
  }

  // ── Step 1: ask the backend to email an OTP ──────────────────────────────
  async function sendOtp() {
    setError("");
    setInfo("");
    if (!EMAIL_RE.test(email)) {
      setError("Please enter a valid email first.");
      return;
    }
    setLoading(true);
    try {
      const res = await apiPost("/auth/send-otp", { purpose: "signup", email });
      setOtpSent(true);
      setMaskedEmail(res.email || email);
      setInfo(`We emailed a 6-digit code to ${res.email || email}.`);
    } catch (err) {
      setError(err.message || "Couldn’t send the code");
    } finally {
      setLoading(false);
    }
  }

  // ── Step 2: verify the OTP with the backend ──────────────────────────────
  async function verifyOtp() {
    setError("");
    setLoading(true);
    try {
      await apiPost("/auth/verify-otp", { email, code: otpInput, purpose: "signup" });
      setEmailVerified(true);
      setUsername(email); // prefill username with the email
      setInfo("Email verified — finish creating your account.");
    } catch (err) {
      setError(err.message || "Invalid or expired code");
    } finally {
      setLoading(false);
    }
  }

  // ── Step 3: create the account (sends a welcome email) ───────────────────
  async function handleSignup(e) {
    e.preventDefault();
    setError("");
    if (!name.trim()) return setError("Please enter your name.");
    if (password.length < 6) return setError("Password must be at least 6 characters.");
    if (password !== confirm) return setError("Passwords do not match.");

    setLoading(true);
    try {
      const data = await apiPost("/auth/register", {
        name: name.trim(),
        email,
        username: username.trim() || email,
        password,
        otp: otpInput, // the verified code
      });
      saveUser(data.token, data.user);
      await consumePendingWishlist(data.token);
      window.location.assign(nextUrl);
    } catch (err) {
      setError(err.message || "Sign-up failed");
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

        <h1 className="text-center text-xl font-semibold text-slate-900">Create your account</h1>
        <p className="mt-1 text-center text-sm text-slate-500">
          Join StayMate to save favourites and message owners.
        </p>

        {error && (
          <p className="mt-5 rounded-lg bg-red-50 px-3 py-2 text-center text-sm text-red-700">{error}</p>
        )}
        {info && !error && (
          <p className="mt-5 rounded-lg bg-blue-50 px-3 py-2 text-center text-sm text-brand">{info}</p>
        )}

        {/* Google sign-up */}
        <div className="mt-6 flex justify-center">
          {clientId ? (
            <GoogleLogin
              onSuccess={handleGoogle}
              onError={() => setError("Google sign-up was cancelled or failed.")}
              text="signup_with"
              theme="outline"
              size="large"
              width="320"
            />
          ) : (
            <p className="text-sm text-slate-400">Google sign-up isn’t configured yet.</p>
          )}
        </div>

        {/* Divider */}
        <div className="my-6 flex items-center gap-3 text-xs text-slate-400">
          <span className="h-px flex-1 bg-slate-200" />
          OR SIGN UP WITH EMAIL
          <span className="h-px flex-1 bg-slate-200" />
        </div>

        {/* Manual sign-up */}
        <form onSubmit={handleSignup} className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-slate-700">Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your full name"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-brand"
            />
          </div>

          {/* Email + verify */}
          <div>
            <label className="block text-sm font-medium text-slate-700">Email</label>
            <div className="mt-1 flex gap-2">
              <input
                type="email"
                value={email}
                disabled={emailVerified}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@gmail.com"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-brand disabled:bg-slate-100"
              />
              {emailVerified ? (
                <span className="grid place-items-center rounded-lg bg-green-100 px-3 text-sm font-medium text-green-700">
                  ✓ Verified
                </span>
              ) : (
                <button
                  type="button"
                  onClick={sendOtp}
                  disabled={loading}
                  className="shrink-0 rounded-lg bg-slate-900 px-3 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
                >
                  {otpSent ? "Resend" : "Verify"}
                </button>
              )}
            </div>
          </div>

          {/* OTP input (shown after sending, until verified) */}
          {otpSent && !emailVerified && (
            <div>
              <label className="block text-sm font-medium text-slate-700">Enter the code</label>
              <div className="mt-1 flex gap-2">
                <input
                  value={otpInput}
                  onChange={(e) => setOtpInput(e.target.value)}
                  placeholder="6-digit code from your email"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-brand"
                />
                <button
                  type="button"
                  onClick={verifyOtp}
                  disabled={loading}
                  className="shrink-0 rounded-lg bg-brand px-3 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-60"
                >
                  Verify
                </button>
              </div>
            </div>
          )}

          {/* The rest unlocks only after the email is verified */}
          {emailVerified && (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-700">Username</label>
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-brand"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Password</label>
                <PasswordInput
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-brand"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Confirm password</label>
                <PasswordInput
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Re-enter password"
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-brand"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-brand py-2.5 font-semibold text-white hover:bg-brand-dark disabled:opacity-60"
              >
                {loading ? "Creating account…" : "Sign up"}
              </button>
            </>
          )}
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          Already have an account?{" "}
          <Link
            href={nextUrl !== "/" ? `/login?next=${encodeURIComponent(nextUrl)}` : "/login"}
            className="font-medium text-brand hover:underline"
          >
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
