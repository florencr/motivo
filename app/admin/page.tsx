export default function AdminPage() {
  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-3xl font-bold text-slate-900">Admin Dashboard</h1>
        <p className="mt-2 text-sm text-slate-600">
          Manage catalog, footer pages, and user profiles.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <a
            href="/admin/catalog"
            className="inline-flex rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
          >
            Catalog Manager
          </a>
          <a
            href="/admin/footer-pages"
            className="inline-flex rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800"
          >
            Footer Pages
          </a>
          <a
            href="/admin/users"
            className="inline-flex rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800"
          >
            User Profiles
          </a>
        </div>
      </div>
    </main>
  );
}
