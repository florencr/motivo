import { prisma } from "@/lib/prisma";

async function getAdminDashboardCounts() {
  try {
    const [
      vehicles,
      publishedVehicles,
      vehicleTypes,
      categories,
      makes,
      models,
      importSources,
      activeImportSources,
      importRuns,
      successfulImportRuns,
      failedImportRuns,
      footerPages,
      publishedFooterPages,
      users,
      activeUsers,
      suspendedUsers,
      admins,
      dealers,
      privateSellers,
      buyers,
    ] = await Promise.all([
      prisma.listing.count(),
      prisma.listing.count({ where: { isPublished: true } }),
      prisma.vehicleType.count(),
      prisma.vehicleSegment.count(),
      prisma.make.count(),
      prisma.model.count(),
      prisma.importSource.count(),
      prisma.importSource.count({ where: { isActive: true } }),
      prisma.importRun.count(),
      prisma.importRun.count({ where: { status: "SUCCESS" } }),
      prisma.importRun.count({ where: { status: "FAILED" } }),
      prisma.footerPage.count(),
      prisma.footerPage.count({ where: { isPublished: true } }),
      prisma.user.count(),
      prisma.user.count({ where: { isActive: true } }),
      prisma.user.count({ where: { isActive: false } }),
      prisma.user.count({ where: { role: "ADMIN" } }),
      prisma.user.count({ where: { role: "DEALER" } }),
      prisma.user.count({ where: { role: "PRIVATE_SELLER" } }),
      prisma.user.count({ where: { role: "BUYER" } }),
    ]);

    return {
      catalog: { vehicles, publishedVehicles, vehicleTypes, categories, makes, models },
      imports: {
        sources: importSources,
        activeSources: activeImportSources,
        runs: importRuns,
        successfulRuns: successfulImportRuns,
        failedRuns: failedImportRuns,
      },
      footerPages: {
        total: footerPages,
        published: publishedFooterPages,
        drafts: footerPages - publishedFooterPages,
      },
      users: {
        total: users,
        active: activeUsers,
        suspended: suspendedUsers,
        admins,
        dealers,
        privateSellers,
        buyers,
      },
    };
  } catch {
    return {
      catalog: { vehicles: 0, publishedVehicles: 0, vehicleTypes: 0, categories: 0, makes: 0, models: 0 },
      imports: { sources: 0, activeSources: 0, runs: 0, successfulRuns: 0, failedRuns: 0 },
      footerPages: { total: 0, published: 0, drafts: 0 },
      users: { total: 0, active: 0, suspended: 0, admins: 0, dealers: 0, privateSellers: 0, buyers: 0 },
    };
  }
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <p className="rounded-md bg-white px-2 py-1">
      <span className="block text-base font-bold text-slate-900">{value.toLocaleString()}</span>
      <span className="text-[11px] text-slate-500">{label}</span>
    </p>
  );
}

export default async function AdminPage() {
  const counts = await getAdminDashboardCounts();

  return (
    <main className="space-y-6">
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-3xl font-bold text-slate-900">Paneli i administrimit</h1>
        <p className="mt-2 text-sm text-slate-600">Menaxho katalogun, importet, faqet e fundit dhe profilet e përdoruesve.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <a href="/admin/catalog" className="rounded-lg border border-slate-300 bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-900">Menaxhuesi i katalogut</p>
            <p className="mt-1 text-xs text-slate-600">Llojet e mjeteve, kategoritë, markat dhe modelet.</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Stat value={counts.catalog.vehicles} label="mjete" />
              <Stat value={counts.catalog.publishedVehicles} label="të publikuara" />
              <Stat value={counts.catalog.vehicleTypes} label="lloje mjetesh" />
              <Stat value={counts.catalog.categories} label="kategori" />
              <Stat value={counts.catalog.makes} label="marka" />
              <Stat value={counts.catalog.models} label="modele" />
            </div>
          </a>
          <a href="/admin/imports" className="rounded-lg border border-slate-300 bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-900">Importet</p>
            <p className="mt-1 text-xs text-slate-600">Konfiguro scraperat dhe ekzekuto importet e mjeteve.</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Stat value={counts.imports.sources} label="scrapera" />
              <Stat value={counts.imports.activeSources} label="aktivë" />
              <Stat value={counts.imports.runs} label="ekzekutime" />
              <Stat value={counts.imports.successfulRuns} label="të suksesshme" />
              <Stat value={counts.imports.failedRuns} label="të dështuara" />
            </div>
          </a>
          <a href="/admin/footer-pages" className="rounded-lg border border-slate-300 bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-900">Faqet e fundit</p>
            <p className="mt-1 text-xs text-slate-600">Krijo dhe publiko faqe informacioni.</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Stat value={counts.footerPages.total} label="faqe" />
              <Stat value={counts.footerPages.published} label="të publikuara" />
              <Stat value={counts.footerPages.drafts} label="draft" />
            </div>
          </a>
          <a href="/admin/users" className="rounded-lg border border-slate-300 bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-900">Profilet e përdoruesve</p>
            <p className="mt-1 text-xs text-slate-600">Aktivizo ose pezullo përdoruesit e platformës.</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Stat value={counts.users.total} label="përdorues" />
              <Stat value={counts.users.active} label="aktivë" />
              <Stat value={counts.users.suspended} label="të pezulluar" />
              <Stat value={counts.users.admins} label="administratorë" />
              <Stat value={counts.users.dealers} label="koncesionarë" />
              <Stat value={counts.users.privateSellers} label="shitës privatë" />
              <Stat value={counts.users.buyers} label="blerës" />
            </div>
          </a>
        </div>
      </div>
    </main>
  );
}
