"use client";

// OWNER sign-up page  (URL: "/owner/signup")
// Same flow as user signup (Google / email-OTP) but creates an account with
// role "owner" and is sage/gold themed to match the site.

import { GoogleLogin } from "@react-oauth/google";
import { useState } from "react";
import Link from "next/link";
import { Building2 } from "lucide-react";
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

  // Existing-account → upgrade-to-owner flow. Since an email can only have ONE
  // account, a seeker who signs up as an owner is UPGRADED (same account), not
  // given a second one. We confirm first, then process.
  const [existsHint, setExistsHint] = useState(false); // email already registered
  const [upgradeMode, setUpgradeMode] = useState(false); // showing the password confirm
  const [upgradePassword, setUpgradePassword] = useState("");
  const [upgrading, setUpgrading] = useState(false);
  const [googleToken, setGoogleToken] = useState(""); // token from a Google login of an existing account

  async function handleGoogle(credentialResponse) {
    setError("");
    try {
      const data = await apiPost("/auth/google", {
        credential: credentialResponse.credential,
        role: "owner",
      });
      if (data.user?.role === "admin") {
        clearUser();
        setError("This Google account is an admin account — it can’t become an owner.");
        return;
      }
      clearUser();
      saveUser(data.token, data.user);
      if (data.user?.role !== "owner") {
        // Existing seeker signed in with Google → confirm upgrade to owner.
        setGoogleToken(data.token);
        setEmail(data.user?.email || email);
        setExistsHint(true);
        return;
      }
      window.location.assign("/owner");
    } catch (err) {
      setError(err.message || "Google sign-up failed");
    }
  }

  // Confirm + process the upgrade using the Google session we already have.
  async function upgradeWithGoogle() {
    setError("");
    setUpgrading(true);
    try {
      const res = await apiPost("/users/me/become-owner", {}, googleToken);
      saveUser(googleToken, res.user);
      window.location.assign("/owner");
    } catch (err) {
      setError(err.message || "Couldn’t upgrade your account.");
      setUpgrading(false);
    }
  }

  // Confirm + process the upgrade by signing in with the existing password.
  async function upgradeWithPassword() {
    setError("");
    if (!upgradePassword) return setError("Enter your existing account password.");
    setUpgrading(true);
    try {
      const data = await apiPost("/auth/login", { identifier: email, password: upgradePassword });
      if (data.user?.role === "admin") {
        setError("This is an admin account — it can’t become an owner.");
        setUpgrading(false);
        return;
      }
      clearUser();
      saveUser(data.token, data.user);
      if (data.user?.role !== "owner") {
        const res = await apiPost("/users/me/become-owner", {}, data.token);
        saveUser(data.token, res.user);
      }
      window.location.assign("/owner");
    } catch (err) {
      setError(err.message || "Couldn’t verify your password. Try again.");
      setUpgrading(false);
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
      const msg = err.message || "Couldn’t send the code";
      // Email already has an account → offer the upgrade-to-owner path instead.
      if (/already exists/i.test(msg)) {
        setExistsHint(true);
      } else {
        setError(msg);
      }
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
      setUsername(email.split("@")[0]); // prefill with the email's local part (before @)
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
    "mt-1 w-full rounded-lg border border-white/15 px-3 py-2 outline-none focus:border-gold";

  return (
    <div className="flex min-h-[100dvh] items-center justify-center auth-bg-owner px-4 py-10">
      <div className="w-full max-w-md rounded-2xl auth-card p-6">
        {/* Distinct emerald "Owner Portal" banner (matches the owner login). */}
        <div className="-mx-6 -mt-6 mb-5 rounded-t-2xl bg-gradient-to-br from-emerald-600 to-emerald-500 px-6 py-4 text-center text-white">
          <div className="flex items-center justify-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-white/15 ring-1 ring-white/25">
              <Building2 size={20} />
            </span>
            <div className="text-left">
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/80">
                Property Owner Portal
              </p>
              <h1 className="text-lg font-bold leading-tight">Become an owner</h1>
            </div>
          </div>
          <p className="mt-1.5 text-xs text-white/85">List your properties on Parppidam</p>
        </div>

        {error && (
          <p className="mt-5 flex items-center justify-center gap-2 rounded-lg border border-red-400/30 bg-red-500/15 px-3 py-2.5 text-center text-sm font-medium text-red-200">{error}</p>
        )}
        {info && !error && (
          <p className="mt-5 rounded-lg border border-gold/30 bg-gold/10 px-3 py-2.5 text-center text-sm font-medium text-gold">{info}</p>
        )}

        {/* Existing account → confirm & upgrade to owner (same account, not a new one). */}
        {existsHint && (
          <div className="mt-5 rounded-xl border border-gold/30 bg-gold/10 p-4">
            <p className="text-sm font-semibold text-gold">An account with this email already exists</p>
            <p className="mt-1 text-sm text-white/75">
              If you continue, your existing account is{" "}
              <b className="text-white">upgraded to an owner account</b> — you keep your saved places,
              chats and the same login. You <b className="text-white">won’t</b> get a separate user account.
            </p>

            {googleToken ? (
              <button
                type="button"
                onClick={upgradeWithGoogle}
                disabled={upgrading}
                className="mt-3 w-full rounded-lg bg-emerald-600 py-2.5 font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-60"
              >
                {upgrading ? "Upgrading…" : "Confirm & upgrade to owner"}
              </button>
            ) : !upgradeMode ? (
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setUpgradeMode(true)}
                  className="flex-1 rounded-lg bg-emerald-600 py-2.5 font-semibold text-white transition-colors hover:bg-emerald-700"
                >
                  Yes, upgrade to owner
                </button>
                <button
                  type="button"
                  onClick={() => { setExistsHint(false); setUpgradeMode(false); setError(""); }}
                  className="rounded-lg border border-white/15 px-4 text-sm font-medium text-white/70 transition-colors hover:bg-white/5"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="mt-3 space-y-2">
                <PasswordInput
                  value={upgradePassword}
                  onChange={(e) => setUpgradePassword(e.target.value)}
                  placeholder="Your existing account password"
                  className="w-full rounded-lg border border-white/15 px-3 py-2 outline-none focus:border-gold"
                />
                <button
                  type="button"
                  onClick={upgradeWithPassword}
                  disabled={upgrading}
                  className="w-full rounded-lg bg-emerald-600 py-2.5 font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-60"
                >
                  {upgrading ? "Upgrading…" : "Confirm & upgrade to owner"}
                </button>
                <p className="text-xs text-white/50">
                  Enter your existing password to confirm it’s you. Signed up with Google?{" "}
                  <button type="button" onClick={() => { setUpgradeMode(false); setExistsHint(false); }} className="font-medium text-gold hover:underline">
                    Cancel &amp; use Google
                  </button>.
                </p>
              </div>
            )}
          </div>
        )}

        {!existsHint && (
        <>
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
            <p className="text-sm text-white/45">Google sign-up isn’t configured yet.</p>
          )}
        </div>

        <div className="my-6 flex items-center gap-3 text-xs text-white/45">
          <span className="h-px flex-1 bg-white/10" />
          OR SIGN UP WITH EMAIL
          <span className="h-px flex-1 bg-white/10" />
        </div>

        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white/80">Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your full name" className={field} />
          </div>

          <div>
            <label className="block text-sm font-medium text-white/80">Email</label>
            <div className="mt-1 flex gap-2">
              <input
                type="email"
                value={email}
                disabled={emailVerified}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@gmail.com"
                className="w-full rounded-lg border border-white/15 px-3 py-2 outline-none focus:border-gold disabled:bg-white/5"
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
                  className="shrink-0 rounded-lg bg-gold px-3 text-sm font-medium text-ink hover:bg-gold/90 disabled:opacity-60"
                >
                  {otpSent ? "Resend" : "Verify"}
                </button>
              )}
            </div>
          </div>

          {otpSent && !emailVerified && (
            <div>
              <label className="block text-sm font-medium text-white/80">Enter the code</label>
              <div className="mt-1 flex gap-2">
                <input value={otpInput} onChange={(e) => setOtpInput(e.target.value)} placeholder="6-digit code from your email" className="w-full rounded-lg border border-white/15 px-3 py-2 outline-none focus:border-gold" />
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

          {emailVerified && (
            <>
              <div>
                <label className="block text-sm font-medium text-white/80">Username</label>
                <input value={username} onChange={(e) => setUsername(e.target.value)} className={field} />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/80">Password</label>
                <PasswordInput value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" className={field} />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/80">Confirm password</label>
                <PasswordInput value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Re-enter password" className={field} />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-brand py-2.5 font-semibold text-white hover:bg-brand-dark disabled:opacity-60"
              >
                {loading ? "Creating account…" : "Create owner account"}
              </button>
            </>
          )}
        </form>
        </>
        )}

        <p className="mt-6 text-center text-sm text-white/60">
          Already an owner?{" "}
          <Link href="/owner/login" className="font-medium text-gold hover:underline">
            Log in
          </Link>
        </p>

        {/* Help a seeker who landed here by mistake find the right page. */}
        <div className="mt-4 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-center text-sm text-white/70">
          Just looking for a place?{" "}
          <Link href="/signup" className="font-semibold text-emerald-300 hover:underline">
            User sign up
          </Link>
        </div>
      </div>
    </div>
  );
}
