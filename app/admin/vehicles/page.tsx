import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getListingReference } from "@/lib/listing-reference";

type AdminVehiclesPageProps = {
  searchParams: Promise<{
    page?: string;
    pageSize?: string;
  }>;
};

const PAGE_SIZE_OPTIONS = [50, 100, 200] as const;

function formatDate(value: Date | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en-GB", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(value);
}

function parsePositiveInt(value: string | undefined, fallback: number) {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function parsePageSize(value: string | undefined) {
  const parsed = parsePositiveInt(value, 50);
  return PAGE_SIZE_OPTIONS.includes(parsed as (typeof PAGE_SIZE_OPTIONS)[number])
    ? parsed
    : 50;
}

function vehiclesHref(page: number, pageSize: number) {
  return `/admin/vehicles?page=${page}&pageSize=${pageSize}`;
}

export default async function AdminVehiclesPage({ searchParams }: AdminVehiclesPageProps) {
  const params = await searchParams;
  const pageSize = parsePageSize(params.pageSize);
  const requestedPage = parsePositiveInt(params.page, 1);
  const totalVehicles = await prisma.listing.count();
  const totalPages = Math.max(1, Math.ceil(totalVehicles / pageSize));
  const page = Math.min(requestedPage, totalPages);
  const startNumber = totalVehicles === 0 ? 0 : (page - 1) * pageSize + 1;
  const endNumber = Math.min(page * pageSize, totalVehicles);

  const vehicles = await prisma.listing.findMany({
    orderBy: { createdAt: "desc" },
    skip: (page - 1) * pageSize,
    take: pageSize,
    select: {
      id: true,
      makeName: true,
      modelName: true,
      isPublished: true,
      createdAt: true,
      seller: {
        select: {
          name: true,
          companyName: true,
          email: true,
        },
      },
      make: {
        select: {
          vehicleType: {
            select: {
              name: true,
            },
          },
          segment: {
            select: {
              name: true,
            },
          },
        },
      },
    },
  });

  return (
    <main className="space-y-6">
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Mjetet</h1>
            <p className="mt-2 text-sm text-slate-600">
              Pamje në tabelë e listimeve të mjeteve me të dhënat kryesore të katalogut dhe të shitësit.
            </p>
          </div>
          <p className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700">
            Po shfaqen {startNumber.toLocaleString()}-{endNumber.toLocaleString()} nga{" "}
            {totalVehicles.toLocaleString()} mjete
          </p>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="font-semibold text-slate-700">Rreshta për faqe:</span>
            {PAGE_SIZE_OPTIONS.map((option) => (
              <Link
                key={option}
                href={vehiclesHref(1, option)}
                className={`rounded-lg px-3 py-1.5 font-semibold ${
                  pageSize === option
                    ? "bg-slate-900 text-white"
                    : "bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-100"
                }`}
              >
                {option}
              </Link>
            ))}
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Link
              href={vehiclesHref(Math.max(1, page - 1), pageSize)}
              className={`rounded-lg px-3 py-1.5 font-semibold ring-1 ring-slate-200 ${
                page <= 1
                  ? "pointer-events-none bg-slate-100 text-slate-400"
                  : "bg-white text-slate-700 hover:bg-slate-100"
              }`}
            >
              Mbrapa
            </Link>
            <span className="rounded-lg bg-white px-3 py-1.5 font-semibold text-slate-700 ring-1 ring-slate-200">
              Faqja {page} / {totalPages}
            </span>
            <Link
              href={vehiclesHref(Math.min(totalPages, page + 1), pageSize)}
              className={`rounded-lg px-3 py-1.5 font-semibold ring-1 ring-slate-200 ${
                page >= totalPages
                  ? "pointer-events-none bg-slate-100 text-slate-400"
                  : "bg-white text-slate-700 hover:bg-slate-100"
              }`}
            >
              Para
            </Link>
          </div>
        </div>

        <div className="mt-5 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="whitespace-nowrap py-3 pr-4">ID</th>
                <th className="whitespace-nowrap py-3 pr-4">Marka</th>
                <th className="whitespace-nowrap py-3 pr-4">Modeli</th>
                <th className="whitespace-nowrap py-3 pr-4">Kategoria</th>
                <th className="whitespace-nowrap py-3 pr-4">Lloji</th>
                <th className="whitespace-nowrap py-3 pr-4">Koncesionari</th>
                <th className="whitespace-nowrap py-3 pr-4">Data e publikimit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {vehicles.map((vehicle) => {
                const dealer =
                  vehicle.seller.companyName ||
                  vehicle.seller.name ||
                  vehicle.seller.email;
                return (
                  <tr key={vehicle.id} className="align-top">
                    <td className="whitespace-nowrap py-3 pr-4">
                      <span className="inline-flex rounded-full bg-emerald-50 px-3 py-1 font-mono text-xs font-bold tracking-wide text-emerald-700 ring-1 ring-emerald-200">
                        {getListingReference(vehicle.id)}
                      </span>
                    </td>
                    <td className="whitespace-nowrap py-3 pr-4 font-medium text-slate-900">
                      {vehicle.makeName}
                    </td>
                    <td className="whitespace-nowrap py-3 pr-4 text-slate-700">
                      {vehicle.modelName}
                    </td>
                    <td className="whitespace-nowrap py-3 pr-4 text-slate-700">
                      {vehicle.make.segment?.name ?? "-"}
                    </td>
                    <td className="whitespace-nowrap py-3 pr-4 text-slate-700">
                      {vehicle.make.vehicleType.name}
                    </td>
                    <td className="whitespace-nowrap py-3 pr-4 text-slate-700">
                      {dealer}
                    </td>
                    <td className="whitespace-nowrap py-3 pr-4 text-slate-700">
                      {vehicle.isPublished ? formatDate(vehicle.createdAt) : "Draft"}
                    </td>
                  </tr>
                );
              })}
              {vehicles.length === 0 ? (
                <tr>
                  <td className="py-5 text-sm text-slate-500" colSpan={7}>
                    Ende nuk ka mjete.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
