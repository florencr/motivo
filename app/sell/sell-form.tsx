"use client";

import { useMemo, useState } from "react";

type Make = { id: string; name: string };
type Model = { id: string; name: string; make: { name: string }; makeId?: string };

type SellFormProps = {
  makes: Make[];
  models: Model[];
};

export default function SellForm({ makes, models }: SellFormProps) {
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
  const [makeId, setMakeId] = useState("");
  const [modelId, setModelId] = useState("");
  const [year, setYear] = useState("");
  const [mileageKm, setMileageKm] = useState("");
  const [price, setPrice] = useState("");
  const [fuelType, setFuelType] = useState("PETROL");
  const [transmission, setTransmission] = useState("MANUAL");
  const [city, setCity] = useState("");
  const [description, setDescription] = useState("");

  const filteredModels = useMemo(() => {
    if (!makeId) return models;
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
          makeId,
          modelId,
          year: Number(year),
          mileageKm: Number(mileageKm),
          price: Number(price),
          fuelType,
          transmission,
          city,
          description,
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
      setModelId("");
      setYear("");
      setMileageKm("");
      setPrice("");
      setCity("");
      setDescription("");
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

      <div className="grid gap-3 sm:grid-cols-2">
        <select
          value={makeId}
          onChange={(e) => {
            setMakeId(e.target.value);
            setModelId("");
          }}
          required
          className="h-11 rounded-lg border border-slate-300 bg-white px-3 text-sm"
        >
          <option value="">Select make</option>
          {makes.map((make) => (
            <option key={make.id} value={make.id}>
              {make.name}
            </option>
          ))}
        </select>
        <select
          value={modelId}
          onChange={(e) => setModelId(e.target.value)}
          required
          className="h-11 rounded-lg border border-slate-300 bg-white px-3 text-sm"
        >
          <option value="">Select model</option>
          {filteredModels.map((model) => (
            <option key={model.id} value={model.id}>
              {model.make.name} - {model.name}
            </option>
          ))}
        </select>
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
