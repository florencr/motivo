"use client";

import { useMemo, useState } from "react";
import SearchableSelect from "@/app/components/searchable-select";

type VehicleTypeRow = { id: string; name: string; slug: string };
type VehicleSegment = { id: string; name: string; vehicleTypeId: string };
type Make = { id: string; name: string; vehicleTypeId: string; segmentId?: string | null };
type Model = { id: string; name: string; make: { name: string }; makeId?: string };

type RegistrationStatusValue =
  | ""
  | "albanian_plates"
  | "customs_paid"
  | "taxes_due";

export type SellFormInitial = {
  title?: string;
  vehicleTypeId?: string;
  segmentId?: string;
  makeId?: string;
  modelId?: string;
  year?: number | string;
  mileageKm?: number | string;
  price?: number | string;
  fuelType?: string;
  transmission?: string;
  city?: string;
  description?: string;
  selectedFeatures?: string[];
  selectedTags?: string[];
  registrationStatus?: RegistrationStatusValue;
  isTaxRefundable?: boolean;
  engineCapacity?: number | string | null;
  powerHp?: number | string | null;
  imageUrls?: string[];
};

type SellFormProps = {
  vehicleTypes: VehicleTypeRow[];
  vehicleSegments: VehicleSegment[];
  makes: Make[];
  models: Model[];
  tagOptions: string[];
  featureOptions: string[];
  mode?: "create" | "edit";
  listingId?: string;
  initial?: SellFormInitial;
};

export default function SellForm({
  vehicleTypes,
  vehicleSegments,
  makes,
  models,
  tagOptions,
  featureOptions,
  mode = "create",
  listingId,
  initial,
}: SellFormProps) {
  const isEditMode = mode === "edit";
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [coverIndex, setCoverIndex] = useState(0);
  const [existingImageUrls, setExistingImageUrls] = useState<string[]>(
    initial?.imageUrls ?? [],
  );

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

  const [title, setTitle] = useState(initial?.title ?? "");
  const [vehicleTypeId, setVehicleTypeId] = useState(
    initial?.vehicleTypeId ?? vehicleTypes[0]?.id ?? "",
  );
  const [makeId, setMakeId] = useState(initial?.makeId ?? "");
  const [modelId, setModelId] = useState(initial?.modelId ?? "");
  const [year, setYear] = useState(
    initial?.year != null ? String(initial.year) : "",
  );
  const [mileageKm, setMileageKm] = useState(
    initial?.mileageKm != null ? String(initial.mileageKm) : "",
  );
  const [price, setPrice] = useState(
    initial?.price != null ? String(initial.price) : "",
  );
  const [fuelType, setFuelType] = useState(initial?.fuelType ?? "PETROL");
  const [transmission, setTransmission] = useState(initial?.transmission ?? "MANUAL");
  const [city, setCity] = useState(initial?.city ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [segmentId, setSegmentId] = useState(initial?.segmentId ?? "");
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>(
    initial?.selectedFeatures ?? [],
  );
  const [selectedTags, setSelectedTags] = useState<string[]>(
    initial?.selectedTags ?? [],
  );
  const [registrationStatus, setRegistrationStatus] = useState<RegistrationStatusValue>(
    initial?.registrationStatus ?? "",
  );
  const [isTaxRefundable, setIsTaxRefundable] = useState(
    initial?.isTaxRefundable ?? false,
  );
  const [engineCapacity, setEngineCapacity] = useState(
    initial?.engineCapacity != null ? String(initial.engineCapacity) : "",
  );
  const [powerHp, setPowerHp] = useState(
    initial?.powerHp != null ? String(initial.powerHp) : "",
  );

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
      let uploadedImageUrls: string[] = [];
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
          setError(uploadData?.error ?? "Ngarkimi i fotove dështoi");
          return;
        }
        uploadedImageUrls = uploadData.urls ?? [];
      }

      const finalImageUrls = isEditMode
        ? [...existingImageUrls, ...uploadedImageUrls]
        : uploadedImageUrls;

      const payload = {
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
        city,
        description,
        selectedFeatures,
        selectedTags,
        imageUrls: finalImageUrls,
        registrationStatus,
        hasAlbanianPlates:
          registrationStatus === ""
            ? null
            : registrationStatus === "albanian_plates",
        isCustomsPaid:
          registrationStatus === ""
            ? null
            : registrationStatus === "albanian_plates" ||
              registrationStatus === "customs_paid",
        isTaxRefundable,
        engineCapacity: engineCapacity ? Number(engineCapacity) : null,
        powerHp: powerHp ? Number(powerHp) : null,
      };

      const url = isEditMode && listingId
        ? `/api/dashboard/listings/${listingId}`
        : "/api/listings";
      const method = isEditMode ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error ?? (isEditMode ? "Përditësimi i listimit dështoi" : "Krijimi i listimit dështoi"));
        return;
      }

      if (isEditMode) {
        setSuccess("Listimi u përditësua me sukses.");
        setExistingImageUrls(finalImageUrls);
        releasePreviewUrls(previewUrls);
        setFiles([]);
        setPreviewUrls([]);
        setCoverIndex(0);
        return;
      }

      setSuccess("Listimi i mjetit u krijua me sukses.");
      setTitle("");
      setMakeId("");
      setModelId("");
      setYear("");
      setMileageKm("");
      setPrice("");
      setCity("");
      setDescription("");
      setSegmentId("");
      setSelectedFeatures([]);
      setSelectedTags([]);
      setRegistrationStatus("");
      setIsTaxRefundable(false);
      setEngineCapacity("");
      setPowerHp("");
      releasePreviewUrls(previewUrls);
      setFiles([]);
      setPreviewUrls([]);
      setCoverIndex(0);
    } finally {
      setIsSubmitting(false);
    }
  }

  function removeExistingImage(url: string) {
    setExistingImageUrls((prev) => prev.filter((item) => item !== url));
  }

  function moveExistingImage(index: number, direction: "left" | "right") {
    const targetIndex = direction === "left" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= existingImageUrls.length) return;
    setExistingImageUrls((prev) => {
      const next = [...prev];
      const tmp = next[index];
      next[index] = next[targetIndex];
      next[targetIndex] = tmp;
      return next;
    });
  }

  return (
    <form onSubmit={onSubmit} className="mt-5 space-y-3">
      {error && <p className="text-sm text-red-600">{error}</p>}
      {success && <p className="text-sm text-emerald-700">{success}</p>}

      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Titulli"
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
          <option value="">Lloji i mjetit</option>
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
          <option value="">Zgjidh kategorinë</option>
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
          placeholder={filteredMakes.length > 0 ? "Zgjidh markën" : "Asnjë markë për këtë kategori"}
          searchPlaceholder="Kërko markë..."
          emptyText="Nuk u gjet asnjë markë"
        />
        <SearchableSelect
          value={modelId}
          onChange={(next) => setModelId(next)}
          options={filteredModels.map((model) => ({
            value: model.id,
            label: `${model.make.name} - ${model.name}`,
          }))}
          placeholder={
            makeId ? (filteredModels.length > 0 ? "Zgjidh modelin" : "Asnjë model për këtë markë") : "Zgjidh markën më parë"
          }
          searchPlaceholder="Kërko model..."
          emptyText="Nuk u gjet asnjë model"
          disabled={!makeId}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <input
          type="number"
          value={year}
          onChange={(e) => setYear(e.target.value)}
          placeholder="Viti"
          min="1900"
          required
          className="h-11 rounded-lg border border-slate-300 px-3 text-sm"
        />
        <input
          type="number"
          value={mileageKm}
          onChange={(e) => setMileageKm(e.target.value)}
          placeholder="Kilometrazhi (km)"
          min="0"
          required
          className="h-11 rounded-lg border border-slate-300 px-3 text-sm"
        />
        <input
          type="number"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="Çmimi EUR"
          min="0"
          required
          className="h-11 rounded-lg border border-slate-300 px-3 text-sm"
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <select
          value={fuelType}
          onChange={(e) => setFuelType(e.target.value)}
          className="h-11 rounded-lg border border-slate-300 bg-white px-3 text-sm"
        >
          <option value="PETROL">Benzinë</option>
          <option value="DIESEL">Naftë</option>
          <option value="ELECTRIC">Elektrik</option>
          <option value="HYBRID">Hibrid</option>
        </select>
        <select
          value={transmission}
          onChange={(e) => setTransmission(e.target.value)}
          className="h-11 rounded-lg border border-slate-300 bg-white px-3 text-sm"
        >
          <option value="MANUAL">Manual</option>
          <option value="AUTOMATIC">Automatik</option>
        </select>
        <input
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="Qyteti"
          className="h-11 rounded-lg border border-slate-300 px-3 text-sm"
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <input
          type="number"
          value={engineCapacity}
          onChange={(e) => setEngineCapacity(e.target.value)}
          placeholder="Kapaciteti i motorit (cc)"
          min="0"
          className="h-11 rounded-lg border border-slate-300 px-3 text-sm"
        />
        <input
          type="number"
          value={powerHp}
          onChange={(e) => setPowerHp(e.target.value)}
          placeholder="Fuqia (hp)"
          min="0"
          className="h-11 rounded-lg border border-slate-300 px-3 text-sm"
        />
      </div>

      <div className="space-y-2 rounded-lg border border-slate-200 p-3">
        <p className="text-sm font-medium text-slate-700">Statusi i regjistrimit</p>
        <div className="grid gap-2 sm:grid-cols-3">
          {[
            { value: "albanian_plates" as const, label: "Targa shqiptare" },
            { value: "customs_paid" as const, label: "Doganë e paguar (pa targa)" },
            { value: "taxes_due" as const, label: "Tatim doganor pa paguar" },
          ].map((option) => (
            <label
              key={option.value}
              className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
                registrationStatus === option.value
                  ? "border-slate-900 bg-slate-900 text-white"
                  : "border-slate-300 bg-white text-slate-700 hover:border-slate-500"
              }`}
            >
              <input
                type="radio"
                name="registrationStatus"
                value={option.value}
                checked={registrationStatus === option.value}
                onChange={() => setRegistrationStatus(option.value)}
                className="hidden"
              />
              {option.label}
            </label>
          ))}
        </div>
        {registrationStatus ? (
          <button
            type="button"
            onClick={() => setRegistrationStatus("")}
            className="text-xs font-medium text-slate-600 underline"
          >
            Pastro statusin e regjistrimit
          </button>
        ) : null}
        <label className="mt-1 flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={isTaxRefundable}
            onChange={(e) => setIsTaxRefundable(e.target.checked)}
          />
          Tatim i rimbursueshëm
        </label>
      </div>

      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Përshkrimi"
        required
        className="min-h-32 w-full rounded-lg border border-slate-300 p-3 text-sm"
      />

      <div className="space-y-2">
        <p className="text-sm font-medium text-slate-700">Etiketat e listimit</p>
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
        <p className="text-sm font-medium text-slate-700">Karakteristikat</p>
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
        <label className="block text-sm font-medium text-slate-700">Fotografi</label>

        {isEditMode && existingImageUrls.length > 0 && (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {existingImageUrls.map((url, index) => (
              <div key={url} className="rounded border border-slate-200 p-2">
                <div className="mb-2 flex items-center justify-between">
                  <span className="rounded bg-slate-100 px-2 py-1 text-xs text-slate-700">
                    {index === 0 ? "Foto kryesore" : `Foto ${index + 1}`}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeExistingImage(url)}
                    className="text-xs text-red-600"
                  >
                    Fshi
                  </button>
                </div>

                <img
                  src={url}
                  alt="Foto ekzistuese"
                  className="h-24 w-full rounded border border-slate-200 object-cover"
                />

                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => moveExistingImage(index, "left")}
                    className="rounded bg-slate-100 px-2 py-1 text-xs text-slate-700"
                  >
                    Lëviz majtas
                  </button>
                  <button
                    type="button"
                    onClick={() => moveExistingImage(index, "right")}
                    className="rounded bg-slate-100 px-2 py-1 text-xs text-slate-700"
                  >
                    Lëviz djathtas
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <input
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          multiple
          onChange={(e) => {
            const selected = Array.from(e.target.files ?? []);
            setSelectedFiles(selected);
          }}
          className="block w-full text-sm text-slate-700 file:mr-3 file:cursor-pointer file:rounded-lg file:border file:border-slate-300 file:bg-white file:px-3 file:py-2 file:text-sm file:font-medium file:text-slate-700 hover:file:border-slate-500 hover:file:bg-slate-50"
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
                    {coverIndex === index ? "Foto kryesore" : "Vendos si foto kryesore"}
                  </button>
                  <button
                    type="button"
                    onClick={() => removePhoto(index)}
                    className="text-xs text-red-600"
                  >
                    Fshi
                  </button>
                </div>

                <img
                  src={url}
                  alt="Pamja paraprake e foto-s"
                  className="h-24 w-full rounded border border-slate-200 object-cover"
                />

                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => movePhoto(index, "left")}
                    className="rounded bg-slate-100 px-2 py-1 text-xs text-slate-700"
                  >
                    Lëviz majtas
                  </button>
                  <button
                    type="button"
                    onClick={() => movePhoto(index, "right")}
                    className="rounded bg-slate-100 px-2 py-1 text-xs text-slate-700"
                  >
                    Lëviz djathtas
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
        {isSubmitting
          ? isEditMode
            ? "Po ruhet..."
            : "Po publikohet..."
          : isEditMode
          ? "Ruaj ndryshimet"
          : "Publiko mjetin"}
      </button>
    </form>
  );
}
