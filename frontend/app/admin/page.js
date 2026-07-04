"use client";

// Admin dashboard  (URL: "/admin")
// Protected by <AdminShell>. Loads all listings from the backend and shows
// summary stats + a table. This is the foundation we can grow CRUD on later.

import { useEffect, useState } from "react";
import Link from "next/link";
import { Building2, Users, BadgeCheck } from "lucide-react";
import AdminShell from "@/components/admin/AdminShell";
import { apiGet } from "@/lib/api";
import { getToken } from "@/lib/auth";

// Small stat card used in the top row, with an accent icon chip.
function StatCard({ label, value, icon: Icon, tint }) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-line bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      <span
        className="grid h-12 w-12 shrink-0 place-items-center rounded-xl"
        style={{ background: tint.bg, color: tint.fg }}
      >
        <Icon size={22} />
      </span>
      <div>
        <div className="text-sm text-ink/60">{label}</div>
        <div className="mt-0.5 text-3xl font-bold text-ink">{value}</div>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [properties, setProperties] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Load all properties + all users once the component mounts.
  useEffect(() => {
    async function load() {
      try {
        const [props, allUsers] = await Promise.all([
          apiGet("/properties/all", getToken()),
          apiGet("/users", getToken()),
        ]);
        setProperties(props?.properties || []);
        setUsers(allUsers?.users || []);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Derived stats.
  const total = properties.length;
  const seekers = users.filter((u) => u.role === "seeker").length;
  const owners = users.filter((u) => u.role === "owner").length;

  return (
    <AdminShell active="dashboard">
      <h1 className="text-2xl font-bold text-ink">Dashboard</h1>
      <p className="mt-1 text-ink/60">Overview of StayMate.</p>

      {/* Stat cards (clickable → their sections) */}
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Link href="/admin/properties">
          <StatCard label="Total listings" value={loading ? "…" : total} icon={Building2} tint={{ bg: "rgba(74,90,80,0.12)", fg: "#4A5A50" }} />
        </Link>
        <Link href="/admin/users">
          <StatCard label="Users" value={loading ? "…" : seekers} icon={Users} tint={{ bg: "rgba(212,163,89,0.16)", fg: "#9A6B18" }} />
        </Link>
        <Link href="/admin/owners">
          <StatCard label="Owners" value={loading ? "…" : owners} icon={BadgeCheck} tint={{ bg: "rgba(91,170,111,0.16)", fg: "#3E8E57" }} />
        </Link>
      </div>

      {/* Listings table */}
      <div className="mt-8 overflow-hidden rounded-2xl border border-line bg-white">
        <div className="border-b border-line px-5 py-4">
          <h2 className="font-semibold text-ink">All listings</h2>
        </div>

        {error ? (
          <p className="p-6 text-red-600">Couldn’t load listings: {error}</p>
        ) : loading ? (
          <p className="p-6 text-ink/60">Loading…</p>
        ) : total === 0 ? (
          <p className="p-6 text-ink/60">No listings yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-mist text-ink/60">
                <tr>
                  <th className="px-5 py-3 font-medium">Title</th>
                  <th className="px-5 py-3 font-medium">Type</th>
                  <th className="px-5 py-3 font-medium">City</th>
                  <th className="px-5 py-3 font-medium">Rent</th>
                  <th className="px-5 py-3 font-medium">Owner</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {properties.map((p) => (
                  <tr key={p.id} className="hover:bg-mist">
                    <td className="px-5 py-3 font-medium text-ink">{p.title}</td>
                    <td className="px-5 py-3 capitalize text-ink/70">{p.property_type}</td>
                    <td className="px-5 py-3 text-ink/70">{p.city || "—"}</td>
                    <td className="px-5 py-3 text-ink/70">
                      ₹{Number(p.rent_amount).toLocaleString("en-IN")}
                    </td>
                    <td className="px-5 py-3 text-ink/70">{p.owner?.name || "—"}</td>
                    <td className="px-5 py-3">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          p.is_available
                            ? "bg-green-100 text-green-700"
                            : "bg-mist text-ink/60"
                        }`}
                      >
                        {p.is_available ? "Available" : "Unavailable"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
