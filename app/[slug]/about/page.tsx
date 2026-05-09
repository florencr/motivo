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
    title: `Rreth nesh — ${label}`,
    description: `Informacion rreth ${label} në Motivo.`,
  };
}

export default async function DealerAboutPage({ params }: PageProps) {
  const { slug } = await params;
  if (getVehicleTypePageConfig(slug)) {
    notFound();
  }

  const dealer = await getDealerByPublicSlug(slug);
  if (!dealer) {
    notFound();
  }

  const displayName = (dealer.companyName?.trim() || dealer.name).trim();
  const body = dealer.profileDescription?.trim();

  return (
    <main className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <h1 className="text-2xl font-bold text-slate-900">Rreth {displayName}</h1>
      {body ? (
        <div className="mt-6 max-w-none whitespace-pre-wrap text-sm leading-relaxed text-slate-800">
          {body}
        </div>
      ) : (
        <p className="mt-6 text-sm text-slate-600">
          Ky koncesionar nuk ka përshkrim publik të përditësuar ende.
        </p>
      )}
    </main>
  );
}
