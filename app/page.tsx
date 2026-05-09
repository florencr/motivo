import type { Metadata } from "next";
import PopularMakes from "./components/popular-makes";
import {
  getCatalogData,
  getPopularMakesFromListings,
  getTopRatedSellers,
  getVehicleSegmentsForTypeSlug,
  getVehicleTypes,
} from "@/lib/catalog";
import { getHomeStats } from "@/lib/site-data";
import { VehicleTypeIcon } from "./components/vehicle-type-icon";
import { VehicleSegmentIcon } from "./components/vehicle-segment-icon";
import HomeSearchForm from "./components/home-search-form";
import TopRatedSellers from "./components/top-rated-sellers";

const SITE_URL = "https://motivo.autos";

export const metadata: Metadata = {
  title: "Makina, motoçikleta, furgona, varka & kamionë në shitje në Shqipëri",
  description:
    "Shfleto dhe liston mjete në shitje në Shqipëri në Motivo. Gjej makina, motoçikleta, furgona, varka dhe kamionë nga koncesionarë të besueshëm dhe shitës privatë.",
  alternates: { canonical: "/" },
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Motivo",
  url: SITE_URL,
  logo: `${SITE_URL}/icon.svg`,
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Motivo",
  url: SITE_URL,
  potentialAction: {
    "@type": "SearchAction",
    target: `${SITE_URL}/makina?make={search_term_string}`,
    "query-input": "required name=search_term_string",
  },
};

type HomePageProps = {
  searchParams: Promise<{
    vehicleType?: string;
    make?: string;
  }>;
};

export default async function Home({ searchParams }: HomePageProps) {
  const params = await searchParams;
  const vehicleTypes = await getVehicleTypes();
  const defaultSlug = vehicleTypes[0]?.slug ?? "makina";
  const selectedVehicleType = params.vehicleType ?? defaultSlug;
  const segments = await getVehicleSegmentsForTypeSlug(selectedVehicleType);
  const visibleSegments =
    selectedVehicleType === "makina"
      ? segments.filter((segment) => segment.slug !== "van")
      : segments;
  const { makes: makesForTab, models: modelsForTab } = await getCatalogData({
    vehicleTypeSlug: selectedVehicleType,
  });
  const popularMakes = await getPopularMakesFromListings(8);
  const topRatedSellers = await getTopRatedSellers(5);
  const homeStats = await getHomeStats();

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
      />
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
              Sell Faster. Buy Smarter.
            </h1>
            <h2 className="mt-4 mb-8 text-base font-semibold text-slate-200 sm:text-lg">
              Platformë moderne për blerje dhe shitje automjetesh në Shqipëri.
            </h2>
          </div>

          <div className="mb-4 flex flex-wrap gap-2">
            {vehicleTypes.map((tab) => {
                const isActive = selectedVehicleType === tab.slug;
                return (
                  <a
                    key={tab.id}
                    href={`/?vehicleType=${encodeURIComponent(tab.slug)}`}
                    className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium capitalize transition ${
                      isActive ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    <VehicleTypeIcon icon={tab.icon} typeSlug={tab.slug} className="h-4 w-4" />
                    {tab.name}
                  </a>
                );
              })}
            {vehicleTypes.length === 0 ? (
              <span className="rounded-full bg-slate-100 px-3 py-1.5 text-sm text-slate-700">
                Nuk ka ende lloje mjetesh të konfiguruara
              </span>
            ) : null}
          </div>
          <HomeSearchForm
            selectedVehicleType={selectedVehicleType}
            makes={makesForTab}
            models={modelsForTab}
            initialMake={params.make}
          />
          <h3 className="mt-5 text-center text-xl font-semibold tracking-tight text-white sm:text-2xl">
            Shfleto {homeStats.listings.toLocaleString()} mjete nga {homeStats.sellers.toLocaleString()} shitës dhe{" "}
            {homeStats.dealers.toLocaleString()} koncesionarë
          </h3>
        </div>
      </header>
      <section className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          <h3 className="text-lg font-semibold text-slate-900">
            Shfleto sipas kategorisë
          </h3>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {visibleSegments.length === 0 ? (
              <p className="col-span-full text-sm text-slate-600">
                Ende nuk ka segmente për këtë lloj mjeti. Shtoji në Admin → Menaxhuesi i katalogut (segmentet nën këtë lloj).
              </p>
            ) : (
              visibleSegments.map((segment) => (
                <a
                  key={segment.id}
                  href={`/${encodeURIComponent(selectedVehicleType)}?segment=${encodeURIComponent(segment.slug)}`}
                  className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
                >
                  <span className="text-slate-700" aria-hidden="true">
                    <VehicleSegmentIcon
                      icon={segment.icon}
                      iconUrl={segment.iconUrl}
                      segmentSlug={segment.slug}
                      vehicleTypeSlug={selectedVehicleType}
                      className="h-5 w-5"
                    />
                  </span>
                  <span>{segment.name}</span>
                </a>
              ))
            )}
          </div>
        </div>
      </section>
      <PopularMakes makes={popularMakes} />
      <TopRatedSellers sellers={topRatedSellers} />
    </main>
  );
}
