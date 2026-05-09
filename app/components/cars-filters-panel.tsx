"use client";

import { SlidersHorizontal } from "lucide-react";
import { useMemo, useState } from "react";
import SearchableMultiSelect from "./searchable-multi-select";

type MakeOption = { id: string; name: string };
type ModelOption = { id: string; name: string; make: { name: string } };

type CarsFiltersPanelProps = {
  vehicleType: string;
  segment?: string;
  legacyType?: string;
  initialMake?: string;
  initialModel?: string;
  initialPriceFrom?: string;
  initialPriceTo?: string;
  initialRegistrationFrom?: string;
  initialRegistrationTo?: string;
  initialMileageFrom?: string;
  initialMileageTo?: string;
  initialCity?: string;
  initialFuel?: string;
  initialTag?: string;
  initialRegStatus?: string;
  initialTaxRefund?: string;
  initialPerPage?: string;
  cityOptions: string[];
  tagOptions: string[];
  makes: MakeOption[];
  models: ModelOption[];
  basePath?: string;
};

function mergeCarSearchParams(
  base: Record<string, string | undefined>,
  updates: Record<string, string | undefined | null>,
) {
  const merged: Record<string, string | undefined> = { ...base };
  for (const [k, v] of Object.entries(updates)) {
    if (v === null || v === "") delete merged[k];
    else merged[k] = v;
  }
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(merged)) {
    if (v != null && String(v).trim() !== "") p.set(k, v);
  }
  return p.toString();
}

function splitSelectedValues(value?: string) {
  return String(value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export default function CarsFiltersPanel({
  vehicleType,
  segment,
  legacyType,
  initialMake = "",
  initialModel = "",
  initialPriceFrom = "",
  initialPriceTo = "",
  initialRegistrationFrom = "",
  initialRegistrationTo = "",
  initialMileageFrom = "",
  initialMileageTo = "",
  initialCity = "",
  initialFuel = "",
  initialTag = "",
  initialRegStatus = "",
  initialTaxRefund = "",
  initialPerPage = "",
  cityOptions,
  tagOptions,
  makes,
  models,
  basePath = "/makina",
}: CarsFiltersPanelProps) {
  const [make, setMake] = useState<string[]>(splitSelectedValues(initialMake));
  const [model, setModel] = useState<string[]>(splitSelectedValues(initialModel));
  const fuelOptions = ["Benzinë", "Naftë", "Elektrik", "Hibrid"];

  const filteredModels = useMemo(() => {
    if (make.length === 0) return [];
    const selectedMakes = new Set(make.map((item) => item.toLowerCase()));
    return models.filter((item) => selectedMakes.has(item.make.name.toLowerCase()));
  }, [make, models]);

  const searchBase: Record<string, string | undefined> = {
    vehicleType,
    segment: segment || legacyType,
    make: make.length > 0 ? make.join(",") : undefined,
    model: model.length > 0 ? model.join(",") : undefined,
    registrationFrom: initialRegistrationFrom || undefined,
    registrationTo: initialRegistrationTo || undefined,
    mileageFrom: initialMileageFrom || undefined,
    mileageTo: initialMileageTo || undefined,
    priceFrom: initialPriceFrom || undefined,
    priceTo: initialPriceTo || undefined,
    city: initialCity || undefined,
    fuel: initialFuel || undefined,
    tag: initialTag || undefined,
    regStatus: initialRegStatus || undefined,
    taxRefund: initialTaxRefund || undefined,
  };

  return (
    <>
      <input id="mobile-filters-toggle" type="checkbox" className="peer sr-only lg:hidden" />
      <div className="flex items-center justify-between gap-2">
        <label
          htmlFor="mobile-filters-toggle"
          className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 rounded-lg py-1 -my-1 lg:cursor-default lg:pointer-events-none"
          title="Shfaq ose fshih filtrat"
        >
          <h2 className="flex min-w-0 items-center gap-2 text-base font-semibold text-slate-900">
            <SlidersHorizontal className="h-5 w-5 shrink-0 text-slate-600" strokeWidth={1.8} aria-hidden="true" />
            Filtrat
          </h2>
        </label>
        <a href={basePath} className="shrink-0 text-xs text-slate-600">
          Pastro filtrat
        </a>
      </div>
      <div className="mt-4 hidden peer-checked:block lg:block">
        <form action={basePath} method="GET" className="space-y-3">
          <input type="hidden" name="vehicleType" value={vehicleType} />
          {initialPerPage ? <input type="hidden" name="perPage" value={initialPerPage} /> : null}
          {(segment || legacyType) && <input type="hidden" name="segment" value={segment ?? legacyType ?? ""} />}
          <SearchableMultiSelect
            name="make"
            values={make}
            onChange={(next) => {
              setMake(next);
              setModel([]);
            }}
            options={makes.map((item) => ({ value: item.name, label: item.name }))}
            placeholder="Marka"
            searchPlaceholder="Kërko markë..."
            emptyText="Nuk u gjet asnjë markë"
            className="w-full"
          />
          <SearchableMultiSelect
            name="model"
            values={model}
            onChange={(next) => setModel(next)}
            options={filteredModels.map((item) => ({
              value: item.name,
              label: `${item.make.name} - ${item.name}`,
            }))}
            placeholder={make.length === 0 ? "Zgjidh markën më parë" : "Modeli"}
            searchPlaceholder="Kërko model..."
            emptyText="Nuk ka modele për markën e zgjedhur"
            disabled={make.length === 0}
            className="w-full"
          />
          <div className="space-y-2">
            <p className="text-xs font-medium text-slate-600">Çmimi</p>
            <div className="grid grid-cols-2 gap-2">
              <input name="priceFrom" defaultValue={initialPriceFrom} type="number" min="0" placeholder="Nga" className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-slate-500" />
              <input name="priceTo" defaultValue={initialPriceTo} type="number" min="0" placeholder="Deri" className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-slate-500" />
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-xs font-medium text-slate-600">Regjistrimi</p>
            <div className="grid grid-cols-2 gap-2">
              <input name="registrationFrom" defaultValue={initialRegistrationFrom} type="number" min="1900" placeholder="Nga" className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-slate-500" />
              <input name="registrationTo" defaultValue={initialRegistrationTo} type="number" min="1900" placeholder="Deri" className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-slate-500" />
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-xs font-medium text-slate-600">Kilometrazhi (km)</p>
            <div className="grid grid-cols-2 gap-2">
              <input name="mileageFrom" defaultValue={initialMileageFrom} type="number" min="0" placeholder="Nga" className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-slate-500" />
              <input name="mileageTo" defaultValue={initialMileageTo} type="number" min="0" placeholder="Deri" className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-slate-500" />
            </div>
          </div>
          <button
            type="submit"
            className="h-10 w-full rounded-lg bg-slate-900 text-sm font-semibold text-white transition hover:bg-slate-700"
          >
            Apliko filtrat
          </button>
        </form>
        <div className="mt-5 space-y-4 border-t border-slate-200 pt-4">
          <div>
            <p className="text-xs font-medium text-slate-600">Vendndodhja</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {cityOptions.map((city) => {
                const isActive = initialCity.toLowerCase() === city.toLowerCase();
                const qs = mergeCarSearchParams(searchBase, { city: isActive ? "" : city });
                return (
                  <a key={city} href={`${basePath}?${qs}`} className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium transition ${isActive ? "border-slate-900 bg-slate-900 text-white" : "border-slate-300 bg-white text-slate-700 hover:border-slate-500"}`}>
                    {city}
                  </a>
                );
              })}
            </div>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-600">Karburanti</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {fuelOptions.map((fuel) => {
                const isActive = initialFuel.toLowerCase() === fuel.toLowerCase();
                const qs = mergeCarSearchParams(searchBase, { fuel: isActive ? "" : fuel });
                return (
                  <a key={fuel} href={`${basePath}?${qs}`} className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium transition ${isActive ? "border-slate-900 bg-slate-900 text-white" : "border-slate-300 bg-white text-slate-700 hover:border-slate-500"}`}>
                    {fuel}
                  </a>
                );
              })}
            </div>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-600">Etiketat</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {tagOptions.map((tag) => {
                const isActive = initialTag.toLowerCase() === tag.toLowerCase();
                const qs = mergeCarSearchParams(searchBase, { tag: isActive ? "" : tag });
                return (
                  <a
                    key={tag}
                    href={`${basePath}?${qs}`}
                    className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium transition ${
                      isActive
                        ? "border-slate-900 bg-slate-900 text-white"
                        : "border-slate-300 bg-white text-slate-700 hover:border-slate-500"
                    }`}
                  >
                    {tag}
                  </a>
                );
              })}
            </div>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-600">Statusi i regjistrimit</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {[
                { value: "albanian_plates", label: "Targa shqiptare" },
                { value: "customs_paid", label: "Doganë e paguar (pa targa)" },
                { value: "taxes_due", label: "Tatim doganor pa paguar" },
              ].map((option) => {
                const isActive =
                  initialRegStatus.toLowerCase() === option.value.toLowerCase();
                const qs = mergeCarSearchParams(searchBase, {
                  regStatus: isActive ? "" : option.value,
                });
                return (
                  <a
                    key={option.value}
                    href={`${basePath}?${qs}`}
                    className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium transition ${
                      isActive
                        ? "border-slate-900 bg-slate-900 text-white"
                        : "border-slate-300 bg-white text-slate-700 hover:border-slate-500"
                    }`}
                  >
                    {option.label}
                  </a>
                );
              })}
            </div>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-600">Tatim i rimbursueshëm</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {[
                { value: "yes", label: "Po" },
                { value: "no", label: "Jo" },
              ].map((option) => {
                const isActive =
                  initialTaxRefund.toLowerCase() === option.value.toLowerCase();
                const qs = mergeCarSearchParams(searchBase, {
                  taxRefund: isActive ? "" : option.value,
                });
                return (
                  <a
                    key={option.value}
                    href={`${basePath}?${qs}`}
                    className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium transition ${
                      isActive
                        ? "border-slate-900 bg-slate-900 text-white"
                        : "border-slate-300 bg-white text-slate-700 hover:border-slate-500"
                    }`}
                  >
                    {option.label}
                  </a>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
