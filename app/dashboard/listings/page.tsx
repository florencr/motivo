"use client";

import { useEffect, useState } from "react";

type ListingItem = {
  id: string;
  title: string;
  slug: string;
  price: string | number;
  currency: string;
  year: number;
  mileageKm: number;
  city: string | null;
  isPublished: boolean;
  coverImageUrl?: string | null;
};

export default function DashboardListingsPage() {
  const [listings, setListings] = useState<ListingItem[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadListings() {
    const res = await fetch("/api/dashboard/listings");
    const data = await res.json();
    if (!res.ok) {
      setError(data?.error ?? "Failed to load listings");
      setLoading(false);
      return;
    }
    setListings(data.listings ?? []);
    setLoading(false);
  }

  useEffect(() => {
    loadListings();
  }, []);

  async function togglePublished(item: ListingItem) {
    setError("");
    const res = await fetch("/api/dashboard/listings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listingId: item.id, isPublished: !item.isPublished }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data?.error ?? "Failed to update listing");
      return;
    }
    setListings((prev) =>
      prev.map((l) => (l.id === item.id ? { ...l, isPublished: data.listing.isPublished } : l))
    );
  }

  async function deleteListing(item: ListingItem) {
    setError("");
    const res = await fetch("/api/dashboard/listings", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listingId: item.id }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data?.error ?? "Failed to delete listing");
      return;
    }
    setListings((prev) => prev.filter((l) => l.id !== item.id));
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">My Listings</h1>
            <p className="mt-1 text-sm text-slate-600">Manage your vehicle listings.</p>
          </div>
          <a
            href="/sell"
            className="inline-flex rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
          >
            Add New Vehicle
          </a>
        </div>

        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
        {loading ? (
          <p className="mt-4 text-sm text-slate-600">Loading...</p>
        ) : listings.length === 0 ? (
          <p className="mt-4 text-sm text-slate-600">No listings yet.</p>
        ) : (
          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead className="border-b border-slate-200 text-slate-600">
                <tr>
                  <th className="py-2">Title</th>
                  <th className="py-2">Price</th>
                  <th className="py-2">Year</th>
                  <th className="py-2">Mileage</th>
                  <th className="py-2">City</th>
                  <th className="py-2">Status</th>
                  <th className="py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {listings.map((item) => (
                  <tr key={item.id} className="border-b border-slate-100">
                    <td className="py-2">
                      <div className="flex items-center gap-3">
                        <img
                          src={item.coverImageUrl ?? "/images/no-photo.svg"}
                          alt={item.title}
                          className="h-12 w-16 rounded border border-slate-200 object-cover"
                          loading="lazy"
                        />
                        <a href={`/cars/${item.id}`} className="font-medium text-slate-800 hover:underline">
                          {item.title}
                        </a>
                      </div>
                    </td>
                    <td className="py-2 text-slate-700">
                      {item.currency} {Number(item.price).toLocaleString()}
                    </td>
                    <td className="py-2 text-slate-700">{item.year}</td>
                    <td className="py-2 text-slate-700">{item.mileageKm.toLocaleString()} km</td>
                    <td className="py-2 text-slate-700">{item.city ?? "-"}</td>
                    <td className="py-2 text-slate-700">
                      {item.isPublished ? "Published" : "Unpublished"}
                    </td>
                    <td className="py-2">
                      <div className="flex items-center gap-2">
                        <a
                          href={`/dashboard/listings/${item.id}/edit`}
                          className="rounded border border-slate-300 px-2 py-1 text-xs text-slate-700"
                        >
                          Edit
                        </a>
                        <button
                          type="button"
                          onClick={() => togglePublished(item)}
                          className="rounded border border-slate-300 px-2 py-1 text-xs text-slate-700"
                        >
                          {item.isPublished ? "Unpublish" : "Publish"}
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteListing(item)}
                          className="rounded border border-red-300 px-2 py-1 text-xs text-red-700"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
