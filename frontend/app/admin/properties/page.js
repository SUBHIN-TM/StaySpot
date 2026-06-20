"use client";

// Admin → Properties  (URL: "/admin/properties")

import AdminShell from "@/components/admin/AdminShell";
import PropertiesList from "@/components/admin/PropertiesList";

export default function AdminPropertiesPage() {
  return (
    <AdminShell active="properties">
      <PropertiesList />
    </AdminShell>
  );
}
