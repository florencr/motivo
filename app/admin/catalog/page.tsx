"use client";

import { useEffect, useState } from "react";

type VehicleType = { id: string; name: string; slug: string; sortOrder: number };
type VehicleSegment = { id: string; name: string; slug: string; sortOrder: number; vehicleTypeId: string };
type Make = {
  id: string;
  name: string;
  slug: string;
  vehicleTypeId: string;
  segmentId: string | null;
  vehicleType?: { name: string };
  segment?: { name: string } | null;
};
type Model = { id: string; name: string; makeId: string; make: { name: string } };

export default function AdminCatalogPage() {
  const [vehicleTypes, setVehicleTypes] = useState<VehicleType[]>([]);
  const [vehicleSegments, setVehicleSegments] = useState<VehicleSegment[]>([]);
  const [makes, setMakes] = useState<Make[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [error, setError] = useState("");

  const [typeName, setTypeName] = useState("");
  const [typeSort, setTypeSort] = useState("0");

  const [segmentName, setSegmentName] = useState("");
  const [segmentTypeId, setSegmentTypeId] = useState("");
  const [segmentSort, setSegmentSort] = useState("0");

  const [makeName, setMakeName] = useState("");
  const [makeTypeId, setMakeTypeId] = useState("");
  const [makeSegmentId, setMakeSegmentId] = useState("");

  const [modelName, setModelName] = useState("");
  const [modelMakeId, setModelMakeId] = useState("");

  async function loadCatalog() {
    const res = await fetch("/api/admin/catalog");
    const data = await res.json();
    setVehicleTypes(data.vehicleTypes ?? []);
    setVehicleSegments(data.vehicleSegments ?? []);
    setMakes(data.makes ?? []);
    setModels(data.models ?? []);
    if (!segmentTypeId && (data.vehicleTypes?.length ?? 0) > 0) {
      setSegmentTypeId(data.vehicleTypes[0].id);
    }
    if (!makeTypeId && (data.vehicleTypes?.length ?? 0) > 0) {
      setMakeTypeId(data.vehicleTypes[0].id);
    }
  }

  useEffect(() => {
    loadCatalog();
  }, []);

  async function postJson(payload: Record<string, unknown>) {
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

  async function patchJson(payload: Record<string, unknown>) {
    setError("");
    const res = await fetch("/api/admin/catalog", {
      method: "PATCH",
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

  async function deleteEntity(entity: string, id: string) {
    if (!confirm("Delete this item?")) return;
    setError("");
    const res = await fetch(`/api/admin/catalog?entity=${encodeURIComponent(entity)}&id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data?.error ?? "Failed");
      return;
    }
    await loadCatalog();
  }

  const segmentsForSelectedType = vehicleSegments.filter((s) => s.vehicleTypeId === makeTypeId);

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <h1 className="text-3xl font-bold text-slate-900">Admin Catalog</h1>
        <p className="text-sm text-slate-600">
          Top level: vehicle types (Cars, Vans, …). Second level: segments per type (Sedan, SUV, …). Then makes and
          models. Edit inline and save, or delete.
        </p>
        {error && <p className="text-sm text-red-600">{error}</p>}

        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Vehicle types</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            <input
              value={typeName}
              onChange={(e) => setTypeName(e.target.value)}
              placeholder="Name (e.g. Cars)"
              className="h-10 min-w-[160px] flex-1 rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-slate-500"
            />
            <input
              value={typeSort}
              onChange={(e) => setTypeSort(e.target.value)}
              type="number"
              placeholder="Sort"
              className="h-10 w-24 rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-slate-500"
            />
            <button
              type="button"
              onClick={async () => {
                if (!typeName.trim()) return;
                const ok = await postJson({
                  type: "vehicleType",
                  name: typeName,
                  sortOrder: Number(typeSort) || 0,
                });
                if (ok) {
                  setTypeName("");
                  setTypeSort("0");
                }
              }}
              className="h-10 rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white"
            >
              Add type
            </button>
          </div>
          <ul className="mt-4 divide-y divide-slate-100 text-sm">
            {vehicleTypes.map((t) => (
              <li key={t.id} className="flex flex-wrap items-center gap-2 py-2">
                <input
                  defaultValue={t.name}
                  id={`vt-name-${t.id}`}
                  className="h-9 flex-1 min-w-[120px] rounded border border-slate-200 px-2"
                />
                <input
                  defaultValue={t.sortOrder}
                  type="number"
                  id={`vt-sort-${t.id}`}
                  className="h-9 w-20 rounded border border-slate-200 px-2"
                />
                <button
                  type="button"
                  className="h-9 rounded-lg bg-slate-800 px-3 text-xs font-semibold text-white"
                  onClick={() => {
                    const nameEl = document.getElementById(`vt-name-${t.id}`) as HTMLInputElement | null;
                    const sortEl = document.getElementById(`vt-sort-${t.id}`) as HTMLInputElement | null;
                    void patchJson({
                      entity: "vehicleType",
                      id: t.id,
                      name: nameEl?.value ?? t.name,
                      sortOrder: Number(sortEl?.value ?? t.sortOrder),
                    });
                  }}
                >
                  Save
                </button>
                <button
                  type="button"
                  className="h-9 rounded-lg border border-red-200 px-3 text-xs font-semibold text-red-700"
                  onClick={() => deleteEntity("vehicleType", t.id)}
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Segments (body / subcategory)</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            <select
              value={segmentTypeId}
              onChange={(e) => setSegmentTypeId(e.target.value)}
              className="h-10 rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-slate-500"
            >
              {vehicleTypes.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
            <input
              value={segmentName}
              onChange={(e) => setSegmentName(e.target.value)}
              placeholder="Segment name (e.g. SUV)"
              className="h-10 min-w-[160px] flex-1 rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-slate-500"
            />
            <input
              value={segmentSort}
              onChange={(e) => setSegmentSort(e.target.value)}
              type="number"
              className="h-10 w-20 rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-slate-500"
            />
            <button
              type="button"
              onClick={async () => {
                if (!segmentName.trim() || !segmentTypeId) return;
                const ok = await postJson({
                  type: "segment",
                  name: segmentName,
                  vehicleTypeId: segmentTypeId,
                  sortOrder: Number(segmentSort) || 0,
                });
                if (ok) {
                  setSegmentName("");
                  setSegmentSort("0");
                }
              }}
              className="h-10 rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white"
            >
              Add segment
            </button>
          </div>
          <ul className="mt-4 divide-y divide-slate-100 text-sm">
            {vehicleSegments.map((s) => {
              const typeNameLabel = vehicleTypes.find((t) => t.id === s.vehicleTypeId)?.name ?? s.vehicleTypeId;
              return (
                <li key={s.id} className="flex flex-wrap items-center gap-2 py-2">
                  <span className="w-28 shrink-0 text-xs text-slate-500">{typeNameLabel}</span>
                  <input
                    defaultValue={s.name}
                    id={`seg-name-${s.id}`}
                    className="h-9 flex-1 min-w-[100px] rounded border border-slate-200 px-2"
                  />
                  <select
                    defaultValue={s.vehicleTypeId}
                    id={`seg-type-${s.id}`}
                    className="h-9 rounded border border-slate-200 px-2 text-xs"
                  >
                    {vehicleTypes.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                  <input
                    defaultValue={s.sortOrder}
                    type="number"
                    id={`seg-sort-${s.id}`}
                    className="h-9 w-20 rounded border border-slate-200 px-2"
                  />
                  <button
                    type="button"
                    className="h-9 rounded-lg bg-slate-800 px-3 text-xs font-semibold text-white"
                    onClick={() => {
                      const nameEl = document.getElementById(`seg-name-${s.id}`) as HTMLInputElement | null;
                      const typeEl = document.getElementById(`seg-type-${s.id}`) as HTMLSelectElement | null;
                      const sortEl = document.getElementById(`seg-sort-${s.id}`) as HTMLInputElement | null;
                      void patchJson({
                        entity: "segment",
                        id: s.id,
                        name: nameEl?.value ?? s.name,
                        vehicleTypeId: typeEl?.value ?? s.vehicleTypeId,
                        sortOrder: Number(sortEl?.value ?? s.sortOrder),
                      });
                    }}
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    className="h-9 rounded-lg border border-red-200 px-3 text-xs font-semibold text-red-700"
                    onClick={() => deleteEntity("segment", s.id)}
                  >
                    Delete
                  </button>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Makes</h2>
          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
            <select
              value={makeTypeId}
              onChange={(e) => {
                setMakeTypeId(e.target.value);
                setMakeSegmentId("");
              }}
              className="h-10 rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-slate-500"
            >
              {vehicleTypes.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
            <select
              value={makeSegmentId}
              onChange={(e) => setMakeSegmentId(e.target.value)}
              className="h-10 rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-slate-500"
            >
              <option value="">No segment</option>
              {segmentsForSelectedType.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            <input
              value={makeName}
              onChange={(e) => setMakeName(e.target.value)}
              placeholder="Make name"
              className="h-10 rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-slate-500 lg:col-span-2"
            />
            <button
              type="button"
              onClick={async () => {
                if (!makeName.trim() || !makeTypeId) return;
                const ok = await postJson({
                  type: "make",
                  name: makeName,
                  vehicleTypeId: makeTypeId,
                  segmentId: makeSegmentId || undefined,
                });
                if (ok) setMakeName("");
              }}
              className="h-10 rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white"
            >
              Add make
            </button>
          </div>
          <ul className="mt-4 divide-y divide-slate-100 text-sm">
            {makes.map((m) => (
              <li key={m.id} className="flex flex-wrap items-center gap-2 py-2">
                <input
                  defaultValue={m.name}
                  id={`mk-name-${m.id}`}
                  className="h-9 flex-1 min-w-[100px] rounded border border-slate-200 px-2"
                />
                <select defaultValue={m.vehicleTypeId} id={`mk-type-${m.id}`} className="h-9 rounded border border-slate-200 px-2 text-xs">
                  {vehicleTypes.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
                <select defaultValue={m.segmentId ?? ""} id={`mk-seg-${m.id}`} className="h-9 max-w-[140px] rounded border border-slate-200 px-2 text-xs">
                  <option value="">No segment</option>
                  {vehicleSegments
                    .filter((s) => s.vehicleTypeId === m.vehicleTypeId)
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                </select>
                <button
                  type="button"
                  className="h-9 rounded-lg bg-slate-800 px-3 text-xs font-semibold text-white"
                  onClick={() => {
                    const nameEl = document.getElementById(`mk-name-${m.id}`) as HTMLInputElement | null;
                    const typeEl = document.getElementById(`mk-type-${m.id}`) as HTMLSelectElement | null;
                    const segEl = document.getElementById(`mk-seg-${m.id}`) as HTMLSelectElement | null;
                    void patchJson({
                      entity: "make",
                      id: m.id,
                      name: nameEl?.value ?? m.name,
                      vehicleTypeId: typeEl?.value ?? m.vehicleTypeId,
                      segmentId: segEl?.value || null,
                    });
                  }}
                >
                  Save
                </button>
                <button
                  type="button"
                  className="h-9 rounded-lg border border-red-200 px-3 text-xs font-semibold text-red-700"
                  onClick={() => deleteEntity("make", m.id)}
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Models</h2>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            <select
              value={modelMakeId}
              onChange={(e) => setModelMakeId(e.target.value)}
              className="h-10 rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-slate-500"
            >
              <option value="">Select make</option>
              {makes.map((mk) => (
                <option key={mk.id} value={mk.id}>
                  {mk.vehicleType?.name ? `${mk.vehicleType.name} · ` : ""}
                  {mk.name}
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
                if (!modelName.trim() || !modelMakeId) return;
                const ok = await postJson({
                  type: "model",
                  name: modelName,
                  makeId: modelMakeId,
                });
                if (ok) setModelName("");
              }}
              className="h-10 rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white"
            >
              Add model
            </button>
          </div>
          <ul className="mt-4 divide-y divide-slate-100 text-sm">
            {models.map((mod) => (
              <li key={mod.id} className="flex flex-wrap items-center gap-2 py-2">
                <input
                  defaultValue={mod.name}
                  id={`md-name-${mod.id}`}
                  className="h-9 flex-1 min-w-[100px] rounded border border-slate-200 px-2"
                />
                <select defaultValue={mod.makeId} id={`md-make-${mod.id}`} className="h-9 rounded border border-slate-200 px-2 text-xs">
                  {makes.map((mk) => (
                    <option key={mk.id} value={mk.id}>
                      {mk.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="h-9 rounded-lg bg-slate-800 px-3 text-xs font-semibold text-white"
                  onClick={() => {
                    const nameEl = document.getElementById(`md-name-${mod.id}`) as HTMLInputElement | null;
                    const makeEl = document.getElementById(`md-make-${mod.id}`) as HTMLSelectElement | null;
                    void patchJson({
                      entity: "model",
                      id: mod.id,
                      name: nameEl?.value ?? mod.name,
                      makeId: makeEl?.value ?? mod.makeId,
                    });
                  }}
                >
                  Save
                </button>
                <button
                  type="button"
                  className="h-9 rounded-lg border border-red-200 px-3 text-xs font-semibold text-red-700"
                  onClick={() => deleteEntity("model", mod.id)}
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Summary</h2>
          <p className="mt-2 text-sm text-slate-700">
            Types: {vehicleTypes.length} · Segments: {vehicleSegments.length} · Makes: {makes.length} · Models:{" "}
            {models.length}
          </p>
        </section>
      </div>
    </main>
  );
}
