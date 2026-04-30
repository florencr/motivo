import CarGallery from "../components/car-gallery";
import CardActions from "../components/card-actions";
import CarsSortSelect from "../components/cars-sort-select";
import CarsFiltersPanel from "../components/cars-filters-panel";
import { getCatalogData } from "@/lib/catalog";
import { prisma } from "@/lib/prisma";
import { getImageUrlsFromFeatures, getSelectedTagsFromFeatures } from "@/lib/listing-images";
import { evaluateListingPrice } from "@/lib/price-evaluator";
import { getActiveListingTagOptions, getCityOptionsFromListings } from "@/lib/site-data";
import { CalendarDays, Droplets, Fuel, Gauge, Settings2, Zap } from "lucide-react";

type CarsPageProps = {
  searchParams: Promise<{
    vehicleType?: string;
    segment?: string;
    make?: string;
    model?: string;
    registrationFrom?: string;
    registrationTo?: string;
    mileageFrom?: string;
    mileageTo?: string;
    priceFrom?: string;
    priceTo?: string;
    category?: string;
    type?: string;
    tag?: string;
    city?: string;
    fuel?: string;
    sort?: string;
    page?: string;
    perPage?: string;
  }>;
};

type CarListItem = {
  id: string;
  title: string;
  make: string;
  model: string;
  city: string;
  type: string;
  segmentSlug: string;
  year: number;
  price: number;
  mileageKm: number;
  transmission: string;
  fuelType: string;
  engine: string;
  powerHp: number;
  sellerUsername: string;
  isTaxRefundable: boolean;
  priceValue: number;
  sellerDescription: string;
  vendorTags: string[];
  photos: string[];
};

function normalize(value?: string) {
  return value?.trim().toLowerCase() ?? "";
}

function getPriceValueLabel(priceValue: number) {
  if (priceValue >= 4) return "Good Price";
  if (priceValue === 3) return "Fair Price";
  return "High Price";
}

function SpecIcon({ kind }: { kind: "fuel" | "registration" | "transmission" | "engine" | "power" | "mileage" }) {
  const iconClass = "h-4 w-4";
  const strokeWidth = 1.8;

  if (kind === "registration") {
    return <CalendarDays className={iconClass} strokeWidth={strokeWidth} />;
  }
  if (kind === "transmission") {
    return <Settings2 className={iconClass} strokeWidth={strokeWidth} />;
  }
  if (kind === "engine") {
    return <Fuel className={iconClass} strokeWidth={strokeWidth} />;
  }
  if (kind === "power") {
    return <Zap className={iconClass} strokeWidth={strokeWidth} />;
  }
  if (kind === "mileage") {
    return <Gauge className={iconClass} strokeWidth={strokeWidth} />;
  }

  return <Droplets className={iconClass} strokeWidth={strokeWidth} />;
}

export default async function CarsPage({ searchParams }: CarsPageProps) {
  const params = await searchParams;
  const make = normalize(params.make);
  const model = normalize(params.model);
  const category = normalize(params.category);
  const type = normalize(params.type); // legacy hidden `type` param
  const registrationFrom = Number(params.registrationFrom || 0);
  const registrationTo = Number(params.registrationTo || 0);
  const mileageFrom = Number(params.mileageFrom || 0);
  const mileageTo = Number(params.mileageTo || 0);
  const priceFrom = Number(params.priceFrom || 0);
  const priceTo = Number(params.priceTo || 0);
  const selectedTag = normalize(params.tag);
  const selectedCity = normalize(params.city);
  const selectedFuel = normalize(params.fuel);
  const sort = params.sort ?? "newest";
  const currentPage = Math.max(1, Number(params.page ?? "1") || 1);
  const requestedPerPage = Number(params.perPage ?? "6") || 6;
  const perPage = [6, 12, 24].includes(requestedPerPage) ? requestedPerPage : 6;

  const vehicleTypeSlug = normalize(params.vehicleType) || "cars";
  const segmentSlug = normalize(params.segment) || normalize(params.type);

  const { makes, models } = await getCatalogData({ vehicleTypeSlug });
  const [cityOptions, tagOptions] = await Promise.all([
    getCityOptionsFromListings(),
    getActiveListingTagOptions(),
  ]);

  let listingsLoadError: string | null = null;
  let mockCars: CarListItem[];
  try {
    const listings = await prisma.listing.findMany({
      where: { isPublished: true },
      orderBy: { createdAt: "desc" },
      include: {
        seller: {
          select: {
            name: true,
            companyName: true,
          },
        },
        make: {
          include: {
            vehicleType: true,
            segment: true,
          },
        },
      },
    });
    const withNumericPrice = listings.map((item) => ({ ...item, priceNum: Number(item.price) }));
    mockCars = listings.map((item) => {
    const photos = getImageUrlsFromFeatures(item.features);
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

    const priceEval = evaluateListingPrice(
      {
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
      },
      withNumericPrice.map((x) => ({
        id: x.id,
        price: x.priceNum,
        year: x.year,
        mileageKm: x.mileageKm,
        powerHp: x.powerHp,
        ownerCount: x.ownerCount,
        hasAccidentHistory: x.hasAccidentHistory,
        damageSeverity: x.damageSeverity,
        hasServiceHistory: x.hasServiceHistory,
        modelId: x.modelId,
        makeId: x.makeId,
        features: x.features,
      })),
    );

    return {
      id: item.id,
      title: item.title,
      make: item.makeName,
      model: item.modelName,
      city: item.city ?? "Unknown",
      type: item.make.vehicleType.slug,
      segmentSlug: item.make.segment?.slug ?? "",
      year: item.year,
      price: Number(item.price),
      mileageKm: item.mileageKm,
      transmission: transmissionMap[item.transmission] ?? "Manual",
      fuelType: fuelMap[item.fuelType] ?? "Petrol",
      engine: item.engineCapacity ? `${item.engineCapacity} cc` : "-",
      powerHp: item.powerHp ?? 0,
      sellerUsername: item.seller.companyName || item.seller.name || "seller",
      isTaxRefundable: item.isTaxRefundable,
      priceValue: priceEval.priceValue,
      sellerDescription: item.description,
      vendorTags: getSelectedTagsFromFeatures(item.features),
      photos: photos.length > 0 ? photos : ["/images/no-photo.svg"],
    };
    });
  } catch (err) {
    listingsLoadError =
      err instanceof Error ? err.message : "Could not load listings from the database.";
    console.error("[cars] listing.findMany failed:", err);
    mockCars = [];
  }

  const filteredCars = mockCars.filter((car) => {
    const byMake = make ? car.make.toLowerCase().includes(make) : true;
    const byModel = model ? car.model.toLowerCase().includes(model) : true;
    const byCategory = category ? car.type.toLowerCase().includes(category) : true;
    const byVehicleType = car.type === vehicleTypeSlug;
    const bySegment = segmentSlug ? car.segmentSlug === segmentSlug : true;
    const byRegistration = registrationFrom > 0 ? car.year >= registrationFrom : true;
    const byRegistrationTo = registrationTo > 0 ? car.year <= registrationTo : true;
    const byMileageFrom = mileageFrom > 0 ? car.mileageKm >= mileageFrom : true;
    const byMileageTo = mileageTo > 0 ? car.mileageKm <= mileageTo : true;
    const byPriceFrom = priceFrom > 0 ? car.price >= priceFrom : true;
    const byPriceTo = priceTo > 0 ? car.price <= priceTo : true;
    const byCity = selectedCity ? car.city.toLowerCase() === selectedCity : true;
    const byFuel = selectedFuel ? car.fuelType.toLowerCase() === selectedFuel : true;
    const byTag = selectedTag
      ? car.vendorTags.some((tag) => tag.toLowerCase() === selectedTag)
      : true;
    return (
      byMake &&
      byModel &&
      byCategory &&
      byVehicleType &&
      bySegment &&
      byRegistration &&
      byRegistrationTo &&
      byMileageFrom &&
      byMileageTo &&
      byPriceFrom &&
      byPriceTo &&
      byCity &&
      byFuel &&
      byTag
    );
  });

  const sortedCars = [...filteredCars].sort((a, b) => {
    if (sort === "price_asc") return a.price - b.price;
    if (sort === "price_desc") return b.price - a.price;
    if (sort === "year_asc") return a.year - b.year;
    if (sort === "mileage_asc") return a.mileageKm - b.mileageKm;
    if (sort === "mileage_desc") return b.mileageKm - a.mileageKm;
    return b.year - a.year; // newest
  });

  const totalPages = Math.max(1, Math.ceil(sortedCars.length / perPage));
  const safePage = Math.min(currentPage, totalPages);
  const start = (safePage - 1) * perPage;
  const paginatedCars = sortedCars.slice(start, start + perPage);

  function buildCarsQuery(overrides: Record<string, string | null>) {
    const qp = new URLSearchParams();
    const setIf = (key: string, value?: string) => {
      if (value && value.trim() !== "") qp.set(key, value);
    };
    setIf("vehicleType", params.vehicleType ?? vehicleTypeSlug);
    setIf("segment", params.segment ?? params.type);
    setIf("make", params.make);
    setIf("model", params.model);
    setIf("registrationFrom", params.registrationFrom);
    setIf("registrationTo", params.registrationTo);
    setIf("mileageFrom", params.mileageFrom);
    setIf("mileageTo", params.mileageTo);
    setIf("priceFrom", params.priceFrom);
    setIf("priceTo", params.priceTo);
    setIf("city", params.city);
    setIf("fuel", params.fuel);
    setIf("tag", params.tag);
    setIf("sort", params.sort);
    setIf("perPage", params.perPage ?? String(perPage));
    setIf("page", params.page ?? String(safePage));

    for (const [key, value] of Object.entries(overrides)) {
      if (value == null || value === "") qp.delete(key);
      else qp.set(key, value);
    }
    return qp.toString();
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="lg:grid lg:grid-cols-4 lg:gap-6">
          <aside className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm lg:col-span-1">
            <CarsFiltersPanel
              vehicleType={params.vehicleType ?? vehicleTypeSlug}
              segment={params.segment}
              legacyType={params.type}
              initialMake={params.make}
              initialModel={params.model}
              initialPriceFrom={params.priceFrom}
              initialPriceTo={params.priceTo}
              initialRegistrationFrom={params.registrationFrom}
              initialRegistrationTo={params.registrationTo}
              initialMileageFrom={params.mileageFrom}
              initialMileageTo={params.mileageTo}
              initialCity={params.city}
              initialFuel={params.fuel}
              initialTag={params.tag}
              initialPerPage={params.perPage}
              cityOptions={cityOptions}
              tagOptions={tagOptions}
              makes={makes}
              models={models}
            />
          </aside>

          <section className="mt-6 lg:col-span-3 lg:mt-0">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h1 className="text-3xl font-bold text-slate-900">Car Results</h1>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-600">Per page</span>
                  <div className="flex items-center gap-1">
                    {[6, 12, 24].map((size) => (
                      <a
                        key={size}
                        href={`/cars?${buildCarsQuery({ perPage: String(size), page: "1" })}`}
                        className={`rounded border px-2 py-1 text-xs ${
                          perPage === size
                            ? "border-slate-900 bg-slate-900 text-white"
                            : "border-slate-300 text-slate-700"
                        }`}
                      >
                        {size}
                      </a>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <label htmlFor="sort" className="text-sm text-slate-600">
                    Sort by
                  </label>
                  <CarsSortSelect value={sort} />
                </div>
              </div>
            </div>
            <p className="mt-2 text-sm text-slate-600">
              {filteredCars.length} result(s) found
            </p>
            {listingsLoadError ? (
              <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                Listings could not be loaded: {listingsLoadError}
              </p>
            ) : null}

            <div className="mt-6 grid gap-4">
              {filteredCars.length === 0 ? (
                <div className="rounded-xl border border-slate-200 bg-white p-5 text-slate-700">
                  No cars found. Try changing your search filters.
                </div>
              ) : (
                paginatedCars.map((car) => (
                  <article
                    key={car.id}
                    className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm lg:flex"
                  >
                    <div className="lg:w-[360px] lg:shrink-0">
                      <CarGallery
                        photos={car.photos}
                        title={car.title}
                        containerClassName="h-56 rounded-none lg:h-72 lg:rounded-l-xl"
                        frameClassName="rounded-none"
                        imageClassName="h-56 lg:h-72"
                      />
                    </div>
                    <div className="p-5 lg:flex lg:flex-1 lg:flex-col">
                      <h2 className="text-xl font-semibold text-slate-900">
                        <a
                          href={`/cars/${car.id}`}
                          className="transition hover:text-slate-700 hover:underline"
                        >
                          {car.title}
                        </a>
                      </h2>
                      <p className="mt-1 text-sm text-slate-600">
                        {car.sellerDescription}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-700">
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1">
                          <SpecIcon kind="fuel" /> {car.fuelType}
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1">
                          <SpecIcon kind="registration" /> {car.year}
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1">
                          <SpecIcon kind="transmission" /> {car.transmission}
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1">
                          <SpecIcon kind="engine" /> {car.engine}
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1">
                          <SpecIcon kind="power" /> {car.powerHp} hp
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1">
                          <SpecIcon kind="mileage" /> {car.mileageKm.toLocaleString()} km
                        </span>
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <p className="text-2xl font-bold text-slate-900">
                          EUR {car.price.toLocaleString()}
                        </p>
                        {car.isTaxRefundable && (
                          <span className="text-xs font-medium text-slate-600">
                            (tax refundable)
                          </span>
                        )}
                        <span className="inline-flex flex-col rounded-full border border-slate-300 bg-white px-2 py-1">
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
                          <span className="mt-1 text-center text-[10px] font-medium text-slate-600">
                            {getPriceValueLabel(car.priceValue)}
                          </span>
                        </span>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {car.vendorTags.map((tag) => {
                          const isActive = selectedTag === tag.toLowerCase();
                          const tagParams = new URLSearchParams();
                          if (params.make) tagParams.set("make", params.make);
                          if (params.model) tagParams.set("model", params.model);
                          if (params.registrationFrom) {
                            tagParams.set("registrationFrom", params.registrationFrom);
                          }
                          if (params.registrationTo) {
                            tagParams.set("registrationTo", params.registrationTo);
                          }
                          if (params.mileageFrom) tagParams.set("mileageFrom", params.mileageFrom);
                          if (params.mileageTo) tagParams.set("mileageTo", params.mileageTo);
                          if (params.priceFrom) tagParams.set("priceFrom", params.priceFrom);
                          if (params.priceTo) tagParams.set("priceTo", params.priceTo);
                          if (params.category) tagParams.set("category", params.category);
                          if (params.type) tagParams.set("type", params.type);
                          if (!isActive) tagParams.set("tag", tag);

                          return (
                            <a
                              key={tag}
                              href={`/cars?${tagParams.toString()}`}
                              className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium transition ${
                                isActive
                                  ? "border-slate-900 bg-slate-900 text-white"
                                  : "border-slate-300 bg-white text-slate-700 hover:border-slate-500"
                              }`}
                            >
                              {tag}
                            </a>
                          );
                        })}
                      </div>
                      <div className="mt-6 flex items-end justify-between gap-4 lg:mt-auto">
                        <CardActions carTitle={car.title} viewHref={`/cars/${car.id}`} />
                        <p className="text-right text-sm text-slate-600">
                          @{car.sellerUsername}
                        </p>
                      </div>
                    </div>
                  </article>
                ))
              )}
            </div>
            {totalPages > 1 ? (
              <div className="mt-6 flex items-center justify-between">
                <a
                  href={safePage > 1 ? `/cars?${buildCarsQuery({ page: String(safePage - 1) })}` : "#"}
                  className={`rounded border px-3 py-1 text-sm ${
                    safePage > 1 ? "border-slate-300 text-slate-700" : "border-slate-200 text-slate-400"
                  }`}
                >
                  Previous
                </a>
                <p className="text-sm text-slate-600">
                  Page {safePage} of {totalPages}
                </p>
                <a
                  href={safePage < totalPages ? `/cars?${buildCarsQuery({ page: String(safePage + 1) })}` : "#"}
                  className={`rounded border px-3 py-1 text-sm ${
                    safePage < totalPages ? "border-slate-300 text-slate-700" : "border-slate-200 text-slate-400"
                  }`}
                >
                  Next
                </a>
              </div>
            ) : null}
          </section>
        </div>
      </div>
    </main>
  );
}
