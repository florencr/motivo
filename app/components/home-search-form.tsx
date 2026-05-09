"use client";

import { useMemo, useState } from "react";
import SearchableMultiSelect from "./searchable-multi-select";

type MakeOption = { id: string; name: string };
type ModelOption = { id: string; name: string; make: { name: string } };

type HomeSearchFormProps = {
  selectedVehicleType: string;
  makes: MakeOption[];
  models: ModelOption[];
  initialMake?: string;
};

function splitSelectedValues(value?: string) {
  return String(value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export default function HomeSearchForm({
  selectedVehicleType,
  makes,
  models,
  initialMake = "",
}: HomeSearchFormProps) {
  const [make, setMake] = useState<string[]>(splitSelectedValues(initialMake));
  const [model, setModel] = useState<string[]>([]);

  const filteredModels = useMemo(() => {
    if (make.length === 0) return [];
    const selectedMakes = new Set(make.map((item) => item.toLowerCase()));
    return models.filter((item) =>
      selectedMakes.has(item.make.name.toLowerCase()),
    );
  }, [make, models]);

  return (
    <form
      action={`/${selectedVehicleType}`}
      method="GET"
      className="mt-8 w-full rounded-2xl bg-white/95 p-4 shadow-2xl backdrop-blur sm:p-6"
    >
      <div className="grid gap-3 md:grid-cols-6">
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
        />
        <input
          name="registrationFrom"
          type="number"
          min="1900"
          placeholder="Regjistrimi nga"
          className="h-11 rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-slate-500"
        />
        <input
          name="mileageTo"
          type="number"
          min="0"
          placeholder="Kilometrazhi deri (km)"
          className="h-11 rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-slate-500"
        />
        <input
          name="priceTo"
          type="number"
          min="0"
          placeholder="Çmimi maksimal"
          className="h-11 rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-slate-500"
        />
        <button
          type="submit"
          className="h-11 rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-700"
        >
          Kërko
        </button>
      </div>
    </form>
  );
}
