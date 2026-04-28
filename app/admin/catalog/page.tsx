"use client";

import { useEffect, useState } from "react";

type Category = { id: string; name: string };
type Make = { id: string; name: string; categoryId?: string | null };
type Model = { id: string; name: string; make: { name: string } };

export default function AdminCatalogPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [makes, setMakes] = useState<Make[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [categoryName, setCategoryName] = useState("");
  const [makeName, setMakeName] = useState("");
  const [modelName, setModelName] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [selectedMakeId, setSelectedMakeId] = useState("");
  const [error, setError] = useState("");

  async function loadCatalog() {
    const res = await fetch("/api/admin/catalog");
    const data = await res.json();
    setCategories(data.categories ?? []);
    setMakes(data.makes ?? []);
    setModels(data.models ?? []);
  }

  useEffect(() => {
    loadCatalog();
  }, []);

  async function createItem(payload: Record<string, string>) {
    setError("");
    const res = await fetch("/api/admin/catalog", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data?.error ?? "Failed");
      return false;
    }
    await loadCatalog();
    return true;
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <h1 className="text-3xl font-bold text-slate-900">Admin Catalog</h1>
        <p className="text-sm text-slate-600">Add vehicle categories, makes, and models.</p>
        {error && <p className="text-sm text-red-600">{error}</p>}

        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Add Category</h2>
          <div className="mt-3 flex gap-2">
            <input
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              placeholder="Category name (Cars, Vans...)"
              className="h-10 flex-1 rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-slate-500"
            />
            <button
              type="button"
              onClick={async () => {
                if (!categoryName.trim()) return;
                const ok = await createItem({ type: "category", name: categoryName });
                if (ok) setCategoryName("");
              }}
              className="h-10 rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white"
            >
              Add
            </button>
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Add Make</h2>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            <select
              value={selectedCategoryId}
              onChange={(e) => setSelectedCategoryId(e.target.value)}
              className="h-10 rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-slate-500"
            >
              <option value="">No category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <input
              value={makeName}
              onChange={(e) => setMakeName(e.target.value)}
              placeholder="Make name"
              className="h-10 rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-slate-500"
            />
            <button
              type="button"
              onClick={async () => {
                if (!makeName.trim()) return;
                const ok = await createItem({
                  type: "make",
                  name: makeName,
                  categoryId: selectedCategoryId,
                });
                if (ok) setMakeName("");
              }}
              className="h-10 rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white"
            >
              Add
            </button>
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Add Model</h2>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            <select
              value={selectedMakeId}
              onChange={(e) => setSelectedMakeId(e.target.value)}
              className="h-10 rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-slate-500"
            >
              <option value="">Select make</option>
              {makes.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
            <input
              value={modelName}
              onChange={(e) => setModelName(e.target.value)}
              placeholder="Model name"
              className="h-10 rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-slate-500"
            />
            <button
              type="button"
              onClick={async () => {
                if (!modelName.trim() || !selectedMakeId) return;
                const ok = await createItem({
                  type: "model",
                  name: modelName,
                  makeId: selectedMakeId,
                });
                if (ok) setModelName("");
              }}
              className="h-10 rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white"
            >
              Add
            </button>
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Current Data</h2>
          <p className="mt-3 text-sm text-slate-700">Categories: {categories.length}</p>
          <p className="text-sm text-slate-700">Makes: {makes.length}</p>
          <p className="text-sm text-slate-700">Models: {models.length}</p>
          <div className="mt-3 text-sm text-slate-600">
            {models.slice(0, 10).map((m) => (
              <p key={m.id}>
                {m.make.name} - {m.name}
              </p>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
