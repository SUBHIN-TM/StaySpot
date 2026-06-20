"use client";

// Admin → Users (regular users / seekers)  (URL: "/admin/users")

import AdminShell from "@/components/admin/AdminShell";
import UsersList from "@/components/admin/UsersList";

export default function AdminUsersPage() {
  return (
    <AdminShell active="users">
      <UsersList role="seeker" title="Users" subtitle="People looking for a place (seekers)." />
    </AdminShell>
  );
}
