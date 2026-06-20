"use client";

// OWNER sign-up page  (URL: "/owner/signup")
// Same flow as user signup (Google / email-OTP) but creates an account with
// role "owner" and is emerald-themed.

import { GoogleLogin } from "@react-oauth/google";
import { useState } from "react";
import Link from "next/link";
import { apiPost } from "@/lib/api";
import { saveUser, clearUser } from "@/lib/userAuth";
import PasswordInput from "@/components/PasswordInput";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function OwnerSignupPage() {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const [otpSent, setOtpSent] = useState(false);
  const [otpInput, setOtpInput] = useState("");
  const [emailVerified, setEmailVerified] = useState(false);

  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleGoogle(credentialResponse) {
    setError("");
    try {
      const data = await apiPost("/auth/google", {
        credential: credentialResponse.credential,
        role: "owner",
      });
      if (data.user?.role !== "owner") {
        clearUser();
        setError("This Google account is already a user account, not an owner.");
        return;
      }
      clearUser();
      saveUser(data.token, data.user);
      window.location.assign("/owner");
    } catch (err) {
      setError(err.message || "Google sign-up failed");
    }
  }

  async function sendOtp() {
    setError("");
    setInfo("");
    if (!EMAIL_RE.test(email)) return setError("Please enter a valid email first.");
    setLoading(true);
    try {
      const res = await apiPost("/auth/send-otp", { purpose: "signup", email });
      setOtpSent(true);
      setInfo(`We emailed a 6-digit code to ${res.email || email}.`);
    } catch (err) {
      setError(err.message || "Couldn’t send the code");
    } finally {
      setLoading(false);
    }
  }

  async function verifyOtp() {
    setError("");
    setLoading(true);
    try {
      await apiPost("/auth/verify-otp", { email, code: otpInput, purpose: "signup" });
      setEmailVerified(true);
      setUsername(email);
      setInfo("Email verified — finish creating your owner account.");
    } catch (err) {
      setError(err.message || "Invalid or expired code");
    } finally {
      setLoading(false);
    }
  }

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
        otp: otpInput,
        role: "owner", // <-- creates an OWNER account
      });
      clearUser();
      saveUser(data.token, data.user);
      window.location.assign("/owner");
    } catch (err) {
      setError(err.message || "Sign-up failed");
      setLoading(false);
    }
  }

  const field =
    "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-emerald-500";

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

        <h1 className="text-center text-xl font-semibold text-slate-900">Become an owner</h1>
        <p className="mt-1 text-center text-sm text-slate-500">List your properties on StayMate.</p>

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

        <div className="my-6 flex items-center gap-3 text-xs text-slate-400">
          <span className="h-px flex-1 bg-slate-200" />
          OR SIGN UP WITH EMAIL
          <span className="h-px flex-1 bg-slate-200" />
        </div>

        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your full name" className={field} />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">Email</label>
            <div className="mt-1 flex gap-2">
              <input
                type="email"
                value={email}
                disabled={emailVerified}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@gmail.com"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-emerald-500 disabled:bg-slate-100"
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

          {otpSent && !emailVerified && (
            <div>
              <label className="block text-sm font-medium text-slate-700">Enter the code</label>
              <div className="mt-1 flex gap-2">
                <input value={otpInput} onChange={(e) => setOtpInput(e.target.value)} placeholder="6-digit code from your email" className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-emerald-500" />
                <button
                  type="button"
                  onClick={verifyOtp}
                  disabled={loading}
                  className="shrink-0 rounded-lg bg-emerald-600 px-3 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
                >
                  Verify
                </button>
              </div>
            </div>
          )}

          {emailVerified && (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-700">Username</label>
                <input value={username} onChange={(e) => setUsername(e.target.value)} className={field} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Password</label>
                <PasswordInput value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" className={field} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Confirm password</label>
                <PasswordInput value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Re-enter password" className={field} />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-emerald-600 py-2.5 font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
              >
                {loading ? "Creating account…" : "Create owner account"}
              </button>
            </>
          )}
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          Already an owner?{" "}
          <Link href="/owner/login" className="font-medium text-emerald-700 hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
