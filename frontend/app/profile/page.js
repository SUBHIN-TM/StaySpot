"use client";

// Profile / account settings page  (URL: "/profile")  — for logged-in users.
// A settings-style layout (NOT the auth-card pattern): site navbar + a profile
// header + separate "Account details" and "Security" cards.
//   • Account details  → name, username, gender, occupation (seekers only).
//   • Security         → change password, gated by an emailed OTP.

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, User, ShieldCheck, Camera, Mail, Info, Trash2 } from "lucide-react";
import Navbar from "@/components/public/Navbar";
import { apiPatch, apiPost, apiUpload, apiDelete } from "@/lib/api";
import { getUserToken, getCurrentUser, saveUser, clearUser } from "@/lib/userAuth";
import PasswordInput from "@/components/PasswordInput";
import { useToasts, ToastViewport } from "@/components/owner/feedback";
import { useConfirm } from "@/components/ConfirmProvider";

function initials(name = "") {
  return (name.trim().split(/\s+/).slice(0, 2).map((p) => p[0]).join("") || "U").toUpperCase();
}

// A small (i) icon that reveals a hint on click (closes on outside click).
function InfoHint({ text }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    function onClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);
  return (
    <span className="relative inline-flex align-middle" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="text-ink/35 transition-colors hover:text-brand"
        aria-label="More information"
      >
        <Info size={14} />
      </button>
      {open && (
        <span className="absolute left-5 top-1/2 z-30 w-56 max-w-[70vw] -translate-y-1/2 rounded-lg border border-line bg-white px-3 py-2 text-xs font-normal leading-snug text-ink/70 shadow-lg">
          {text}
        </span>
      )}
    </span>
  );
}

const ROLE_BADGE = {
  seeker: "bg-brand/10 text-brand",
  owner: "bg-[#D4A359]/20 text-[#9A6B18]",
  admin: "bg-ink/10 text-ink",
};

export default function ProfilePage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  // Identity (read-only header)
  const [email, setEmail] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [role, setRole] = useState("");

  // Editable account details
  const [name, setName] = useState("");
  const [username, setUsername] = useState(""); // unique login handle (alt to email)
  const [gender, setGender] = useState(""); // "" = prefer not to say
  const [occupation, setOccupation] = useState("");

  // Security (password change → OTP)
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [otpStage, setOtpStage] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [sending, setSending] = useState(false);
  const [changingPw, setChangingPw] = useState(false);

  // Email change → OTP sent to the NEW address.
  const [newEmail, setNewEmail] = useState("");
  const [emailOtpStage, setEmailOtpStage] = useState(false);
  const [emailOtp, setEmailOtp] = useState("");
  const [sendingEmail, setSendingEmail] = useState(false);
  const [changingEmail, setChangingEmail] = useState(false);

  const [savingProfile, setSavingProfile] = useState(false);
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Feedback as branded toasts (bottom-right) instead of inline banners.
  const { toasts, notify, dismiss } = useToasts();
  const askConfirm = useConfirm();

  // On mount: must be logged in; prefill everything.
  useEffect(() => {
    const u = getCurrentUser();
    if (!u || !getUserToken()) {
      router.replace("/login");
      return;
    }
    setEmail(u.email || "");
    setAvatarUrl(u.avatar_url || "");
    setRole(u.role || "");
    setName(u.name || "");
    setUsername(u.username || "");
    setGender(u.gender || "");
    setOccupation(u.occupation || "");
    setReady(true);
  }, [router]);

  // Upload a new profile photo (multipart → POST /users/me/avatar).
  async function onAvatarPick(file) {
    if (!file) return;
    if (!file.type.startsWith("image/")) return notify("Please choose an image file.", "error");
    setAvatarBusy(true);
    try {
      const fd = new FormData();
      fd.append("image", file);
      const data = await apiUpload("/users/me/avatar", fd, getUserToken());
      setAvatarUrl(data.user?.avatar_url || "");
      saveUser(getUserToken(), data.user);
      notify("Profile photo updated.", "success");
    } catch (err) {
      notify(err.message || "Couldn’t upload the photo", "error");
    } finally {
      setAvatarBusy(false);
    }
  }

  // Save the account details (no OTP needed).
  async function saveProfile(e) {
    e.preventDefault();
    if (!name.trim()) return notify("Name can’t be empty.", "error");
    if (!username.trim()) return notify("Username can’t be empty.", "error");

    const body = { name: name.trim(), username: username.trim(), gender };
    if (role === "seeker") body.occupation = occupation.trim();

    setSavingProfile(true);
    try {
      const data = await apiPatch("/users/me", body, getUserToken());
      saveUser(getUserToken(), data.user);
      notify("Profile updated.", "success");
    } catch (err) {
      notify(err.message || "Couldn’t update profile", "error");
    } finally {
      setSavingProfile(false);
    }
  }

  // Email a one-time code to authorize the password change.
  async function sendPwOtp() {
    if (password.length < 6) return notify("New password must be at least 6 characters.", "error");
    if (password !== confirm) return notify("Passwords do not match.", "error");
    setSending(true);
    try {
      const res = await apiPost("/users/me/password-otp", {}, getUserToken());
      setOtpStage(true);
      setOtpCode("");
      notify(`We emailed a 6-digit code to ${res.email || "your email"}.`, "info");
    } catch (err) {
      notify(err.message || "Couldn’t send the code", "error");
    } finally {
      setSending(false);
    }
  }

  // Change the password (requires the emailed OTP).
  async function submitSecurity(e) {
    e.preventDefault();
    if (password.length < 6) return notify("New password must be at least 6 characters.", "error");
    if (password !== confirm) return notify("Passwords do not match.", "error");
    if (!otpStage) return sendPwOtp();
    if (!otpCode.trim()) return notify("Enter the verification code we emailed you.", "error");

    setChangingPw(true);
    try {
      const data = await apiPatch("/users/me", { password, otp: otpCode.trim() }, getUserToken());
      saveUser(getUserToken(), data.user);
      setPassword("");
      setConfirm("");
      setOtpCode("");
      setOtpStage(false);
      notify("Password changed successfully.", "success");
    } catch (err) {
      notify(err.message || "Couldn’t change password", "error");
    } finally {
      setChangingPw(false);
    }
  }

  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // Email a one-time code to the NEW address.
  async function sendEmailOtp() {
    const e = newEmail.trim().toLowerCase();
    if (!EMAIL_RE.test(e)) return notify("Enter a valid new email address.", "error");
    if (e === email.toLowerCase()) return notify("That is already your email.", "error");
    setSendingEmail(true);
    try {
      const res = await apiPost("/users/me/email-otp", { email: e }, getUserToken());
      setEmailOtpStage(true);
      setEmailOtp("");
      notify(`We emailed a 6-digit code to ${res.email || e}.`, "info");
    } catch (err) {
      notify(err.message || "Couldn’t send the code", "error");
    } finally {
      setSendingEmail(false);
    }
  }

  // Verify the code sent to the new address, then switch the login email.
  async function submitEmailChange(ev) {
    ev.preventDefault();
    const e = newEmail.trim().toLowerCase();
    if (!EMAIL_RE.test(e)) return notify("Enter a valid new email address.", "error");
    if (e === email.toLowerCase()) return notify("That is already your email.", "error");
    if (!emailOtpStage) return sendEmailOtp();
    if (!emailOtp.trim()) return notify("Enter the code we emailed to the new address.", "error");

    setChangingEmail(true);
    try {
      const data = await apiPatch("/users/me/email", { email: e, otp: emailOtp.trim() }, getUserToken());
      saveUser(getUserToken(), data.user);
      setEmail(data.user?.email || e);
      setNewEmail("");
      setEmailOtp("");
      setEmailOtpStage(false);
      notify("Email address changed successfully.", "success");
    } catch (err) {
      notify(err.message || "Couldn’t change email", "error");
    } finally {
      setChangingEmail(false);
    }
  }

  // Soft-delete the account after a clear confirmation, then sign out.
  async function deleteAccount() {
    const ok = await askConfirm({
      title: "Delete your account?",
      message:
        "Your listings and roommate posts will be hidden from everyone and you'll be signed out. This can't be undone. You can sign up again later with the same email as a completely fresh account.",
      confirmLabel: "Delete my account",
      tone: "danger",
    });
    if (!ok) return;
    setDeleting(true);
    try {
      await apiDelete("/users/me", getUserToken());
      clearUser();
      // Send them to the home page as a signed-out visitor.
      window.location.assign("/");
    } catch (err) {
      notify(err.message || "Couldn’t delete your account", "error");
      setDeleting(false);
    }
  }

  if (!ready) {
    return (
      <div className="grid min-h-screen place-items-center bg-cream text-ink/50">Loading…</div>
    );
  }

  const field =
    "mt-1 w-full rounded-lg border border-line bg-white px-3 py-2 text-ink outline-none transition-colors focus:border-brand";

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-cream">
        <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
          {/* Profile header */}
          <div className="flex items-center gap-4">
            <label className="group relative shrink-0 cursor-pointer" title="Change photo">
              <span className="grid h-16 w-16 place-items-center overflow-hidden rounded-full bg-brand text-xl font-bold text-white ring-2 ring-brand/20">
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatarUrl} alt="" referrerPolicy="no-referrer" className="h-full w-full object-cover" />
                ) : (
                  initials(name)
                )}
              </span>
              {/* Camera badge */}
              <span className="absolute -bottom-0.5 -right-0.5 grid h-6 w-6 place-items-center rounded-full border border-line bg-white text-ink shadow-sm transition-colors group-hover:text-brand">
                <Camera size={13} />
              </span>
              {/* Uploading overlay */}
              {avatarBusy && (
                <span className="absolute inset-0 grid place-items-center rounded-full bg-black/45 text-[11px] font-medium text-white">
                  …
                </span>
              )}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={avatarBusy}
                onChange={(e) => {
                  onAvatarPick(e.target.files?.[0]);
                  e.target.value = ""; // allow re-picking the same file
                }}
              />
            </label>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="truncate text-2xl font-bold capitalize text-ink">{name}</h1>
                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${ROLE_BADGE[role] || ROLE_BADGE.seeker}`}>
                  {role}
                </span>
              </div>
              <p className="truncate text-sm text-ink/60">{email}</p>
            </div>
          </div>

          {/* Account details */}
          <section className="mt-8 rounded-2xl border border-line bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2">
              <User size={18} className="text-brand" />
              <h2 className="font-semibold text-ink">Account details</h2>
            </div>

            <form onSubmit={saveProfile} className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-ink/70">Name</label>
                <input value={name} onChange={(e) => setName(e.target.value)} className={field} />
              </div>
              <div>
                <label className="flex items-center gap-1.5 text-sm font-medium text-ink/70">
                  Username
                  <InfoHint text="Your unique handle. You can sign in with this or your email. Must be unique." />
                </label>
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Choose a unique username"
                  className={field}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink/70">Gender</label>
                <select value={gender} onChange={(e) => setGender(e.target.value)} className={field}>
                  <option value="">Prefer not to say</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
              {role === "seeker" && (
                <div>
                  <label className="block text-sm font-medium text-ink/70">Occupation</label>
                  <input
                    value={occupation}
                    onChange={(e) => setOccupation(e.target.value)}
                    placeholder="e.g. Student, Software Engineer"
                    className={field}
                  />
                </div>
              )}
              <div className="sm:col-span-2">
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="rounded-lg bg-brand px-6 py-2.5 font-semibold text-white transition-colors hover:bg-brand-dark disabled:opacity-60"
                >
                  {savingProfile ? "Saving…" : "Save changes"}
                </button>
              </div>
            </form>
          </section>

          {/* Security */}
          <section className="mt-6 rounded-2xl border border-line bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2">
              <ShieldCheck size={18} className="text-brand" />
              <h2 className="font-semibold text-ink">Security</h2>
            </div>
            <p className="mt-1 text-sm text-ink/55">
              Change your password. For your safety we’ll email you a code to confirm.
            </p>

            <form onSubmit={submitSecurity} className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-ink/70">New password</label>
                <PasswordInput
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className={field}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink/70">Confirm new password</label>
                <PasswordInput
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Re-enter password"
                  className={field}
                />
              </div>

              {otpStage && (
                <div className="sm:col-span-2 rounded-xl border border-brand/20 bg-brand/5 p-4">
                  <label className="block text-sm font-medium text-ink/70">
                    Enter the code we emailed to confirm your new password
                  </label>
                  <input
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    placeholder="6-digit code"
                    inputMode="numeric"
                    maxLength={6}
                    className="mt-1.5 w-full rounded-lg border border-line bg-white px-3 py-2 tracking-widest text-ink outline-none focus:border-brand"
                  />
                  <button
                    type="button"
                    onClick={sendPwOtp}
                    disabled={sending}
                    className="mt-2 text-sm font-medium text-brand hover:underline disabled:opacity-60"
                  >
                    {sending ? "Sending…" : "Resend code"}
                  </button>
                </div>
              )}

              <div className="sm:col-span-2">
                <button
                  type="submit"
                  disabled={sending || changingPw}
                  className="rounded-lg bg-brand px-6 py-2.5 font-semibold text-white transition-colors hover:bg-brand-dark disabled:opacity-60"
                >
                  {sending
                    ? "Sending code…"
                    : changingPw
                    ? "Changing…"
                    : otpStage
                    ? "Verify & change password"
                    : "Send code to change password"}
                </button>
              </div>
            </form>
          </section>

          {/* Change email */}
          <section className="mt-6 rounded-2xl border border-line bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2">
              <Mail size={18} className="text-brand" />
              <h2 className="font-semibold text-ink">Email address</h2>
            </div>
            <p className="mt-1 text-sm text-ink/55">
              Change the email you sign in with. We’ll email a code to the{" "}
              <span className="font-medium text-ink/70">new address</span> to confirm it’s yours.
            </p>

            <form onSubmit={submitEmailChange} className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-ink/70">Current email</label>
                <input
                  value={email}
                  readOnly
                  className="mt-1 w-full cursor-not-allowed rounded-lg border border-line bg-mist px-3 py-2 text-ink/60 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink/70">New email</label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="you@newmail.com"
                  className={field}
                />
              </div>

              {emailOtpStage && (
                <div className="sm:col-span-2 rounded-xl border border-brand/20 bg-brand/5 p-4">
                  <label className="block text-sm font-medium text-ink/70">
                    Enter the code we emailed to the new address
                  </label>
                  <input
                    value={emailOtp}
                    onChange={(e) => setEmailOtp(e.target.value)}
                    placeholder="6-digit code"
                    inputMode="numeric"
                    maxLength={6}
                    className="mt-1.5 w-full rounded-lg border border-line bg-white px-3 py-2 tracking-widest text-ink outline-none focus:border-brand"
                  />
                  <button
                    type="button"
                    onClick={sendEmailOtp}
                    disabled={sendingEmail}
                    className="mt-2 text-sm font-medium text-brand hover:underline disabled:opacity-60"
                  >
                    {sendingEmail ? "Sending…" : "Resend code"}
                  </button>
                </div>
              )}

              <div className="sm:col-span-2">
                <button
                  type="submit"
                  disabled={sendingEmail || changingEmail}
                  className="rounded-lg bg-brand px-6 py-2.5 font-semibold text-white transition-colors hover:bg-brand-dark disabled:opacity-60"
                >
                  {sendingEmail
                    ? "Sending code…"
                    : changingEmail
                    ? "Changing…"
                    : emailOtpStage
                    ? "Verify & change email"
                    : "Send code to change email"}
                </button>
              </div>
            </form>
          </section>

          {/* Danger zone: delete account (seekers & owners; admins use the panel). */}
          {role !== "admin" && (
            <section className="mt-6 rounded-2xl border border-red-200 bg-red-50/40 p-6 shadow-sm">
              <div className="flex items-center gap-2">
                <Trash2 size={18} className="text-red-600" />
                <h2 className="font-semibold text-red-700">Delete account</h2>
              </div>
              <p className="mt-1 text-sm text-ink/60">
                Permanently close your Parppidam account. Your listings and roommate posts are hidden
                from everyone and you are signed out. You can sign up again later with the same email
                as a completely fresh account, with no old history.
              </p>
              <button
                type="button"
                onClick={deleteAccount}
                disabled={deleting}
                className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-red-300 bg-white px-5 py-2.5 font-semibold text-red-600 transition-colors hover:bg-red-600 hover:text-white disabled:opacity-60"
              >
                <Trash2 size={15} /> {deleting ? "Deleting…" : "Delete my account"}
              </button>
            </section>
          )}

          <Link
            href="/"
            className="mt-8 inline-flex items-center gap-1.5 text-sm font-medium text-ink/60 transition-colors hover:text-brand"
          >
            <ArrowLeft size={15} /> Back to website
          </Link>
        </div>
      </main>

      {/* Branded toasts (bottom-right) for all profile alerts. */}
      <ToastViewport toasts={toasts} onDismiss={dismiss} />
    </>
  );
}
