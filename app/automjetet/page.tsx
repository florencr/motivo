import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getVehicleTypes } from "@/lib/catalog";
import { VehicleTypeIcon } from "../components/vehicle-type-icon";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Automjetet — Të gjitha llojet | Motivo",
  description:
    "Shfleto të gjitha llojet e automjeteve në shitje në Shqipëri: makina, motoçikleta, furgona, varka dhe kamionë.",
  alternates: { canonical: "/automjetet" },
};

async function getListingCountsByVehicleType(): Promise<Record<string, number>> {
  try {
    const grouped = await prisma.listing.groupBy({
      by: ["makeId"],
      where: { isPublished: true },
      _count: { _all: true },
    });
    const makeIds = grouped.map((g) => g.makeId);
    if (makeIds.length === 0) return {};
    const makes = await prisma.make.findMany({
      where: { id: { in: makeIds } },
      select: { id: true, vehicleTypeId: true },
    });
    const makeIdToTypeId: Record<string, string> = {};
    for (const m of makes) makeIdToTypeId[m.id] = m.vehicleTypeId;
    const counts: Record<string, number> = {};
    for (const g of grouped) {
      const typeId = makeIdToTypeId[g.makeId];
      if (!typeId) continue;
      counts[typeId] = (counts[typeId] ?? 0) + g._count._all;
    }
    return counts;
  } catch {
    return {};
  }
}

export default async function AutomjetetPage() {
  const vehicleTypes = await getVehicleTypes();
  const countsByTypeId = await getListingCountsByVehicleType();

  return (
    <main className="min-h-screen bg-slate-100">
      <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <h1 className="text-3xl font-bold text-slate-900">Automjetet</h1>
          <p className="mt-2 text-sm text-slate-600">
            Zgjidh një lloj automjeti për të parë listimet.
          </p>

          {vehicleTypes.length === 0 ? (
            <p className="mt-6 text-sm text-slate-600">
              Nuk ka ende lloje mjetesh të konfiguruara.
            </p>
          ) : (
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {vehicleTypes.map((type) => {
                const count = countsByTypeId[type.id] ?? 0;
                return (
                  <Link
                    key={type.id}
                    href={`/${encodeURIComponent(type.slug)}`}
                    className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-5 transition hover:border-slate-400 hover:bg-slate-50"
                  >
                    <span className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
                      <VehicleTypeIcon
                        icon={type.icon}
                        typeSlug={type.slug}
                        className="h-6 w-6"
                      />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-base font-semibold text-slate-900">
                        {type.name}
                      </span>
                      <span className="mt-0.5 block text-xs text-slate-600">
                        {count.toLocaleString()} listim(e) të publikuara
                      </span>
                    </span>
                    <span aria-hidden="true" className="text-slate-400">
                      →
                    </span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
