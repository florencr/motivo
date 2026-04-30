"use client";

import { useMemo, useState } from "react";
import SearchableSelect from "./searchable-select";

type MakeOption = { id: string; name: string };
type ModelOption = { id: string; name: string; make: { name: string } };

type HomeSearchFormProps = {
  selectedVehicleType: string;
  makes: MakeOption[];
  models: ModelOption[];
  initialMake?: string;
};

export default function HomeSearchForm({
  selectedVehicleType,
  makes,
  models,
  initialMake = "",
}: HomeSearchFormProps) {
  const [make, setMake] = useState(initialMake);
  const [model, setModel] = useState("");

  const filteredModels = useMemo(() => {
    if (!make) return [];
    return models.filter((item) => item.make.name.toLowerCase() === make.toLowerCase());
  }, [make, models]);

  return (
    <form
      action="/cars"
      method="GET"
      className="mt-8 w-full rounded-2xl bg-white/95 p-4 shadow-2xl backdrop-blur sm:p-6"
    >
      <input type="hidden" name="vehicleType" value={selectedVehicleType} />
      <div className="grid gap-3 md:grid-cols-6">
        <SearchableSelect
          name="make"
          value={make}
          onChange={(next) => {
            setMake(next);
            setModel("");
          }}
          options={makes.map((item) => ({ value: item.name, label: item.name }))}
          placeholder="Make"
          searchPlaceholder="Search make..."
          emptyText="No makes found"
        />
        <SearchableSelect
          name="model"
          value={model}
          onChange={(next) => setModel(next)}
          options={filteredModels.map((model) => ({
            value: model.name,
            label: `${model.make.name} - ${model.name}`,
          }))}
          placeholder={!make ? "Select make first" : "Model"}
          searchPlaceholder="Search model..."
          emptyText="No models for selected make"
          disabled={!make}
        />
        <input
          name="registrationFrom"
          type="number"
          min="1900"
          placeholder="Registration From"
          className="h-11 rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-slate-500"
        />
        <input
          name="mileageTo"
          type="number"
          min="0"
          placeholder="Mileage Up To (km)"
          className="h-11 rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-slate-500"
        />
        <input
          name="priceTo"
          type="number"
          min="0"
          placeholder="Max Price"
          className="h-11 rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-slate-500"
        />
        <button
          type="submit"
          className="h-11 rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-700"
        >
          Search Cars
        </button>
      </div>
    </form>
  );
}
