"use client";

// App-wide snackbar/toast system. Mounted once in the root layout so ANY component
// can call `useToast()(message, tone)` to show a snackbar, and because the provider
// lives above the pages, toasts survive client-side navigations (e.g. show "Saved"
// then redirect, and it stays visible on the next page).
//
//   const toast = useToast();
//   toast("Changes saved.");            // success (default)
//   toast("Couldn't save.", "error");   // error
//   toast("We emailed a code.", "info");

import { createContext, useCallback, useContext, useState } from "react";
import { ToastViewport } from "@/components/owner/feedback";

const ToastContext = createContext(() => {});
export function useToast() {
  return useContext(ToastContext);
}

let seq = 0;

export default function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  const notify = useCallback((message, tone = "success") => {
    if (!message) return;
    const id = ++seq;
    setToasts((t) => [...t, { id, message, tone }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4400);
  }, []);

  return (
    <ToastContext.Provider value={notify}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}
