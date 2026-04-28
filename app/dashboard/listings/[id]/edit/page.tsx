"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type ListingForm = {
  id: string;
  title: string;
  year: number;
  mileageKm: number;
  price: string | number;
  fuelType: "PETROL" | "DIESEL" | "ELECTRIC" | "HYBRID";
  transmission: "MANUAL" | "AUTOMATIC";
  city: string | null;
  description: string;
};

export default function EditListingPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [listing, setListing] = useState<ListingForm | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/dashboard/listings/${params.id}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error ?? "Failed to load listing");
        setLoading(false);
        return;
      }
      setListing(data.listing);
      setLoading(false);
    }
    if (params.id) load();
  }, [params.id]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!listing) return;
    setError("");
    setSuccess("");

    const res = await fetch(`/api/dashboard/listings/${params.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(listing),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data?.error ?? "Failed to update listing");
      return;
    }
    setSuccess("Listing updated.");
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-100 px-4 py-8">
        <div className="mx-auto max-w-3xl rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-600">Loading...</p>
        </div>
      </main>
    );
  }

  if (!listing) {
    return (
      <main className="min-h-screen bg-slate-100 px-4 py-8">
        <div className="mx-auto max-w-3xl rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-red-600">{error || "Listing not found."}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-3xl font-bold text-slate-900">Edit Listing</h1>
          <button
            type="button"
            onClick={() => router.push("/dashboard/listings")}
            className="rounded border border-slate-300 px-3 py-1.5 text-xs text-slate-700"
          >
            Back to Listings
          </button>
        </div>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        {success && <p className="mt-3 text-sm text-emerald-700">{success}</p>}

        <form onSubmit={onSubmit} className="mt-5 space-y-3">
          <input
            value={listing.title}
            onChange={(e) => setListing({ ...listing, title: e.target.value })}
            placeholder="Title"
            required
            className="h-11 w-full rounded-lg border border-slate-300 px-3 text-sm"
          />

          <div className="grid gap-3 sm:grid-cols-3">
            <input
              type="number"
              value={listing.year}
              onChange={(e) => setListing({ ...listing, year: Number(e.target.value) })}
              placeholder="Year"
              min="1900"
              required
              className="h-11 rounded-lg border border-slate-300 px-3 text-sm"
            />
            <input
              type="number"
              value={listing.mileageKm}
              onChange={(e) => setListing({ ...listing, mileageKm: Number(e.target.value) })}
              placeholder="Mileage km"
              min="0"
              required
              className="h-11 rounded-lg border border-slate-300 px-3 text-sm"
            />
            <input
              type="number"
              value={listing.price}
              onChange={(e) => setListing({ ...listing, price: Number(e.target.value) })}
              placeholder="Price"
              min="0"
              required
              className="h-11 rounded-lg border border-slate-300 px-3 text-sm"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <select
              value={listing.fuelType}
              onChange={(e) =>
                setListing({
                  ...listing,
                  fuelType: e.target.value as ListingForm["fuelType"],
                })
              }
              className="h-11 rounded-lg border border-slate-300 bg-white px-3 text-sm"
            >
              <option value="PETROL">Petrol</option>
              <option value="DIESEL">Diesel</option>
              <option value="ELECTRIC">Electric</option>
              <option value="HYBRID">Hybrid</option>
            </select>
            <select
              value={listing.transmission}
              onChange={(e) =>
                setListing({
                  ...listing,
                  transmission: e.target.value as ListingForm["transmission"],
                })
              }
              className="h-11 rounded-lg border border-slate-300 bg-white px-3 text-sm"
            >
              <option value="MANUAL">Manual</option>
              <option value="AUTOMATIC">Automatic</option>
            </select>
            <input
              value={listing.city ?? ""}
              onChange={(e) => setListing({ ...listing, city: e.target.value })}
              placeholder="City"
              className="h-11 rounded-lg border border-slate-300 px-3 text-sm"
            />
          </div>

          <textarea
            value={listing.description}
            onChange={(e) => setListing({ ...listing, description: e.target.value })}
            placeholder="Description"
            required
            className="min-h-32 w-full rounded-lg border border-slate-300 p-3 text-sm"
          />

          <button
            type="submit"
            className="h-11 rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white"
          >
            Save Changes
          </button>
        </form>
      </div>
    </main>
  );
}
