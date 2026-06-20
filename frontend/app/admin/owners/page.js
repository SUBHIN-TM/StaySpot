"use client";

// Admin → Owners  (URL: "/admin/owners")

import AdminShell from "@/components/admin/AdminShell";
import UsersList from "@/components/admin/UsersList";

export default function AdminOwnersPage() {
  return (
    <AdminShell active="owners">
      <UsersList role="owner" title="Owners" subtitle="People who list properties." />
    </AdminShell>
  );
}
