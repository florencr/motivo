import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@/app/generated/prisma/enums";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Dealers | Motivo",
  description: "Browse Motivo dealers, ratings, and live inventory counts.",
};

function StarsRow({ rating }: { rating: number }) {
  const clamped = Math.min(5, Math.max(0, rating));
  return (
    <div className="flex items-center gap-0.5 text-amber-500" aria-hidden>
      {[1, 2, 3, 4, 5].map((star) => (
        <span key={star}>{clamped >= star ? "★" : "☆"}</span>
      ))}
    </div>
  );
}

export default async function DealersPage() {
  let dealers: Array<{
    id: string;
    displayName: string;
    logoUrl: string | null;
    address: string | null;
    rating: number | null;
    reviewCount: number;
    publishedCars: number;
  }> = [];
  let loadError: string | null = null;

  try {
    const rows = await prisma.user.findMany({
      where: { role: UserRole.DEALER, isActive: true },
      select: {
        id: true,
        companyName: true,
        name: true,
        companyLogoUrl: true,
        address: true,
        dealerRating: true,
        dealerReviewCount: true,
      },
      orderBy: [{ companyName: "asc" }, { name: "asc" }],
    });

    const counts = await prisma.listing.groupBy({
      by: ["sellerId"],
      where: { isPublished: true },
      _count: { _all: true },
    });
    const countBySeller = new Map(counts.map((c) => [c.sellerId, c._count._all]));

    dealers = rows.map((d) => ({
      id: d.id,
      displayName: (d.companyName?.trim() || d.name).trim(),
      logoUrl: d.companyLogoUrl ?? null,
      address: d.address ?? null,
      rating: d.dealerRating != null ? Number(d.dealerRating) : null,
      reviewCount: d.dealerReviewCount,
      publishedCars: countBySeller.get(d.id) ?? 0,
    }));

    dealers.sort((a, b) => {
      if (b.publishedCars !== a.publishedCars) return b.publishedCars - a.publishedCars;
      return a.displayName.localeCompare(b.displayName, undefined, { sensitivity: "base" });
    });
  } catch (err) {
    loadError = err instanceof Error ? err.message : "Could not load dealers.";
    console.error("[dealers] load failed:", err);
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Dealers</h1>
          <p className="mt-2 text-sm text-slate-600">
            Verified dealers on Motivo — ratings and how many cars they currently list.
          </p>
        </div>

        {loadError ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Dealers could not be loaded: {loadError}
          </div>
        ) : dealers.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white px-5 py-8 text-center text-slate-600">
            No dealers yet. Check back soon.
          </div>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {dealers.map((dealer) => (
              <li key={dealer.id}>
                <Link
                  href={`/dealers/${dealer.id}`}
                  className="flex h-full flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-400 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
                >
                  <article className="flex h-full flex-col">
                  <div className="flex gap-4">
                    <img
                      src={
                        dealer.logoUrl ??
                        "https://placehold.co/96x96/e2e8f0/64748b?text=Logo"
                      }
                      alt={`${dealer.displayName} logo`}
                      className="h-16 w-16 shrink-0 rounded-lg border border-slate-200 object-cover"
                      loading="lazy"
                    />
                    <div className="min-w-0 flex-1">
                      <h2 className="truncate font-semibold text-slate-900">{dealer.displayName}</h2>
                      {dealer.address ? (
                        <p className="mt-1 line-clamp-2 text-xs text-slate-600">{dealer.address}</p>
                      ) : null}
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-slate-100 pt-4">
                    <div className="flex flex-col gap-1">
                      <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
                        Rating
                      </span>
                      {dealer.rating != null && dealer.rating > 0 ? (
                        <div className="flex flex-wrap items-center gap-2">
                          <StarsRow rating={dealer.rating} />
                          <span className="text-sm font-medium text-slate-800">
                            {dealer.rating.toFixed(1)} / 5
                          </span>
                          <span className="text-xs text-slate-600">
                            ({dealer.reviewCount}{" "}
                            {dealer.reviewCount === 1 ? "review" : "reviews"})
                          </span>
                        </div>
                      ) : (
                        <p className="text-sm text-slate-500">No rating yet</p>
                      )}
                    </div>
                    <div className="ml-auto text-right">
                      <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
                        Cars listed
                      </span>
                      <p className="text-xl font-bold tabular-nums text-slate-900">
                        {dealer.publishedCars}
                      </p>
                    </div>
                  </div>
                  </article>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
