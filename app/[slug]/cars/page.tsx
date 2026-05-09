import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import CarGallery from "@/app/components/car-gallery";
import { getVehicleTypePageConfig } from "@/lib/vehicle-type-pages";
import { getDealerByPublicSlug } from "@/lib/dealer-public-page";
import { prisma } from "@/lib/prisma";
import { getImageUrlsFromFeatures } from "@/lib/listing-images";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  if (getVehicleTypePageConfig(slug)) return {};
  const dealer = await getDealerByPublicSlug(slug);
  if (!dealer) return {};
  const label = (dealer.companyName?.trim() || dealer.name).trim();
  return {
    title: `Makinat — ${label}`,
    description: `Lista e mjeteve të publikuara nga ${label} në Motivo.`,
  };
}

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

export default async function DealerCarsPage({ params }: PageProps) {
  const { slug } = await params;
  if (getVehicleTypePageConfig(slug)) {
    notFound();
  }

  const dealer = await getDealerByPublicSlug(slug);
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
    PETROL: "Benzinë",
    DIESEL: "Naftë",
    ELECTRIC: "Elektrik",
    HYBRID: "Hibrid",
  };
  const transmissionMap: Record<string, string> = {
    MANUAL: "Manual",
    AUTOMATIC: "Automatik",
  };

  return (
    <main className="space-y-8">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">
          Makinat nga {displayName}
        </h1>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          {rating != null && rating > 0 ? (
            <>
              <StarsRow rating={rating} />
              <span className="text-sm font-medium text-slate-800">
                {rating.toFixed(1)} / 5
              </span>
              <span className="text-sm text-slate-600">
                ({dealer.dealerReviewCount}{" "}
                {dealer.dealerReviewCount === 1 ? "vlerësim" : "vlerësime"})
              </span>
            </>
          ) : (
            <span className="text-sm text-slate-500">Ende pa vlerësim</span>
          )}
          <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-800">
            {listings.length}{" "}
            {listings.length === 1 ? "mjet i listuar" : "mjete të listuara"}
          </span>
        </div>
      </section>

      <section>
        <h2 className="sr-only">Lista e mjeteve</h2>
        {listings.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white px-5 py-10 text-center text-slate-600">
            Ky koncesionar ende nuk ka listime të publikuara.
          </div>
        ) : (
          <div className="grid gap-4">
            {listings.map((item) => {
              const photos = getImageUrlsFromFeatures(item.features);
              const imageUrls =
                photos.length > 0 ? photos : ["/images/no-photo.svg"];
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
                        href={`/makina/${item.slug || item.id}`}
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
                          (tatim i rimbursueshëm)
                        </span>
                      ) : null}
                    </div>
                    <div className="mt-4">
                      <Link
                        href={`/makina/${item.slug || item.id}`}
                        className="inline-flex rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
                      >
                        Shiko mjetin
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
