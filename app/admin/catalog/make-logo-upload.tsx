"use client";

import { useRef, useState } from "react";

type MakeLogoUploadProps = {
  onUploaded: (url: string) => void;
  className?: string;
};

export default function MakeLogoUpload({ onUploaded, className }: MakeLogoUploadProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/uploads/make-logo", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error ?? "Ngarkimi dështoi");
        return;
      }
      onUploaded(data.url ?? "");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <div className={className}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp,image/svg+xml"
        onChange={onFileChange}
        className="hidden"
      />
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        className="h-9 rounded border border-slate-300 px-3 text-xs font-semibold text-slate-700 hover:border-slate-500 hover:bg-slate-50 disabled:opacity-60"
      >
        {uploading ? "Po ngarkohet..." : "Ngarko"}
      </button>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
