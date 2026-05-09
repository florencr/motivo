"use client";

import { useState } from "react";

function StarPicker({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div>
      <p className="text-xs font-medium text-slate-700">{label}</p>
      <div className="mt-1 flex items-center gap-1 text-amber-500">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className="text-lg leading-none"
            aria-label={`${label} ${star} yje`}
          >
            {value >= star ? "★" : "☆"}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function SellerRatingForm({ sellerId }: { sellerId: string }) {
  const [responsiveness, setResponsiveness] = useState(0);
  const [realityMatch, setRealityMatch] = useState(0);
  const [overall, setOverall] = useState(0);
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function submitRating() {
    setError("");
    setSuccess("");
    setIsSaving(true);
    try {
      const res = await fetch(`/api/sellers/${sellerId}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          responsivenessRating: responsiveness,
          realityMatchRating: realityMatch,
          overallExperienceRating: overall,
          comment,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error ?? "Ruajtja e vlerësimit dështoi");
        return;
      }
      setSuccess("Faleminderit! Vlerësimi yt u ruajt.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
      <h3 className="text-sm font-semibold text-slate-900">Vlerëso këtë shitës</h3>
      <div className="mt-3 space-y-3">
        <StarPicker label="Përgjegjshmëria" value={responsiveness} onChange={setResponsiveness} />
        <StarPicker label="Përshkrimi përkon me realitetin" value={realityMatch} onChange={setRealityMatch} />
        <StarPicker label="Përvoja në përgjithësi" value={overall} onChange={setOverall} />
      </div>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Koment opsional"
        className="mt-3 min-h-20 w-full rounded border border-slate-300 p-2 text-sm"
      />
      {error ? <p className="mt-2 text-xs text-red-600">{error}</p> : null}
      {success ? <p className="mt-2 text-xs text-emerald-700">{success}</p> : null}
      <button
        type="button"
        disabled={isSaving}
        onClick={submitRating}
        className="mt-3 rounded bg-slate-900 px-3 py-2 text-xs font-semibold text-white disabled:opacity-60"
      >
        {isSaving ? "Po ruhet..." : "Dërgo vlerësimin"}
      </button>
    </div>
  );
}
