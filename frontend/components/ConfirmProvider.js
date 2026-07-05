"use client";

// App-wide confirm dialog. Mounted once in the root layout so ANY component can
// call `const confirm = useConfirm()` and `await confirm(...)` to get a branded,
// on-theme confirmation modal instead of the ugly native window.confirm().
//
//   const confirm = useConfirm();
//   if (!(await confirm("Delete this post?"))) return;               // string form
//   if (!(await confirm({ title: "Delete listing?", message: "…",   // options form
//                         confirmLabel: "Delete", tone: "danger" }))) return;
//
// Returns a Promise<boolean> that resolves true on confirm, false on cancel.

import { createContext, useCallback, useContext, useRef, useState } from "react";
import { ConfirmDialog } from "@/components/owner/feedback";

const ConfirmContext = createContext(() => Promise.resolve(false));
export function useConfirm() {
  return useContext(ConfirmContext);
}

export default function ConfirmProvider({ children }) {
  const [dialog, setDialog] = useState(null); // null = closed
  const resolverRef = useRef(null);

  const confirm = useCallback((opts) => {
    const o = typeof opts === "string" ? { title: opts } : opts || {};
    return new Promise((resolve) => {
      resolverRef.current = resolve;
      setDialog({
        title: o.title || "Are you sure?",
        message: o.message || "",
        confirmLabel: o.confirmLabel || "Confirm",
        cancelLabel: o.cancelLabel || "Cancel",
        tone: o.tone || "danger",
      });
    });
  }, []);

  const close = useCallback((result) => {
    setDialog(null);
    const resolve = resolverRef.current;
    resolverRef.current = null;
    if (resolve) resolve(result);
  }, []);

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <ConfirmDialog
        open={!!dialog}
        title={dialog?.title}
        message={dialog?.message}
        confirmLabel={dialog?.confirmLabel}
        cancelLabel={dialog?.cancelLabel}
        tone={dialog?.tone}
        onConfirm={() => close(true)}
        onCancel={() => close(false)}
      />
    </ConfirmContext.Provider>
  );
}
