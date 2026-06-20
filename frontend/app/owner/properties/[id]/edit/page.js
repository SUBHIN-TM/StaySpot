"use client";

// Edit an existing property  (URL: "/owner/properties/<id>/edit")
// Loads the property, then reuses PropertyForm in edit mode.

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import OwnerShell from "@/components/owner/OwnerShell";
import PropertyForm from "@/components/owner/PropertyForm";
import { apiGet } from "@/lib/api";

export default function EditPropertyPage() {
  const { id } = useParams();
  const [property, setProperty] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const data = await apiGet(`/properties/${id}`);
        setProperty(data.property);
      } catch (e) {
        setError(e.message);
      }
    })();
  }, [id]);

  return (
    <OwnerShell active="dashboard">
      <h1 className="text-2xl font-bold text-slate-900">Edit property</h1>
      <p className="mt-1 mb-6 text-slate-500">Update your listing details.</p>
      {error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-red-700">{error}</p>
      ) : !property ? (
        <p className="text-slate-500">Loading…</p>
      ) : (
        <PropertyForm existing={property} />
      )}
    </OwnerShell>
  );
}
