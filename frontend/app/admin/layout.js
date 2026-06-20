// Layout for everything under /admin.
// It deliberately does NOT render the public Navbar/Footer — the admin area
// has its own look. We also tell search engines not to index admin pages.

export const metadata = {
  title: "Admin",
  robots: { index: false, follow: false }, // keep admin pages out of Google
};

export default function AdminLayout({ children }) {
  return <div className="min-h-screen bg-slate-100">{children}</div>;
}
