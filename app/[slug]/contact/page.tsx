import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getVehicleTypePageConfig } from "@/lib/vehicle-type-pages";
import { getDealerByPublicSlug } from "@/lib/dealer-public-page";

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
    title: `Kontakt — ${label}`,
    description: `Si të kontaktoni ${label} përmes Motivo.`,
  };
}

export default async function DealerContactPage({ params }: PageProps) {
  const { slug } = await params;
  if (getVehicleTypePageConfig(slug)) {
    notFound();
  }

  const dealer = await getDealerByPublicSlug(slug);
  if (!dealer) {
    notFound();
  }

  const displayName = (dealer.companyName?.trim() || dealer.name).trim();

  return (
    <main className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <h1 className="text-2xl font-bold text-slate-900">Kontakt — {displayName}</h1>
      <dl className="mt-8 space-y-4 text-sm">
        <div>
          <dt className="font-semibold text-slate-800">Email</dt>
          <dd className="mt-1">
            <a
              href={`mailto:${dealer.email}`}
              className="text-sky-700 underline-offset-4 hover:underline"
            >
              {dealer.email}
            </a>
          </dd>
        </div>
        {dealer.phone?.trim() ? (
          <div>
            <dt className="font-semibold text-slate-800">Telefon</dt>
            <dd className="mt-1">
              <a
                href={`tel:${dealer.phone.replace(/\s+/g, "")}`}
                className="text-sky-700 underline-offset-4 hover:underline"
              >
                {dealer.phone.trim()}
              </a>
            </dd>
          </div>
        ) : null}
        {dealer.address?.trim() ? (
          <div>
            <dt className="font-semibold text-slate-800">Adresa</dt>
            <dd className="mt-1 text-slate-700">{dealer.address.trim()}</dd>
          </div>
        ) : null}
      </dl>
      {!dealer.phone?.trim() && !dealer.address?.trim() ? (
        <p className="mt-6 text-sm text-slate-600">
          Për çdo pyetje mund të përdorni emailin më sipër; të dhënat e tjera të kontaktit
          mund të përditësohen nga paneli i koncesionarit.
        </p>
      ) : null}
    </main>
  );
}
