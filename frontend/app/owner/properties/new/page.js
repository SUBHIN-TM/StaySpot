"use client";

// Create a new property  (URL: "/owner/properties/new")

import OwnerShell from "@/components/owner/OwnerShell";
import PropertyForm from "@/components/owner/PropertyForm";

export default function NewPropertyPage() {
  return (
    <OwnerShell active="new">
      <h1 className="text-2xl font-bold text-slate-900">Add a property</h1>
      <p className="mt-1 mb-6 text-slate-500">List a new place for seekers to find.</p>
      <PropertyForm existing={null} />
    </OwnerShell>
  );
}
