import PopularMakes from "./components/popular-makes";
import { getCatalogData } from "@/lib/catalog";

type HomePageProps = {
  searchParams: Promise<{
    vehicleType?: string;
  }>;
};

export default async function Home({ searchParams }: HomePageProps) {
  const params = await searchParams;
  const selectedVehicleType = params.vehicleType ?? "cars";
  const { makes, models } = await getCatalogData();

  const categories = [
    { name: "Sedan", type: "sedan" },
    { name: "SUV", type: "suv" },
    { name: "Sport", type: "sport" },
    { name: "Van", type: "van" },
    { name: "Electric", type: "electric" },
    { name: "Pickup", type: "pickup" },
  ];
  const vehicleTabs = ["cars", "vans", "trucks", "bikes", "boats"];

  function CategoryIcon({ type }: { type: string }) {
    if (type === "electric") {
      return (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M13 2 6 13h5l-1 9 7-11h-5l1-9Z" />
        </svg>
      );
    }

    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M3 14.5h1.8l1.4-4.1c.4-1.1 1.4-1.9 2.6-1.9h6.4c1.2 0 2.2.8 2.6 1.9l1.4 4.1H21" />
        <path d="M2 14.5h20v2.5a1 1 0 0 1-1 1h-1.5a2.5 2.5 0 0 1-5 0h-5a2.5 2.5 0 0 1-5 0H3a1 1 0 0 1-1-1Z" />
        <circle cx="7" cy="18" r="1.3" />
        <circle cx="17" cy="18" r="1.3" />
      </svg>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <header
        className="relative bg-cover bg-center"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1489008777659-ad1fc8e07097?auto=format&fit=crop&w=1800&q=80')",
        }}
      >
        <div className="absolute inset-0 bg-black/65" />

        <div className="relative mx-auto w-full max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="mt-8 text-center">
            <h1 className="text-4xl font-bold text-white sm:text-5xl">
              Sell Faster, Buy Smarter
            </h1>
            <p className="mt-4 text-base text-slate-200 sm:text-lg">
              Search to buy, list to sell across Albania — make, model, registration, mileage, and price.
            </p>
          </div>

          <form
            action="/cars"
            method="GET"
            className="mt-8 w-full rounded-2xl bg-white/95 p-4 shadow-2xl backdrop-blur sm:p-6"
          >
            <div className="mb-4 flex flex-wrap gap-2 border-b border-slate-200 pb-4">
              {vehicleTabs.map((tab) => {
                const isActive = selectedVehicleType === tab;
                return (
                  <a
                    key={tab}
                    href={`/?vehicleType=${encodeURIComponent(tab)}`}
                    className={`rounded-full px-3 py-1.5 text-sm font-medium capitalize transition ${
                      isActive
                        ? "bg-slate-900 text-white"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    {tab}
                  </a>
                );
              })}
            </div>
            <input type="hidden" name="vehicleType" value={selectedVehicleType} />
            <div className="grid gap-3 md:grid-cols-6">
              <select
                name="make"
                className="h-11 rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-slate-500"
              >
                <option value="">Make</option>
                {makes.map((make) => (
                  <option key={make.id} value={make.name}>
                    {make.name}
                  </option>
                ))}
              </select>
              <select
                name="model"
                className="h-11 rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-slate-500"
              >
                <option value="">Model</option>
                {models.map((model) => (
                  <option key={model.id} value={model.name}>
                    {model.make.name} - {model.name}
                  </option>
                ))}
              </select>
              <input
                name="registrationFrom"
                type="number"
                min="1900"
                placeholder="Registration From"
                className="h-11 rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-slate-500"
              />
              <input
                name="mileageTo"
                type="number"
                min="0"
                placeholder="Mileage Up To (km)"
                className="h-11 rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-slate-500"
              />
              <input
                name="priceTo"
                type="number"
                min="0"
                placeholder="Max Price"
                className="h-11 rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-slate-500"
              />
              <button
                type="submit"
                className="h-11 rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-700"
              >
                Search Cars
              </button>
            </div>
          </form>
          <p className="mt-5 text-center text-xl font-semibold tracking-tight text-white sm:text-2xl">
            Browse 176&apos;190 vehicles from 1&apos;897 sellers and 258 dealers
          </p>
        </div>
      </header>
      <section className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          <h2 className="text-lg font-semibold text-slate-900">
            Browse by Category
          </h2>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {categories.map((category) => (
              <a
                key={category.type}
                href={`/cars?type=${encodeURIComponent(category.type)}`}
                className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
              >
                <span className="text-slate-700" aria-hidden="true">
                  <CategoryIcon type={category.type} />
                </span>
                <span>{category.name}</span>
              </a>
            ))}
          </div>
        </div>
      </section>
      <PopularMakes />
    </div>
  );
}
