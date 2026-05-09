import CarGallery from "./car-gallery";
import CardActions from "./card-actions";
import CarsSortSelect from "./cars-sort-select";
import CarsFiltersPanel from "./cars-filters-panel";
import ExpandableText from "./expandable-text";
import { getCatalogData } from "@/lib/catalog";
import { prisma } from "@/lib/prisma";
import { getImageUrlsFromFeatures, getSelectedTagsFromFeatures } from "@/lib/listing-images";
import { evaluateListingPrice } from "@/lib/price-evaluator";
import { getActiveListingTagOptions, getCityOptionsFromListings } from "@/lib/site-data";
import { CalendarDays, Cylinder, Fuel, Gauge, Settings2, Zap } from "lucide-react";

export type ListingsSearchParams = {
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
  regStatus?: string;
  taxRefund?: string;
};

type RegistrationStatus = "albanian_plates" | "customs_paid" | "taxes_due";

const REGISTRATION_STATUS_LABELS: Record<RegistrationStatus, string> = {
  albanian_plates: "Targa shqiptare",
  customs_paid: "Doganë e paguar (pa targa)",
  taxes_due: "Tatim doganor pa paguar",
};

const REGISTRATION_STATUS_BADGE: Record<RegistrationStatus, string> = {
  albanian_plates:
    "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
  customs_paid: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
  taxes_due: "bg-rose-50 text-rose-700 ring-1 ring-rose-200",
};

function deriveRegistrationStatus(
  hasAlbanianPlates: boolean | null,
  isCustomsPaid: boolean | null,
): RegistrationStatus | null {
  if (hasAlbanianPlates == null && isCustomsPaid == null) return null;
  if (hasAlbanianPlates) return "albanian_plates";
  if (isCustomsPaid) return "customs_paid";
  return "taxes_due";
}

type CarListItem = {
  id: string;
  slug: string;
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
  hasAlbanianPlates: boolean | null;
  isCustomsPaid: boolean | null;
  registrationStatus: RegistrationStatus | null;
  priceValue: number;
  sellerDescription: string;
  vendorTags: string[];
  photos: string[];
};

function normalize(value?: string) {
  return value?.trim().toLowerCase() ?? "";
}

function normalizeMulti(value?: string) {
  return String(value ?? "")
    .split(",")
    .map((item) => normalize(item))
    .filter(Boolean);
}

function getPriceValueLabel(priceValue: number) {
  if (priceValue >= 4) return "Çmim i mirë";
  if (priceValue === 3) return "Çmim i drejtë";
  return "Çmim i lartë";
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
    return <Cylinder className={iconClass} strokeWidth={strokeWidth} />;
  }
  if (kind === "power") {
    return <Zap className={iconClass} strokeWidth={strokeWidth} />;
  }
  if (kind === "mileage") {
    return <Gauge className={iconClass} strokeWidth={strokeWidth} />;
  }

  return <Fuel className={iconClass} strokeWidth={strokeWidth} />;
}

export type ListingsViewProps = {
  searchParams: ListingsSearchParams;
  vehicleTypeSlug: string;
  basePath: string;
  pageTitle: string;
};

export default async function ListingsView({
  searchParams,
  vehicleTypeSlug,
  basePath,
  pageTitle,
}: ListingsViewProps) {
  const params = searchParams;
  const selectedMakes = normalizeMulti(params.make);
  const selectedModels = normalizeMulti(params.model);
  const category = normalize(params.category);
  const registrationFrom = Number(params.registrationFrom || 0);
  const registrationTo = Number(params.registrationTo || 0);
  const mileageFrom = Number(params.mileageFrom || 0);
  const mileageTo = Number(params.mileageTo || 0);
  const priceFrom = Number(params.priceFrom || 0);
  const priceTo = Number(params.priceTo || 0);
  const selectedTag = normalize(params.tag);
  const selectedCity = normalize(params.city);
  const selectedFuel = normalize(params.fuel);
  const selectedRegStatus = normalize(params.regStatus);
  const selectedTaxRefund = normalize(params.taxRefund);
  const sort = params.sort ?? "newest";
  const currentPage = Math.max(1, Number(params.page ?? "1") || 1);
  const requestedPerPage = Number(params.perPage ?? "6") || 6;
  const perPage = [6, 12, 24].includes(requestedPerPage) ? requestedPerPage : 6;

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
        PETROL: "Benzinë",
        DIESEL: "Naftë",
        ELECTRIC: "Elektrik",
        HYBRID: "Hibrid",
      };
      const transmissionMap: Record<string, string> = {
        MANUAL: "Manual",
        AUTOMATIC: "Automatik",
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
        slug: item.slug,
        title: item.title,
        make: item.makeName,
        model: item.modelName,
        city: item.city ?? "Pa specifikuar",
        type: item.make.vehicleType.slug,
        segmentSlug: item.make.segment?.slug ?? "",
        year: item.year,
        price: Number(item.price),
        mileageKm: item.mileageKm,
        transmission: transmissionMap[item.transmission] ?? "Manual",
        fuelType: fuelMap[item.fuelType] ?? "Benzinë",
        engine: item.engineCapacity ? `${item.engineCapacity} cc` : "-",
        powerHp: item.powerHp ?? 0,
        sellerUsername: item.seller.companyName || item.seller.name || "shitës",
        isTaxRefundable: item.isTaxRefundable,
        hasAlbanianPlates: item.hasAlbanianPlates,
        isCustomsPaid: item.isCustomsPaid,
        registrationStatus: deriveRegistrationStatus(
          item.hasAlbanianPlates,
          item.isCustomsPaid,
        ),
        priceValue: priceEval.priceValue,
        sellerDescription: item.description,
        vendorTags: getSelectedTagsFromFeatures(item.features),
        photos: photos.length > 0 ? photos : ["/images/no-photo.svg"],
      };
    });
  } catch (err) {
    listingsLoadError =
      err instanceof Error ? err.message : "Listimet nuk u ngarkuan nga baza e të dhënave.";
    console.error("[listings] listing.findMany failed:", err);
    mockCars = [];
  }

  const filteredCars = mockCars.filter((car) => {
    const carMake = car.make.toLowerCase();
    const carModel = car.model.toLowerCase();
    const byMake =
      selectedMakes.length > 0
        ? selectedMakes.some((make) => carMake.includes(make))
        : true;
    const byModel =
      selectedModels.length > 0
        ? selectedModels.some((model) => carModel.includes(model))
        : true;
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
    const byRegStatus = selectedRegStatus
      ? car.registrationStatus === selectedRegStatus
      : true;
    const byTaxRefund =
      selectedTaxRefund === "yes"
        ? car.isTaxRefundable
        : selectedTaxRefund === "no"
          ? !car.isTaxRefundable
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
      byTag &&
      byRegStatus &&
      byTaxRefund
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

  const SITE_URL = "https://motivo.autos";
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Kreu", item: `${SITE_URL}/` },
      {
        "@type": "ListItem",
        position: 2,
        name: pageTitle,
        item: `${SITE_URL}${basePath}`,
      },
    ],
  };
  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: pageTitle,
    itemListElement: paginatedCars.map((car, i) => ({
      "@type": "ListItem",
      position: start + i + 1,
      url: `${SITE_URL}/makina/${car.slug || car.id}`,
      name: car.title,
    })),
  };

  function buildCarsQuery(overrides: Record<string, string | null>) {
    const qp = new URLSearchParams();
    const setIf = (key: string, value?: string) => {
      if (value && value.trim() !== "") qp.set(key, value);
    };
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
    setIf("regStatus", params.regStatus);
    setIf("taxRefund", params.taxRefund);
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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
      />
      <div className="mx-auto max-w-7xl">
        <div className="lg:grid lg:grid-cols-4 lg:gap-6">
          <aside className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm lg:col-span-1">
            <CarsFiltersPanel
              vehicleType={vehicleTypeSlug}
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
              initialRegStatus={params.regStatus}
              initialTaxRefund={params.taxRefund}
              initialPerPage={params.perPage}
              cityOptions={cityOptions}
              tagOptions={tagOptions}
              makes={makes}
              models={models}
              basePath={basePath}
            />
          </aside>

          <section className="mt-6 lg:col-span-3 lg:mt-0">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h1 className="text-3xl font-bold text-slate-900">{pageTitle}</h1>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-600">Për faqe</span>
                  <div className="flex items-center gap-1">
                    {[6, 12, 24].map((size) => (
                      <a
                        key={size}
                        href={`${basePath}?${buildCarsQuery({ perPage: String(size), page: "1" })}`}
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
                    Rendit sipas
                  </label>
                  <CarsSortSelect value={sort} />
                </div>
              </div>
            </div>
            <p className="mt-2 text-sm text-slate-600">
              {filteredCars.length} rezultat(e) u gjetën
            </p>
            {listingsLoadError ? (
              <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                Listimet nuk u ngarkuan: {listingsLoadError}
              </p>
            ) : null}

            <div className="mt-6 grid gap-4">
              {filteredCars.length === 0 ? (
                <div className="rounded-xl border border-slate-200 bg-white p-5 text-slate-700">
                  Nuk u gjet asnjë rezultat. Provo të ndryshosh filtrat e kërkimit.
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
                          href={`/makina/${car.slug || car.id}`}
                          className="transition hover:text-slate-700 hover:underline"
                        >
                          {car.title}
                        </a>
                      </h2>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {car.registrationStatus ? (
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                              REGISTRATION_STATUS_BADGE[car.registrationStatus]
                            }`}
                          >
                            {REGISTRATION_STATUS_LABELS[car.registrationStatus]}
                          </span>
                        ) : null}
                        {car.isTaxRefundable ? (
                          <span className="inline-flex items-center rounded-full bg-sky-50 px-2.5 py-0.5 text-xs font-semibold text-sky-700 ring-1 ring-sky-200">
                            Tatim i rimbursueshëm
                          </span>
                        ) : null}
                      </div>
                      <ExpandableText text={car.sellerDescription} collapsedLines={2} />
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
                        {car.engine && car.engine !== "-" ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1">
                            <SpecIcon kind="engine" /> {car.engine}
                          </span>
                        ) : null}
                        {car.powerHp > 0 ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1">
                            <SpecIcon kind="power" /> {car.powerHp} hp
                          </span>
                        ) : null}
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
                            (tatim i rimbursueshëm)
                          </span>
                        )}
                        <span className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-2 py-1">
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
                          <span className="text-[11px] font-medium text-slate-600">
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
                              href={`${basePath}?${tagParams.toString()}`}
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
                        <CardActions carTitle={car.title} viewHref={`/makina/${car.slug || car.id}`} />
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
                  href={safePage > 1 ? `${basePath}?${buildCarsQuery({ page: String(safePage - 1) })}` : "#"}
                  className={`rounded border px-3 py-1 text-sm ${
                    safePage > 1 ? "border-slate-300 text-slate-700" : "border-slate-200 text-slate-400"
                  }`}
                >
                  Mbrapa
                </a>
                <p className="text-sm text-slate-600">
                  Faqja {safePage} nga {totalPages}
                </p>
                <a
                  href={safePage < totalPages ? `${basePath}?${buildCarsQuery({ page: String(safePage + 1) })}` : "#"}
                  className={`rounded border px-3 py-1 text-sm ${
                    safePage < totalPages ? "border-slate-300 text-slate-700" : "border-slate-200 text-slate-400"
                  }`}
                >
                  Para
                </a>
              </div>
            ) : null}
          </section>
        </div>
      </div>
    </main>
  );
}
