import CarGallery from "../components/car-gallery";
import CardActions from "../components/card-actions";
import CarsSortSelect from "../components/cars-sort-select";
import { getCatalogData } from "@/lib/catalog";
import { prisma } from "@/lib/prisma";
import { getImageUrlsFromFeatures } from "@/lib/listing-images";

type CarsPageProps = {
  searchParams: Promise<{
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
  }>;
};

type CarListItem = {
  id: string;
  title: string;
  make: string;
  model: string;
  city: string;
  type: string;
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
  if (kind === "registration") {
    return (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="3.5" y="5" width="17" height="15" rx="2" />
        <path d="M3.5 9.5h17M8 3.5v3M16 3.5v3" />
      </svg>
    );
  }
  if (kind === "transmission") {
    return (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="12" cy="6" r="2.2" />
        <circle cx="7" cy="12" r="2.2" />
        <circle cx="17" cy="12" r="2.2" />
        <circle cx="12" cy="18" r="2.2" />
        <path d="M12 8.2V15.8M9.2 12H14.8" />
      </svg>
    );
  }
  if (kind === "engine") {
    return (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M3 10h5l2-2h5l1.5 2H21v6h-4l-1 2h-6l-2-2H3z" />
      </svg>
    );
  }
  if (kind === "power") {
    return (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="12" cy="12" r="8" />
        <path d="M12 12 16.5 9.5M12 6v2M18 12h-2M12 18v-2M6 12h2" />
      </svg>
    );
  }
  if (kind === "mileage") {
    return (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="12" cy="13" r="6.5" />
        <path d="M12 13 15.5 10.5M6.5 13H4M19.5 13H22" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M6.5 9h8l2.5 3.5-2.5 3.5h-8L4 12.5 6.5 9Z" />
    </svg>
  );
}

export default async function CarsPage({ searchParams }: CarsPageProps) {
  const params = await searchParams;
  const make = normalize(params.make);
  const model = normalize(params.model);
  const category = normalize(params.category);
  const type = normalize(params.type);
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

  const cityOptions = ["Berlin", "Munich", "Hamburg"];
  const fuelOptions = ["Petrol", "Diesel", "Electric", "Hybrid"];
  const tagOptions = ["No Accident", "1 Owner", "Warranty", "Inspected"];
  const { makes, models } = await getCatalogData();

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
      },
    });
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

    return {
      id: item.id,
      title: item.title,
      make: item.makeName,
      model: item.modelName,
      city: item.city ?? "Unknown",
      type: "cars",
      year: item.year,
      price: Number(item.price),
      mileageKm: item.mileageKm,
      transmission: transmissionMap[item.transmission] ?? "Manual",
      fuelType: fuelMap[item.fuelType] ?? "Petrol",
      engine: item.engineCapacity ? `${item.engineCapacity} cc` : "-",
      powerHp: item.powerHp ?? 0,
      sellerUsername: item.seller.companyName || item.seller.name || "seller",
      isTaxRefundable: item.isTaxRefundable,
      priceValue: 3,
      sellerDescription: item.description,
      vendorTags: [],
      photos: photos.length > 0 ? photos : ["https://placehold.co/1200x800?text=No+Photo"],
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
    const byType = type ? car.type.toLowerCase() === type : true;
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
      byType &&
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

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="lg:grid lg:grid-cols-4 lg:gap-6">
          <aside className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm lg:col-span-1">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-900">Filters</h2>
              <a href="/cars" className="text-xs text-slate-600">
                Clear Filters
              </a>
            </div>
            <form action="/cars" method="GET" className="mt-4 space-y-3">
              <select
                name="make"
                defaultValue={params.make}
                className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-slate-500"
              >
                <option value="">Make</option>
                {makes.map((item) => (
                  <option key={item.id} value={item.name}>
                    {item.name}
                  </option>
                ))}
              </select>
              <select
                name="model"
                defaultValue={params.model}
                className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-slate-500"
              >
                <option value="">Model</option>
                {models.map((item) => (
                  <option key={item.id} value={item.name}>
                    {item.make.name} - {item.name}
                  </option>
                ))}
              </select>
              <div className="space-y-2">
                <p className="text-xs font-medium text-slate-600">Price</p>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    name="priceFrom"
                    defaultValue={params.priceFrom}
                    type="number"
                    min="0"
                    placeholder="From"
                    className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-slate-500"
                  />
                  <input
                    name="priceTo"
                    defaultValue={params.priceTo}
                    type="number"
                    min="0"
                    placeholder="To"
                    className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-slate-500"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-medium text-slate-600">Registration</p>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    name="registrationFrom"
                    defaultValue={params.registrationFrom}
                    type="number"
                    min="1900"
                    placeholder="From"
                    className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-slate-500"
                  />
                  <input
                    name="registrationTo"
                    defaultValue={params.registrationTo}
                    type="number"
                    min="1900"
                    placeholder="To"
                    className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-slate-500"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-medium text-slate-600">Mileage (km)</p>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    name="mileageFrom"
                    defaultValue={params.mileageFrom}
                    type="number"
                    min="0"
                    placeholder="From"
                    className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-slate-500"
                  />
                  <input
                    name="mileageTo"
                    defaultValue={params.mileageTo}
                    type="number"
                    min="0"
                    placeholder="To"
                    className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-slate-500"
                  />
                </div>
              </div>
              {params.type && <input type="hidden" name="type" value={params.type} />}
              {params.city && <input type="hidden" name="city" value={params.city} />}
              {params.fuel && <input type="hidden" name="fuel" value={params.fuel} />}
              <button
                type="submit"
                className="h-10 w-full rounded-lg bg-slate-900 text-sm font-semibold text-white transition hover:bg-slate-700"
              >
                Apply Filters
              </button>
            </form>
            <div className="mt-5 space-y-4 border-t border-slate-200 pt-4">
              <div>
                <p className="text-xs font-medium text-slate-600">Location</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {cityOptions.map((city) => {
                    const isActive = selectedCity === city.toLowerCase();
                    const chipParams = new URLSearchParams();
                    if (params.make) chipParams.set("make", params.make);
                    if (params.model) chipParams.set("model", params.model);
                    if (params.registrationFrom) chipParams.set("registrationFrom", params.registrationFrom);
                    if (params.registrationTo) chipParams.set("registrationTo", params.registrationTo);
                    if (params.mileageFrom) chipParams.set("mileageFrom", params.mileageFrom);
                    if (params.mileageTo) chipParams.set("mileageTo", params.mileageTo);
                    if (params.priceFrom) chipParams.set("priceFrom", params.priceFrom);
                    if (params.priceTo) chipParams.set("priceTo", params.priceTo);
                    if (params.category) chipParams.set("category", params.category);
                    if (params.type) chipParams.set("type", params.type);
                    if (params.tag) chipParams.set("tag", params.tag);
                    if (params.fuel) chipParams.set("fuel", params.fuel);
                    if (!isActive) chipParams.set("city", city);
                    return (
                      <a
                        key={city}
                        href={`/cars?${chipParams.toString()}`}
                        className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium transition ${
                          isActive
                            ? "border-slate-900 bg-slate-900 text-white"
                            : "border-slate-300 bg-white text-slate-700 hover:border-slate-500"
                        }`}
                      >
                        {city}
                      </a>
                    );
                  })}
                </div>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-600">Fuel</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {fuelOptions.map((fuel) => {
                    const isActive = selectedFuel === fuel.toLowerCase();
                    const chipParams = new URLSearchParams();
                    if (params.make) chipParams.set("make", params.make);
                    if (params.model) chipParams.set("model", params.model);
                    if (params.registrationFrom) chipParams.set("registrationFrom", params.registrationFrom);
                    if (params.registrationTo) chipParams.set("registrationTo", params.registrationTo);
                    if (params.mileageFrom) chipParams.set("mileageFrom", params.mileageFrom);
                    if (params.mileageTo) chipParams.set("mileageTo", params.mileageTo);
                    if (params.priceFrom) chipParams.set("priceFrom", params.priceFrom);
                    if (params.priceTo) chipParams.set("priceTo", params.priceTo);
                    if (params.category) chipParams.set("category", params.category);
                    if (params.type) chipParams.set("type", params.type);
                    if (params.tag) chipParams.set("tag", params.tag);
                    if (params.city) chipParams.set("city", params.city);
                    if (!isActive) chipParams.set("fuel", fuel);
                    return (
                      <a
                        key={fuel}
                        href={`/cars?${chipParams.toString()}`}
                        className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium transition ${
                          isActive
                            ? "border-slate-900 bg-slate-900 text-white"
                            : "border-slate-300 bg-white text-slate-700 hover:border-slate-500"
                        }`}
                      >
                        {fuel}
                      </a>
                    );
                  })}
                </div>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-600">Other Tags</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {tagOptions.map((tag) => {
                    const isActive = selectedTag === tag.toLowerCase();
                    const chipParams = new URLSearchParams();
                    if (params.make) chipParams.set("make", params.make);
                    if (params.model) chipParams.set("model", params.model);
                    if (params.registrationFrom) chipParams.set("registrationFrom", params.registrationFrom);
                    if (params.registrationTo) chipParams.set("registrationTo", params.registrationTo);
                    if (params.mileageFrom) chipParams.set("mileageFrom", params.mileageFrom);
                    if (params.mileageTo) chipParams.set("mileageTo", params.mileageTo);
                    if (params.priceFrom) chipParams.set("priceFrom", params.priceFrom);
                    if (params.priceTo) chipParams.set("priceTo", params.priceTo);
                    if (params.category) chipParams.set("category", params.category);
                    if (params.type) chipParams.set("type", params.type);
                    if (params.city) chipParams.set("city", params.city);
                    if (params.fuel) chipParams.set("fuel", params.fuel);
                    if (!isActive) chipParams.set("tag", tag);
                    return (
                      <a
                        key={tag}
                        href={`/cars?${chipParams.toString()}`}
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
              </div>
            </div>
          </aside>

          <section className="mt-6 lg:col-span-3 lg:mt-0">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h1 className="text-3xl font-bold text-slate-900">Car Results</h1>
              <div className="flex items-center gap-2">
                <label htmlFor="sort" className="text-sm text-slate-600">
                  Sort by
                </label>
                <CarsSortSelect value={sort} />
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
                sortedCars.map((car) => (
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
          </section>
        </div>
      </div>
    </main>
  );
}
