import type { Metadata } from "next";
import { notFound } from "next/navigation";
import CarGallery from "../../components/car-gallery";
import CardActions from "../../components/card-actions";
import FinanceCalculator from "../../components/finance-calculator";
import { prisma } from "@/lib/prisma";
import { getImageUrlsFromFeatures } from "@/lib/listing-images";

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

  const similarListings = await prisma.listing.findMany({
    where: {
      isPublished: true,
      id: { not: listing.id },
      makeId: listing.makeId,
    },
    orderBy: { createdAt: "desc" },
    take: 3,
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
      "https://placehold.co/200x200?text=Seller",
    sellerPhone: listing.seller.phone ?? "-",
    sellerAddress: listing.seller.address ?? "Address not provided",
    sellerAbout:
      "Trusted local seller focused on transparent vehicle history and clean transactions.",
    sellerRating: 4.7,
    sellerReviews: 126,
    priceValue: 3,
    isTaxRefundable: listing.isTaxRefundable,
    sellerDescription: listing.description,
    vendorTags: [] as string[],
    features: [
      "ABS",
      "Adaptive cornering lights",
      "Adaptive Cruise Control",
      "Air suspension",
      "Alarm system",
      "Alloy wheels",
      "Ambient lighting",
      "Arm rest",
      "Autom. dimming interior mirror",
      "Blind spot assist",
      "Bluetooth",
      "Cargo barrier",
    ],
    photos: (() => {
      const urls = getImageUrlsFromFeatures(listing.features);
      return urls.length > 0 ? urls : ["https://placehold.co/1200x800?text=No+Photo"];
    })(),
  };
  const similarCars = similarListings.map((item) => {
    const photos = getImageUrlsFromFeatures(item.features);
    return {
      id: item.id,
      title: item.title,
      photos: photos.length > 0 ? photos : ["https://placehold.co/1200x800?text=No+Photo"],
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
              <p className="mt-3 text-sm text-slate-700">
                <span className="font-medium">Phone:</span> {car.sellerPhone}
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
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
