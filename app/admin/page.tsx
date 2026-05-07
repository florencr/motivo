export default function AdminPage() {
  return (
    <main className="space-y-6">
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-3xl font-bold text-slate-900">Admin Dashboard</h1>
        <p className="mt-2 text-sm text-slate-600">Manage catalog, imports, footer pages, and user profiles.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <a href="/admin/catalog" className="rounded-lg border border-slate-300 bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-900">Catalog Manager</p>
            <p className="mt-1 text-xs text-slate-600">Vehicle types, categories, makes and models.</p>
          </a>
          <a href="/admin/imports" className="rounded-lg border border-slate-300 bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-900">Imports</p>
            <p className="mt-1 text-xs text-slate-600">Configure scrapers and run vehicle imports.</p>
          </a>
          <a href="/admin/footer-pages" className="rounded-lg border border-slate-300 bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-900">Footer Pages</p>
            <p className="mt-1 text-xs text-slate-600">Create and publish info pages.</p>
          </a>
          <a href="/admin/users" className="rounded-lg border border-slate-300 bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-900">User Profiles</p>
            <p className="mt-1 text-xs text-slate-600">Activate and suspend platform users.</p>
          </a>
        </div>
      </div>
    </main>
  );
}
