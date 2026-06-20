"use client";

// Wraps the whole app so any page can use Google sign-in.
// If the Google Client ID isn't configured we just render the app without the
// provider (the login button stays disabled), so the site never crashes.

import { GoogleOAuthProvider } from "@react-oauth/google";

export default function Providers({ children }) {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  if (!clientId) return children;
  return <GoogleOAuthProvider clientId={clientId}>{children}</GoogleOAuthProvider>;
}
