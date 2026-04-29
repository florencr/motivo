import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import CarGallery from "@/app/components/car-gallery";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@/app/generated/prisma/enums";
import { getImageUrlsFromFeatures } from "@/lib/listing-images";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
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

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const dealer = await prisma.user.findFirst({
    where: { id, role: UserRole.DEALER, isActive: true },
    select: { companyName: true, name: true },
  });
  if (!dealer) {
    return { title: "Dealer | Motivo" };
  }
  const label = (dealer.companyName?.trim() || dealer.name).trim();
  return {
    title: `${label} — Cars for sale | Motivo`,
    description: `Browse vehicles listed by ${label} on Motivo.`,
  };
}

export default async function DealerInventoryPage({ params }: PageProps) {
  const { id } = await params;

  const dealer = await prisma.user.findFirst({
    where: { id, role: UserRole.DEALER, isActive: true },
    select: {
      id: true,
      companyName: true,
      name: true,
      companyLogoUrl: true,
      address: true,
      dealerRating: true,
      dealerReviewCount: true,
    },
  });

  if (!dealer) {
    notFound();
  }

  const displayName = (dealer.companyName?.trim() || dealer.name).trim();
  const rating =
    dealer.dealerRating != null ? Number(dealer.dealerRating) : null;

  const listings = await prisma.listing.findMany({
    where: { sellerId: dealer.id, isPublished: true },
    orderBy: { createdAt: "desc" },
  });

  const fuelMap: Record<string, string> = {
    PETROL: "Petrol",
    DIESEL: "Diesel",
    ELECTRIC: "Electric",
    HYBRID: "Hybrid",
  };
  const transmissionMap: Record<string, string> = {
    MANUAL: "Manual",
    AUTOMATIC: "Automatic",
  };

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6">
          <Link
            href="/dealers"
            className="text-sm font-medium text-slate-600 underline-offset-4 hover:text-slate-900 hover:underline"
          >
            ← All dealers
          </Link>
        </div>

        <header className="mb-8 flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:flex-row sm:items-start sm:gap-6">
          <img
            src={
              dealer.companyLogoUrl ??
              "https://placehold.co/112x112/e2e8f0/64748b?text=Logo"
            }
            alt={`${displayName} logo`}
            className="h-28 w-28 shrink-0 rounded-xl border border-slate-200 object-cover"
          />
          <div className="min-w-0 flex-1">
            <h1 className="text-3xl font-bold text-slate-900">{displayName}</h1>
            {dealer.address ? (
              <p className="mt-2 text-sm text-slate-600">{dealer.address}</p>
            ) : null}
            <div className="mt-3 flex flex-wrap items-center gap-3">
              {rating != null && rating > 0 ? (
                <>
                  <StarsRow rating={rating} />
                  <span className="text-sm font-medium text-slate-800">
                    {rating.toFixed(1)} / 5
                  </span>
                  <span className="text-sm text-slate-600">
                    ({dealer.dealerReviewCount}{" "}
                    {dealer.dealerReviewCount === 1 ? "review" : "reviews"})
                  </span>
                </>
              ) : (
                <span className="text-sm text-slate-500">No rating yet</span>
              )}
              <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-800">
                {listings.length}{" "}
                {listings.length === 1 ? "car listed" : "cars listed"}
              </span>
            </div>
          </div>
        </header>

        <section>
          <h2 className="sr-only">Cars from this dealer</h2>
          {listings.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white px-5 py-10 text-center text-slate-600">
              This dealer has no published listings yet.
            </div>
          ) : (
            <div className="grid gap-4">
              {listings.map((item) => {
                const photos = getImageUrlsFromFeatures(item.features);
                const imageUrls =
                  photos.length > 0
                    ? photos
                    : ["https://placehold.co/1200x800?text=No+Photo"];
                const fuel = fuelMap[item.fuelType] ?? String(item.fuelType);
                const transmission =
                  transmissionMap[item.transmission] ??
                  String(item.transmission);

                return (
                  <article
                    key={item.id}
                    className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm lg:flex"
                  >
                    <div className="lg:w-[360px] lg:shrink-0">
                      <CarGallery
                        photos={imageUrls}
                        title={item.title}
                        containerClassName="h-56 rounded-none lg:h-72 lg:rounded-l-xl"
                        frameClassName="rounded-none"
                        imageClassName="h-56 lg:h-72"
                      />
                    </div>
                    <div className="flex flex-1 flex-col p-5">
                      <h3 className="text-xl font-semibold text-slate-900">
                        <Link
                          href={`/cars/${item.id}`}
                          className="transition hover:text-slate-700 hover:underline"
                        >
                          {item.title}
                        </Link>
                      </h3>
                      <p className="mt-2 line-clamp-2 text-sm text-slate-600">
                        {item.description}
                      </p>
                      <p className="mt-3 text-xs text-slate-600">
                        {item.year} · {item.mileageKm.toLocaleString()} km · {fuel}{" "}
                        · {transmission}
                        {item.city ? ` · ${item.city}` : ""}
                      </p>
                      <div className="mt-4 flex flex-wrap items-baseline gap-2">
                        <p className="text-2xl font-bold text-slate-900">
                          {item.currency} {Number(item.price).toLocaleString()}
                        </p>
                        {item.isTaxRefundable ? (
                          <span className="text-xs font-medium text-slate-600">
                            (tax refundable)
                          </span>
                        ) : null}
                      </div>
                      <div className="mt-4">
                        <Link
                          href={`/cars/${item.id}`}
                          className="inline-flex rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
                        >
                          View car
                        </Link>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
