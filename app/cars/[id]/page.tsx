import type { Metadata } from "next";
import { notFound } from "next/navigation";
import CarGallery from "../../components/car-gallery";
import CardActions from "../../components/card-actions";
import FinanceCalculator from "../../components/finance-calculator";
import { prisma } from "@/lib/prisma";
import { getFeatureListFromFeatures, getImageUrlsFromFeatures, getSelectedTagsFromFeatures } from "@/lib/listing-images";
import { evaluateListingPrice } from "@/lib/price-evaluator";

type CarDetailsPageProps = {
  params: Promise<{ id: string }>;
};

function toLabel(value: string) {
  return value.charAt(0) + value.slice(1).toLowerCase();
}

function getPriceValueLabel(priceValue: number) {
  if (priceValue >= 4) return "Good Price";
  if (priceValue === 3) return "Fair Price";
  return "High Price";
}

export async function generateMetadata({
  params,
}: CarDetailsPageProps): Promise<Metadata> {
  const { id } = await params;
  const listing = await prisma.listing.findUnique({
    where: { id },
    select: {
      title: true,
      year: true,
      city: true,
      mileageKm: true,
      fuelType: true,
      transmission: true,
    },
  });
  if (!listing) {
    return {
      title: "Car Not Found | Motivo",
      description: "This car listing is not available.",
    };
  }
  return {
    title: `${listing.title} | Motivo`,
    description: `${listing.year} ${listing.title} in ${listing.city ?? "Unknown"}. ${listing.mileageKm.toLocaleString()} km, ${toLabel(listing.fuelType)}, ${toLabel(listing.transmission)}.`,
  };
}

export default async function CarDetailsPage({ params }: CarDetailsPageProps) {
  const { id } = await params;
  const listing = await prisma.listing.findUnique({
    where: { id },
    include: {
      seller: true,
    },
  });
  if (!listing || !listing.isPublished) {
    notFound();
  }

  const pricingPool = await prisma.listing.findMany({
    where: { isPublished: true },
    select: {
      id: true,
      price: true,
      year: true,
      mileageKm: true,
      powerHp: true,
      ownerCount: true,
      hasAccidentHistory: true,
      damageSeverity: true,
      hasServiceHistory: true,
      modelId: true,
      makeId: true,
      features: true,
    },
  });

  const priceEval = evaluateListingPrice(
    {
      id: listing.id,
      price: Number(listing.price),
      year: listing.year,
      mileageKm: listing.mileageKm,
      powerHp: listing.powerHp,
      ownerCount: listing.ownerCount,
      hasAccidentHistory: listing.hasAccidentHistory,
      damageSeverity: listing.damageSeverity,
      hasServiceHistory: listing.hasServiceHistory,
      modelId: listing.modelId,
      makeId: listing.makeId,
      features: listing.features,
    },
    pricingPool.map((item) => ({
      id: item.id,
      price: Number(item.price),
      year: item.year,
      mileageKm: item.mileageKm,
      powerHp: item.powerHp,
      ownerCount: item.ownerCount,
      hasAccidentHistory: item.hasAccidentHistory,
      damageSeverity: item.damageSeverity,
      hasServiceHistory: item.hasServiceHistory,
      modelId: item.modelId,
      makeId: item.makeId,
      features: item.features,
    })),
  );

  const similarListingsPrimary = await prisma.listing.findMany({
    where: {
      isPublished: true,
      id: { not: listing.id },
      makeId: listing.makeId,
    },
    orderBy: { createdAt: "desc" },
    take: 4,
  });
  const similarListings =
    similarListingsPrimary.length > 0
      ? similarListingsPrimary
      : await prisma.listing.findMany({
          where: {
            isPublished: true,
            id: { not: listing.id },
          },
          orderBy: { createdAt: "desc" },
          take: 4,
        });

  const car = {
    id: listing.id,
    title: listing.title,
    make: listing.makeName,
    model: listing.modelName,
    city: listing.city ?? "Unknown",
    year: listing.year,
    price: Number(listing.price),
    mileageKm: listing.mileageKm,
    transmission: toLabel(listing.transmission),
    fuelType: toLabel(listing.fuelType),
    engine: listing.engineCapacity ? `${listing.engineCapacity} cc` : "-",
    powerHp: listing.powerHp ?? 0,
    driveTrain: listing.driveTrain ? toLabel(listing.driveTrain) : "-",
    sellerUsername: listing.seller.companyName || listing.seller.name,
    sellerLogo:
      listing.seller.companyLogoUrl ||
      listing.seller.avatarUrl ||
      "/images/no-logo.svg",
    sellerPhone: listing.seller.phone ?? "-",
    sellerAddress: listing.seller.address ?? "Address not provided",
    sellerAbout:
      listing.seller.profileDescription ||
      "No profile description provided yet.",
    sellerRating: listing.seller.dealerRating ?? 0,
    sellerReviews: listing.seller.dealerReviewCount ?? 0,
    priceValue: priceEval.priceValue,
    isTaxRefundable: listing.isTaxRefundable,
    sellerDescription: listing.description,
    vendorTags: getSelectedTagsFromFeatures(listing.features),
    features: getFeatureListFromFeatures(listing.features),
    photos: (() => {
      const urls = getImageUrlsFromFeatures(listing.features);
      return urls.length > 0 ? urls : ["/images/no-photo.svg"];
    })(),
  };
  const similarCars = similarListings.map((item) => {
    const photos = getImageUrlsFromFeatures(item.features);
    return {
      id: item.id,
      title: item.title,
      photos: photos.length > 0 ? photos : ["/images/no-photo.svg"],
      year: item.year,
      mileageKm: item.mileageKm,
      price: Number(item.price),
    };
  });

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: car.title,
    description: car.sellerDescription,
    brand: car.make,
    image: car.photos,
    offers: {
      "@type": "Offer",
      priceCurrency: "EUR",
      price: car.price,
      availability: "https://schema.org/InStock",
    },
  };

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 sm:px-6 lg:px-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-6 lg:grid-cols-3">
          <section className="lg:col-span-2">
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <CarGallery
                photos={car.photos}
                title={car.title}
                containerClassName="rounded-none"
                imageClassName="h-72 sm:h-[420px] lg:h-[520px]"
                showThumbnails
              />
              <div className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h1 className="text-3xl font-bold text-slate-900">{car.title}</h1>
                    <p className="mt-1 text-sm text-slate-600">
                      {car.make} {car.model} - {car.city}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-slate-900">
                      EUR {car.price.toLocaleString()}
                    </p>
                    {car.isTaxRefundable && (
                      <p className="mt-1 text-xs font-medium text-slate-600">
                        (tax refundable)
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  {car.vendorTags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-medium text-slate-700"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-xl font-semibold text-slate-900">Vehicle Details</h2>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="text-slate-500">Registration</p>
                  <p className="mt-1 font-semibold text-slate-900">{car.year}</p>
                </div>
                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="text-slate-500">Mileage</p>
                  <p className="mt-1 font-semibold text-slate-900">
                    {car.mileageKm.toLocaleString()} km
                  </p>
                </div>
                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="text-slate-500">Fuel Type</p>
                  <p className="mt-1 font-semibold text-slate-900">{car.fuelType}</p>
                </div>
                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="text-slate-500">Transmission</p>
                  <p className="mt-1 font-semibold text-slate-900">{car.transmission}</p>
                </div>
                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="text-slate-500">Engine</p>
                  <p className="mt-1 font-semibold text-slate-900">{car.engine}</p>
                </div>
                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="text-slate-500">Power</p>
                  <p className="mt-1 font-semibold text-slate-900">{car.powerHp} hp</p>
                </div>
                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="text-slate-500">Drive Train</p>
                  <p className="mt-1 font-semibold text-slate-900">{car.driveTrain}</p>
                </div>
                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="text-slate-500">Location</p>
                  <p className="mt-1 font-semibold text-slate-900">{car.city}</p>
                </div>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-xl font-semibold text-slate-900">Description</h2>
              <p className="mt-3 text-sm leading-7 text-slate-700">{car.sellerDescription}</p>
            </div>

            <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-xl font-semibold text-slate-900">Features</h2>
              {car.features.length > 0 ? (
                <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {car.features.map((feature) => (
                    <div
                      key={feature}
                      className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700"
                    >
                      {feature}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-sm text-slate-600">No features listed yet.</p>
              )}
            </div>
          </section>

          <aside className="space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">Price</h2>
              <p className="mt-2 text-3xl font-bold text-slate-900">
                EUR {car.price.toLocaleString()}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <p className="text-sm text-slate-600">
                  Tax: {car.isTaxRefundable ? "Refundable" : "Not refundable"}
                </p>
                <div className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-2 py-1">
                  <span className="inline-flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((step) => {
                      const filled = step <= car.priceValue;
                      const colorClass =
                        step <= 2
                          ? "bg-red-500"
                          : step === 3
                            ? "bg-amber-500"
                            : "bg-emerald-500";
                      return (
                        <span
                          key={step}
                          className={`h-1.5 w-4 rounded-full ${
                            filled ? colorClass : "bg-slate-200"
                          }`}
                        />
                      );
                    })}
                  </span>
                  <span className="text-[10px] font-medium text-slate-600">
                    {getPriceValueLabel(car.priceValue)}
                  </span>
                </div>
              </div>

              <FinanceCalculator price={car.price} />
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <CardActions
                carTitle={car.title}
                viewHref={`/cars/${car.id}`}
                showViewButton={false}
                showTextLabels
                showShareButton
              />
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">Seller</h2>
              <div className="mt-3 flex items-start gap-3">
                <img
                  src={car.sellerLogo}
                  alt={`${car.sellerUsername} logo`}
                  className="h-14 w-14 shrink-0 rounded-lg border border-slate-200 object-cover"
                  loading="lazy"
                />
                <div>
                  <p className="text-sm font-medium text-slate-700">@{car.sellerUsername}</p>
                  <p className="mt-1 text-sm text-slate-600">{car.sellerAddress}</p>
                </div>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <div className="flex items-center gap-0.5 text-amber-500">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span key={star}>
                      {car.sellerRating >= star ? "★" : "☆"}
                    </span>
                  ))}
                </div>
                <p className="text-sm font-medium text-slate-700">
                  {car.sellerRating.toFixed(1)} / 5 ({car.sellerReviews} reviews)
                </p>
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-600">{car.sellerAbout}</p>
              <p className="mt-3 text-base font-semibold text-slate-900">
                <span className="font-medium">Phone:</span>{" "}
                <a href={`tel:${car.sellerPhone}`} className="text-blue-700 hover:text-blue-800 hover:underline">
                  {car.sellerPhone}
                </a>
              </p>
              <div className="mt-3 overflow-hidden rounded-lg border border-slate-200">
                <iframe
                  title={`Map of ${car.sellerUsername}`}
                  src={`https://www.google.com/maps?q=${encodeURIComponent(
                    car.sellerAddress
                  )}&output=embed`}
                  className="h-40 w-full"
                  loading="lazy"
                />
              </div>
              <div className="mt-4 space-y-2">
                <a
                  href={`tel:${car.sellerPhone}`}
                  className="block rounded-lg bg-slate-900 px-4 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-slate-700"
                >
                  Call Seller
                </a>
                <a
                  href="#"
                  className="block rounded-lg border border-slate-300 px-4 py-2.5 text-center text-sm font-medium text-slate-700 transition hover:border-slate-500 hover:bg-slate-50"
                >
                  Send Message
                </a>
              </div>
            </div>

          </aside>
        </div>

        <section className="mt-8">
          <h2 className="text-2xl font-semibold text-slate-900">Similar Cars</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {similarCars.map((item) => (
              <a
                key={item.id}
                href={`/cars/${item.id}`}
                className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:border-slate-400"
              >
                <img
                  src={item.photos[0]}
                  alt={item.title}
                  className="h-44 w-full object-cover"
                  loading="lazy"
                />
                <div className="p-4">
                  <p className="text-base font-semibold text-slate-900">{item.title}</p>
                  <p className="mt-1 text-sm text-slate-600">
                    {item.year} - {item.mileageKm.toLocaleString()} km
                  </p>
                  <p className="mt-2 text-lg font-bold text-slate-900">
                    EUR {item.price.toLocaleString()}
                  </p>
                </div>
              </a>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
