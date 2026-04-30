"use client";

import { useEffect, useState } from "react";

type UserItem = {
  id: string;
  name: string;
  email: string;
  role: string;
  sellerType?: string | null;
  companyName?: string | null;
  isActive: boolean;
  isVerified: boolean;
  listings: Array<{
    id: string;
    title: string;
    price: string | number;
    currency: string;
    year: number;
    isPublished: boolean;
  }>;
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [error, setError] = useState("");

  async function loadUsers() {
    const res = await fetch("/api/admin/users");
    const data = await res.json();
    setUsers(data.users ?? []);
  }

  useEffect(() => {
    loadUsers();
  }, []);

  async function toggleUser(user: UserItem) {
    setError("");
    const res = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.id, isActive: !user.isActive }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data?.error ?? "Failed to update user");
      return;
    }
    await loadUsers();
  }

  return (
    <main className="space-y-6">
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-3xl font-bold text-slate-900">Admin Users</h1>
        <p className="mt-2 text-sm text-slate-600">View sellers (companies/private) and all their listings.</p>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead className="border-b border-slate-200 text-slate-600">
              <tr>
                <th className="py-2">Name</th>
                <th className="py-2">Email</th>
                <th className="py-2">Role</th>
                <th className="py-2">Company</th>
                <th className="py-2">Listings</th>
                <th className="py-2">Verified</th>
                <th className="py-2">Status</th>
                <th className="py-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-slate-100">
                  <td className="py-2 text-slate-800">
                    <a href={`/admin/users/${user.id}`} className="text-blue-700 hover:text-blue-800 hover:underline">
                      {user.name}
                    </a>
                  </td>
                  <td className="py-2 text-slate-700">{user.email}</td>
                  <td className="py-2 text-slate-700">{user.role}</td>
                  <td className="py-2 text-slate-700">{user.companyName ?? "-"}</td>
                  <td className="py-2 text-slate-700">
                    <div className="space-y-1">
                      <p className="text-xs text-slate-500">{user.listings.length} listing(s)</p>
                      {user.listings.slice(0, 3).map((listing) => (
                        <p key={listing.id} className="text-xs">
                          {listing.title} ({listing.year}) - {listing.currency} {Number(listing.price).toLocaleString()}
                        </p>
                      ))}
                      {user.listings.length > 3 ? (
                        <p className="text-xs text-slate-500">+{user.listings.length - 3} more...</p>
                      ) : null}
                    </div>
                  </td>
                  <td className="py-2 text-slate-700">{user.isVerified ? "Yes" : "No"}</td>
                  <td className="py-2 text-slate-700">{user.isActive ? "Active" : "Suspended"}</td>
                  <td className="py-2">
                    <button
                      type="button"
                      onClick={() => toggleUser(user)}
                      className="rounded border border-slate-300 px-2 py-1 text-xs text-slate-700"
                    >
                      {user.isActive ? "Suspend" : "Activate"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
