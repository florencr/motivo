"use client";

import { useMemo, useState } from "react";
import SearchableSelect from "@/app/components/searchable-select";

type VehicleTypeRow = { id: string; name: string; slug: string };
type VehicleSegment = { id: string; name: string; vehicleTypeId: string };
type Make = { id: string; name: string; vehicleTypeId: string; segmentId?: string | null };
type Model = { id: string; name: string; make: { name: string }; makeId?: string };

type SellFormProps = {
  vehicleTypes: VehicleTypeRow[];
  vehicleSegments: VehicleSegment[];
  makes: Make[];
  models: Model[];
  tagOptions: string[];
  featureOptions: string[];
};

export default function SellForm({
  vehicleTypes,
  vehicleSegments,
  makes,
  models,
  tagOptions,
  featureOptions,
}: SellFormProps) {
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [coverIndex, setCoverIndex] = useState(0);

  function releasePreviewUrls(urls: string[]) {
    for (const url of urls) {
      URL.revokeObjectURL(url);
    }
  }

  function setSelectedFiles(nextFiles: File[]) {
    releasePreviewUrls(previewUrls);
    setFiles(nextFiles);
    setPreviewUrls(nextFiles.map((file) => URL.createObjectURL(file)));
    setCoverIndex(0);
  }

  function removePhoto(index: number) {
    const nextFiles = files.filter((_, i) => i !== index);
    setSelectedFiles(nextFiles);
  }

  function movePhoto(index: number, direction: "left" | "right") {
    const targetIndex = direction === "left" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= files.length) return;
    const nextFiles = [...files];
    const current = nextFiles[index];
    nextFiles[index] = nextFiles[targetIndex];
    nextFiles[targetIndex] = current;
    setSelectedFiles(nextFiles);
  }

  const [title, setTitle] = useState("");
  const [vehicleTypeId, setVehicleTypeId] = useState(vehicleTypes[0]?.id ?? "");
  const [makeId, setMakeId] = useState("");
  const [modelId, setModelId] = useState("");
  const [year, setYear] = useState("");
  const [mileageKm, setMileageKm] = useState("");
  const [price, setPrice] = useState("");
  const [fuelType, setFuelType] = useState("PETROL");
  const [transmission, setTransmission] = useState("MANUAL");
  const [ownerCount, setOwnerCount] = useState("1");
  const [hasAccidentHistory, setHasAccidentHistory] = useState(false);
  const [damageSeverity, setDamageSeverity] = useState("none");
  const [hasServiceHistory, setHasServiceHistory] = useState(false);
  const [city, setCity] = useState("");
  const [description, setDescription] = useState("");
  const [segmentId, setSegmentId] = useState("");
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const filteredSegments = useMemo(() => {
    if (!vehicleTypeId) return vehicleSegments;
    return vehicleSegments.filter((segment) => segment.vehicleTypeId === vehicleTypeId);
  }, [vehicleSegments, vehicleTypeId]);

  const filteredMakes = useMemo(() => {
    if (!vehicleTypeId) return makes;
    const byType = makes.filter((m) => m.vehicleTypeId === vehicleTypeId);
    if (!segmentId) return byType;
    return byType.filter((m) => m.segmentId === segmentId);
  }, [makes, segmentId, vehicleTypeId]);

  const filteredModels = useMemo(() => {
    if (!makeId) return [];
    return models.filter((m) => (m as Model & { makeId: string }).makeId === makeId);
  }, [makeId, models]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsSubmitting(true);

    try {
      let imageUrls: string[] = [];
      if (files.length > 0) {
        const orderedFiles = [...files];
        const selectedCover = orderedFiles[coverIndex];
        if (selectedCover) {
          orderedFiles.splice(coverIndex, 1);
          orderedFiles.unshift(selectedCover);
        }

        const uploadFormData = new FormData();
        for (const file of orderedFiles) {
          uploadFormData.append("files", file);
        }

        const uploadRes = await fetch("/api/uploads/listings", {
          method: "POST",
          body: uploadFormData,
        });
        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) {
          setError(uploadData?.error ?? "Failed to upload images");
          return;
        }
        imageUrls = uploadData.urls ?? [];
      }

      const res = await fetch("/api/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          vehicleTypeId,
          segmentId: segmentId || null,
          makeId,
          modelId,
          year: Number(year),
          mileageKm: Number(mileageKm),
          price: Number(price),
          fuelType,
          transmission,
          ownerCount: Number(ownerCount),
          hasAccidentHistory,
          damageSeverity: damageSeverity === "none" ? null : damageSeverity,
          hasServiceHistory,
          city,
          description,
          selectedFeatures,
          selectedTags,
          imageUrls,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error ?? "Failed to create listing");
        return;
      }
      setSuccess("Vehicle listing created successfully.");
      setTitle("");
      setMakeId("");
      setModelId("");
      setYear("");
      setMileageKm("");
      setPrice("");
      setOwnerCount("1");
      setHasAccidentHistory(false);
      setDamageSeverity("none");
      setHasServiceHistory(false);
      setCity("");
      setDescription("");
      setSegmentId("");
      setSelectedFeatures([]);
      setSelectedTags([]);
      releasePreviewUrls(previewUrls);
      setFiles([]);
      setPreviewUrls([]);
      setCoverIndex(0);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-5 space-y-3">
      {error && <p className="text-sm text-red-600">{error}</p>}
      {success && <p className="text-sm text-emerald-700">{success}</p>}

      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Title"
        required
        className="h-11 w-full rounded-lg border border-slate-300 px-3 text-sm"
      />

      <div className="grid gap-3 sm:grid-cols-4">
        <select
          value={vehicleTypeId}
          onChange={(e) => {
            setVehicleTypeId(e.target.value);
            setSegmentId("");
            setMakeId("");
            setModelId("");
          }}
          required
          className="h-11 rounded-lg border border-slate-300 bg-white px-3 text-sm"
        >
          <option value="">Vehicle type</option>
          {vehicleTypes.map((vt) => (
            <option key={vt.id} value={vt.id}>
              {vt.name}
            </option>
          ))}
        </select>
        <select
          value={segmentId}
          onChange={(e) => {
            setSegmentId(e.target.value);
            setMakeId("");
            setModelId("");
          }}
          className="h-11 rounded-lg border border-slate-300 bg-white px-3 text-sm"
        >
          <option value="">Select category</option>
          {filteredSegments.map((segment) => (
            <option key={segment.id} value={segment.id}>
              {segment.name}
            </option>
          ))}
        </select>
        <SearchableSelect
          value={makeId}
          onChange={(next) => {
            setMakeId(next);
            setModelId("");
          }}
          options={filteredMakes.map((make) => ({ value: make.id, label: make.name }))}
          placeholder={filteredMakes.length > 0 ? "Select make" : "No makes for this category"}
          searchPlaceholder="Search make..."
          emptyText="No makes found"
        />
        <SearchableSelect
          value={modelId}
          onChange={(next) => setModelId(next)}
          options={filteredModels.map((model) => ({
            value: model.id,
            label: `${model.make.name} - ${model.name}`,
          }))}
          placeholder={
            makeId ? (filteredModels.length > 0 ? "Select model" : "No models for this make") : "Select make first"
          }
          searchPlaceholder="Search model..."
          emptyText="No models found"
          disabled={!makeId}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <input
          type="number"
          value={year}
          onChange={(e) => setYear(e.target.value)}
          placeholder="Year"
          min="1900"
          required
          className="h-11 rounded-lg border border-slate-300 px-3 text-sm"
        />
        <input
          type="number"
          value={mileageKm}
          onChange={(e) => setMileageKm(e.target.value)}
          placeholder="Mileage km"
          min="0"
          required
          className="h-11 rounded-lg border border-slate-300 px-3 text-sm"
        />
        <input
          type="number"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="Price EUR"
          min="0"
          required
          className="h-11 rounded-lg border border-slate-300 px-3 text-sm"
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        <input
          type="number"
          value={ownerCount}
          onChange={(e) => setOwnerCount(e.target.value)}
          placeholder="Owners count"
          min="1"
          className="h-11 rounded-lg border border-slate-300 px-3 text-sm"
        />
        <select
          value={damageSeverity}
          onChange={(e) => setDamageSeverity(e.target.value)}
          className="h-11 rounded-lg border border-slate-300 bg-white px-3 text-sm"
        >
          <option value="none">No damage</option>
          <option value="minor">Minor damage</option>
          <option value="major">Major damage</option>
        </select>
        <label className="flex h-11 items-center gap-2 rounded-lg border border-slate-300 px-3 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={hasAccidentHistory}
            onChange={(e) => setHasAccidentHistory(e.target.checked)}
          />
          Accident history
        </label>
        <label className="flex h-11 items-center gap-2 rounded-lg border border-slate-300 px-3 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={hasServiceHistory}
            onChange={(e) => setHasServiceHistory(e.target.checked)}
          />
          Full service history
        </label>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <select
          value={fuelType}
          onChange={(e) => setFuelType(e.target.value)}
          className="h-11 rounded-lg border border-slate-300 bg-white px-3 text-sm"
        >
          <option value="PETROL">Petrol</option>
          <option value="DIESEL">Diesel</option>
          <option value="ELECTRIC">Electric</option>
          <option value="HYBRID">Hybrid</option>
        </select>
        <select
          value={transmission}
          onChange={(e) => setTransmission(e.target.value)}
          className="h-11 rounded-lg border border-slate-300 bg-white px-3 text-sm"
        >
          <option value="MANUAL">Manual</option>
          <option value="AUTOMATIC">Automatic</option>
        </select>
        <input
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="City"
          className="h-11 rounded-lg border border-slate-300 px-3 text-sm"
        />
      </div>

      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Description"
        required
        className="min-h-32 w-full rounded-lg border border-slate-300 p-3 text-sm"
      />

      <div className="space-y-2">
        <p className="text-sm font-medium text-slate-700">Listing tags</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {tagOptions.map((tag) => {
            const checked = selectedTags.includes(tag);
            return (
              <label key={tag} className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedTags((prev) => [...prev, tag]);
                      return;
                    }
                    setSelectedTags((prev) => prev.filter((item) => item !== tag));
                  }}
                />
                <span>{tag}</span>
              </label>
            );
          })}
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium text-slate-700">Features</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {featureOptions.map((feature) => {
            const checked = selectedFeatures.includes(feature);
            return (
              <label key={feature} className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedFeatures((prev) => [...prev, feature]);
                      return;
                    }
                    setSelectedFeatures((prev) => prev.filter((item) => item !== feature));
                  }}
                />
                <span>{feature}</span>
              </label>
            );
          })}
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-700">Photos</label>
        <input
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          multiple
          onChange={(e) => {
            const selected = Array.from(e.target.files ?? []);
            setSelectedFiles(selected);
          }}
          className="block w-full text-sm text-slate-700"
        />
        {previewUrls.length > 0 && (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {previewUrls.map((url, index) => (
              <div key={url} className="rounded border border-slate-200 p-2">
                <div className="mb-2 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setCoverIndex(index)}
                    className={`rounded px-2 py-1 text-xs ${
                      coverIndex === index
                        ? "bg-slate-900 text-white"
                        : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {coverIndex === index ? "Cover Photo" : "Set as Cover"}
                  </button>
                  <button
                    type="button"
                    onClick={() => removePhoto(index)}
                    className="text-xs text-red-600"
                  >
                    Delete
                  </button>
                </div>

                <img
                  src={url}
                  alt="Upload preview"
                  className="h-24 w-full rounded border border-slate-200 object-cover"
                />

                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => movePhoto(index, "left")}
                    className="rounded bg-slate-100 px-2 py-1 text-xs text-slate-700"
                  >
                    Move Left
                  </button>
                  <button
                    type="button"
                    onClick={() => movePhoto(index, "right")}
                    className="rounded bg-slate-100 px-2 py-1 text-xs text-slate-700"
                  >
                    Move Right
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="h-11 rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white disabled:opacity-60"
      >
        {isSubmitting ? "Publishing..." : "Publish Vehicle"}
      </button>
    </form>
  );
}
