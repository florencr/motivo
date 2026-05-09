import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ListingsView, { type ListingsSearchParams } from "../components/listings-view";
import { buildListingsMetadata } from "../components/listings-page-meta";
import {
  VEHICLE_TYPE_PAGES,
  getVehicleTypePageConfig,
} from "@/lib/vehicle-type-pages";
import { getDealerByPublicSlug } from "@/lib/dealer-public-page";
import { prisma } from "@/lib/prisma";

type SlugPageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<ListingsSearchParams>;
};

export async function generateStaticParams() {
  return Object.keys(VEHICLE_TYPE_PAGES).map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<ListingsSearchParams>;
}): Promise<Metadata> {
  const { slug } = await params;
  const vehicleConfig = getVehicleTypePageConfig(slug);
  if (vehicleConfig) {
    const sp = await searchParams;
    return buildListingsMetadata({
      basePath: `/${vehicleConfig.slug}`,
      searchParams: sp,
      base: {
        title: vehicleConfig.metaTitle,
        description: vehicleConfig.description,
        openGraph: {
          type: "website",
          title: vehicleConfig.metaTitle,
          description: vehicleConfig.description,
          url: `/${vehicleConfig.slug}`,
        },
      },
    });
  }

  const dealer = await getDealerByPublicSlug(slug);
  if (!dealer) return {};
  const label = (dealer.companyName?.trim() || dealer.name).trim();
  const description =
    dealer.companySlogan?.trim() ||
    dealer.profileDescription?.trim()?.slice(0, 160) ||
    `Shfleto mjetet dhe informacionin e ${label} në Motivo.`;
  return {
    title: `${label} — Faqe publike`,
    description,
    openGraph: {
      type: "website",
      title: `${label} | Motivo`,
      description,
      url: `/${dealer.companySlug}`,
    },
  };
}

export default async function SlugPage({ params, searchParams }: SlugPageProps) {
  const { slug } = await params;
  const vehicleConfig = getVehicleTypePageConfig(slug);

  if (vehicleConfig) {
    const sp = await searchParams;
    return (
      <ListingsView
        searchParams={sp}
        vehicleTypeSlug={vehicleConfig.slug}
        basePath={`/${vehicleConfig.slug}`}
        pageTitle={vehicleConfig.title}
      />
    );
  }

  const dealer = await getDealerByPublicSlug(slug);
  if (!dealer) {
    notFound();
  }

  const displayName = (dealer.companyName?.trim() || dealer.name).trim();
  const basePath = `/${dealer.companySlug}`;
  const listingCount = await prisma.listing.count({
    where: { sellerId: dealer.id, isPublished: true },
  });

  const preview = dealer.profileDescription?.trim() ?? "";

  return (
    <main className="space-y-8">
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="relative h-40 bg-gradient-to-r from-sky-600 via-indigo-600 to-violet-700 sm:h-48">
          <div className="absolute inset-0 opacity-25 bg-[linear-gradient(120deg,rgba(255,255,255,0.15)_1px,transparent_1px),linear-gradient(rgba(255,255,255,0.12)_1px,transparent_1px)] bg-[length:24px_24px]" />
          <div className="relative flex h-full flex-col justify-end px-6 pb-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-white/80">
              Mirë se vini
            </p>
            <h1 className="text-2xl font-bold text-white sm:text-3xl">
              {displayName}
            </h1>
          </div>
        </div>
        <div className="space-y-4 px-6 py-6">
          {preview ? (
            <p className="text-sm leading-relaxed text-slate-700 line-clamp-6 sm:line-clamp-none">
              {preview.length > 420 ? `${preview.slice(0, 420)}…` : preview}
            </p>
          ) : (
            <p className="text-sm text-slate-600">
              Shfletoni listimin tonë të makinave të publikuara në Motivo.
            </p>
          )}
          <div className="flex flex-wrap gap-3">
            <Link
              href={`${basePath}/cars`}
              className="inline-flex rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Shiko {listingCount}{" "}
              {listingCount === 1 ? "mjet" : "mjete"}
            </Link>
            <Link
              href={`${basePath}/about`}
              className="inline-flex rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 transition hover:border-slate-400"
            >
              Rreth nesh
            </Link>
            <Link
              href={`${basePath}/contact`}
              className="inline-flex rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 transition hover:border-slate-400"
            >
              Kontakt
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
