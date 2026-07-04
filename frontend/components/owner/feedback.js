"use client";

// Brand-styled feedback primitives for the owner area — premium replacements
// for the native alert()/confirm() so warnings, confirmations and success
// messages match the sage/gold theme and look good on every screen size.
//
//   • useToasts()      — small toast stack (auto-dismiss) + notify()/dismiss()
//   • <ToastViewport/> — renders the stack, bottom-right, responsive
//   • <ConfirmDialog/> — accessible modal confirm (replaces window.confirm)

import { useCallback, useState } from "react";
import { CheckCircle2, AlertTriangle, Info, X } from "lucide-react";
import { SAGE, GOLD, OLIVE, LINE, SUCCESS } from "../public/palette";

let toastSeq = 0;

// Manage a tiny stack of toasts. Each auto-dismisses after a few seconds.
export function useToasts() {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback(
    (id) => setToasts((t) => t.filter((x) => x.id !== id)),
    []
  );

  const notify = useCallback((message, tone = "success") => {
    const id = ++toastSeq;
    setToasts((t) => [...t, { id, message, tone }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4200);
    return id;
  }, []);

  return { toasts, notify, dismiss };
}

const TONES = {
  success: { icon: CheckCircle2, color: SUCCESS },
  error: { icon: AlertTriangle, color: "#DC2626" },
  info: { icon: Info, color: SAGE },
};

// Fixed bottom-right toast stack. Width shrinks to the viewport on phones.
export function ToastViewport({ toasts, onDismiss }) {
  if (!toasts?.length) return null;
  return (
    <div className="fixed bottom-4 right-4 z-[80] flex w-[calc(100vw-2rem)] max-w-sm flex-col gap-2 sm:bottom-6 sm:right-6">
      {toasts.map((t) => {
        const cfg = TONES[t.tone] || TONES.info;
        const Icon = cfg.icon;
        return (
          <div
            key={t.id}
            className="rise flex items-start gap-3 rounded-2xl bg-white px-4 py-3"
            style={{ border: `1px solid ${LINE}`, boxShadow: "0 16px 48px rgba(30,37,33,0.16)" }}
          >
            <Icon size={18} color={cfg.color} className="mt-0.5 shrink-0" />
            <p className="flex-1 text-sm leading-snug" style={{ color: OLIVE }}>
              {t.message}
            </p>
            <button
              onClick={() => onDismiss(t.id)}
              aria-label="Dismiss"
              className="mt-0.5 shrink-0 opacity-50 transition-opacity hover:opacity-100"
            >
              <X size={15} color={OLIVE} />
            </button>
          </div>
        );
      })}
    </div>
  );
}

// Accessible confirm modal. `tone="danger"` gives the red destructive styling;
// anything else uses the sage/gold brand styling.
export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  tone = "danger",
  busy = false,
  onConfirm,
  onCancel,
}) {
  if (!open) return null;
  const danger = tone === "danger";
  return (
    <div
      className="fixed inset-0 z-[90] grid place-items-center p-4"
      style={{ background: "rgba(30,37,33,0.45)", backdropFilter: "blur(2px)" }}
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="rise w-full max-w-sm rounded-2xl bg-white p-6"
        style={{ border: `1px solid ${LINE}`, boxShadow: "0 30px 80px rgba(30,37,33,0.28)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <span
            className="grid h-11 w-11 shrink-0 place-items-center rounded-full"
            style={{ background: danger ? "#FEE2E2" : `${GOLD}26` }}
          >
            <AlertTriangle size={21} color={danger ? "#DC2626" : "#9A6B18"} />
          </span>
          <div className="min-w-0">
            <h3 className="text-base font-semibold" style={{ color: OLIVE }}>
              {title}
            </h3>
            {message && (
              <p className="mt-1 text-sm leading-relaxed" style={{ color: `${OLIVE}b3` }}>
                {message}
              </p>
            )}
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-60"
            style={{ border: `1px solid ${LINE}`, color: OLIVE }}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className="rounded-lg px-4 py-2 text-sm font-semibold text-white transition-opacity disabled:opacity-60"
            style={{ background: danger ? "#DC2626" : SAGE }}
          >
            {busy ? "Working…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
