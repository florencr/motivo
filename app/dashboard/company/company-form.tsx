"use client";

import { useState } from "react";

type CompanyFormProps = {
  initialCompanyName: string;
  initialCompanySlug: string;
  initialCompanySlogan: string;
  initialCompanyLogoUrl: string;
  initialTaxId: string;
  initialDealerLicenseNo: string;
  initialProfileDescription: string;
};

export default function CompanyForm({
  initialCompanyName,
  initialCompanySlug,
  initialCompanySlogan,
  initialCompanyLogoUrl,
  initialTaxId,
  initialDealerLicenseNo,
  initialProfileDescription,
}: CompanyFormProps) {
  const [companyName, setCompanyName] = useState(initialCompanyName);
  const [companySlug, setCompanySlug] = useState(initialCompanySlug);
  const [companySlogan, setCompanySlogan] = useState(initialCompanySlogan);
  const [companyLogoUrl, setCompanyLogoUrl] = useState(initialCompanyLogoUrl);
  const [companyLogoFile, setCompanyLogoFile] = useState<File | null>(null);
  const [companyLogoPreview, setCompanyLogoPreview] = useState(initialCompanyLogoUrl);
  const [taxId, setTaxId] = useState(initialTaxId);
  const [dealerLicenseNo, setDealerLicenseNo] = useState(initialDealerLicenseNo);
  const [profileDescription, setProfileDescription] = useState(
    initialProfileDescription,
  );
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSaving(true);
    try {
      let nextCompanyLogoUrl = companyLogoUrl;
      if (companyLogoFile) {
        const formData = new FormData();
        formData.append("file", companyLogoFile);
        const uploadRes = await fetch("/api/uploads/company-logo", {
          method: "POST",
          body: formData,
        });
        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) {
          setError(uploadData?.error ?? "Ngarkimi i logos së kompanisë dështoi");
          return;
        }
        nextCompanyLogoUrl = uploadData.url ?? "";
        setCompanyLogoUrl(nextCompanyLogoUrl);
      }

      const res = await fetch("/api/dashboard/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scope: "company",
          companyName,
          companySlug,
          companySlogan,
          companyLogoUrl: nextCompanyLogoUrl,
          taxId,
          dealerLicenseNo,
          profileDescription,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error ?? "Përditësimi i kompanisë dështoi");
        return;
      }
      setSuccess("Profili i kompanisë u përditësua.");
      setCompanyLogoFile(null);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-5 space-y-3">
      {error && <p className="text-sm text-red-600">{error}</p>}
      {success && <p className="text-sm text-emerald-700">{success}</p>}

      <input
        value={companyName}
        onChange={(e) => setCompanyName(e.target.value)}
        placeholder="Emri i kompanisë"
        required
        className="h-11 w-full rounded-lg border border-slate-300 px-3 text-sm"
      />

      <div className="space-y-2">
        <input
          value={companySlug}
          onChange={(e) => setCompanySlug(e.target.value)}
          placeholder="Adresa e faqes publike (p.sh. nextcars)"
          className="h-11 w-full rounded-lg border border-slate-300 px-3 text-sm"
        />
        <p className="text-xs text-slate-500">
          Faqja juaj: motivo.autos/[slug]. Slug ruhet me shkronja të vogla (a-z, 0-9, -).
          Lëreni bosh për ta çaktivizuar faqen publike.
        </p>
      </div>

      <input
        value={companySlogan}
        onChange={(e) => setCompanySlogan(e.target.value)}
        placeholder="Slogan (opsional)"
        className="h-11 w-full rounded-lg border border-slate-300 px-3 text-sm"
      />

      <div className="space-y-2 rounded-lg border border-slate-200 p-3">
        <label className="block text-sm font-medium text-slate-700">Logoja e kompanisë</label>
        {companyLogoPreview && (
          <img
            src={companyLogoPreview}
            alt="Pamja paraprake e logos së kompanisë"
            className="h-20 w-20 rounded-lg border border-slate-200 object-cover"
          />
        )}
        <input
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          onChange={(e) => {
            const file = e.target.files?.[0] ?? null;
            setCompanyLogoFile(file);
            if (file) {
              setCompanyLogoPreview(URL.createObjectURL(file));
            }
          }}
          className="block w-full text-sm text-slate-700 file:mr-3 file:cursor-pointer file:rounded-lg file:border file:border-slate-300 file:bg-white file:px-3 file:py-2 file:text-sm file:font-medium file:text-slate-700 hover:file:border-slate-500 hover:file:bg-slate-50"
        />
        <p className="text-xs text-slate-500">Ngarko JPG, PNG ose WEBP.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <input
          value={taxId}
          onChange={(e) => setTaxId(e.target.value)}
          placeholder="NIPT / Numri i tatimit"
          className="h-11 rounded-lg border border-slate-300 px-3 text-sm"
        />
        <input
          value={dealerLicenseNo}
          onChange={(e) => setDealerLicenseNo(e.target.value)}
          placeholder="Numri i licencës së koncesionarit"
          className="h-11 rounded-lg border border-slate-300 px-3 text-sm"
        />
      </div>

      <textarea
        value={profileDescription}
        onChange={(e) => setProfileDescription(e.target.value)}
        placeholder="Rreth kompanisë"
        className="min-h-32 w-full rounded-lg border border-slate-300 p-3 text-sm"
      />

      <button
        type="submit"
        disabled={saving}
        className="h-11 rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white disabled:opacity-60"
      >
        {saving ? "Po ruhet..." : "Ruaj ndryshimet"}
      </button>
    </form>
  );
}
