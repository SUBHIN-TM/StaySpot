"use client";

// OWNER login page  (URL: "/owner/login")
// Same methods as the user login (Google / password / OTP) but sage/gold themed
// to match the site. Only accounts with role "owner" are
// allowed in — others are rejected. A successful login overwrites any previous
// (user) session, so there's never a token clash.

import { GoogleLogin } from "@react-oauth/google";
import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Building2 } from "lucide-react";
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
  const [loading, setLoading] = useState(false); // verify / password buttons
  const [sending, setSending] = useState(false); // send / resend OTP button

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

  // Send (or resend) the login code. Clears the old message + any typed code
  // first, so it's clear that a brand-new code has been emailed.
  async function sendOtp() {
    setError("");
    setInfo("");
    if (!identifier.trim()) return setError("Enter your username or email first.");
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
    <div className="grid min-h-screen place-items-center auth-bg-owner px-4 py-6">
      <div className="w-full max-w-md rounded-2xl auth-card p-6">
        {/* Distinct emerald "Owner Portal" banner — makes this page clearly the
            OWNER login, not the seeker/user login. */}
        <div className="-mx-6 -mt-6 mb-5 rounded-t-2xl bg-gradient-to-br from-emerald-600 to-emerald-500 px-6 py-4 text-center text-white">
          <div className="flex items-center justify-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-white/15 ring-1 ring-white/25">
              <Building2 size={20} />
            </span>
            <div className="text-left">
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/80">
                Property Owner Portal
              </p>
              <h1 className="text-lg font-bold leading-tight">Owner sign in</h1>
            </div>
          </div>
          <p className="mt-1.5 text-xs text-white/85">List &amp; manage your properties on Parppidam</p>
        </div>

        {error && (
          <p className="mt-5 flex items-center justify-center gap-2 rounded-lg border border-red-400/30 bg-red-500/15 px-3 py-2.5 text-center text-sm font-medium text-red-200">{error}</p>
        )}
        {info && !error && (
          <p className="mt-5 rounded-lg border border-gold/30 bg-gold/10 px-3 py-2.5 text-center text-sm font-medium text-gold">{info}</p>
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
            <p className="text-sm text-white/45">Google sign-in isn’t configured yet.</p>
          )}
        </div>

        <div className="my-6 flex items-center gap-3 text-xs text-white/45">
          <span className="h-px flex-1 bg-white/10" />
          OR
          <span className="h-px flex-1 bg-white/10" />
        </div>

        <div>
          <label className="block text-sm font-medium text-white/80">Username or email</label>
          <input
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            placeholder="username or you@gmail.com"
            // Once a code is sent it's locked — use "Edit" below to change it.
            readOnly={mode === "otp" && otpSent}
            className={
              "mt-1 w-full rounded-lg border border-white/15 px-3 py-2 outline-none focus:border-gold" +
              (mode === "otp" && otpSent ? " cursor-not-allowed bg-white/5 text-white/60" : "")
            }
          />
        </div>

        {mode === "password" && (
          <form onSubmit={handlePasswordLogin} className="mt-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-white/80">Password</label>
              <PasswordInput
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="mt-1 w-full rounded-lg border border-white/15 px-3 py-2 outline-none focus:border-gold"
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
              className="w-full text-center text-sm font-medium text-gold hover:underline"
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
                disabled={sending}
                className="w-full rounded-lg bg-gold py-2.5 font-semibold text-ink hover:bg-gold/90 disabled:opacity-60"
              >
                {sending ? "Sending…" : "Send OTP to my email"}
              </button>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium text-white/80">Enter the code</label>
                  <input
                    value={otpInput}
                    onChange={(e) => setOtpInput(e.target.value)}
                    placeholder="6-digit code from your email"
                    inputMode="numeric"
                    maxLength={6}
                    className="mt-1 w-full rounded-lg border border-white/15 px-3 py-2 tracking-widest outline-none focus:border-gold"
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
                    className="font-medium text-gold hover:underline disabled:opacity-60"
                  >
                    {sending ? "Sending…" : "Resend code"}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setOtpSent(false); setOtpInput(""); setError(""); setInfo(""); }}
                    className="font-medium text-white/60 hover:underline"
                  >
                    Edit email/username
                  </button>
                </div>
              </>
            )}
            <button
              type="button"
              onClick={() => { setMode("password"); setOtpSent(false); setOtpInput(""); setError(""); setInfo(""); }}
              className="w-full text-center text-sm font-medium text-gold hover:underline"
            >
              Use password instead
            </button>
          </div>
        )}

        <p className="mt-6 text-center text-sm text-white/60">
          New owner?{" "}
          <Link href="/owner/signup" className="font-medium text-gold hover:underline">
            Create an owner account
          </Link>
        </p>

        {/* Help a seeker who landed here by mistake find the right page. */}
        <div className="mt-4 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-center text-sm text-white/70">
          Just looking for a place?{" "}
          <Link href="/login" className="font-semibold text-emerald-300 hover:underline">
            User login
          </Link>
        </div>
        <div className="mt-4 flex justify-center">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-full border border-white/15 px-4 py-2 text-sm font-medium text-white/70 transition-colors hover:border-gold/50 hover:bg-white/5 hover:text-gold"
          >
            <ArrowLeft size={15} /> Back to website
          </Link>
        </div>
      </div>
    </div>
  );
}
