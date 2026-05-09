"use client";

import { useState } from "react";

type ProfileFormProps = {
  initialName: string;
  email: string;
  initialPhone: string;
  initialAddress: string;
  initialAvatarUrl: string;
  initialProfileDescription: string;
};

export default function ProfileForm({
  initialName,
  email,
  initialPhone,
  initialAddress,
  initialAvatarUrl,
  initialProfileDescription,
}: ProfileFormProps) {
  const [name, setName] = useState(initialName);
  const [phone, setPhone] = useState(initialPhone);
  const [address, setAddress] = useState(initialAddress);
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl);
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
      const res = await fetch("/api/dashboard/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scope: "account",
          name,
          phone,
          address,
          avatarUrl,
          profileDescription,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error ?? "Përditësimi i profilit dështoi");
        return;
      }
      setSuccess("Profili u përditësua.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-5 space-y-3">
      {error && <p className="text-sm text-red-600">{error}</p>}
      {success && <p className="text-sm text-emerald-700">{success}</p>}

      <div className="grid gap-3 sm:grid-cols-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Emri i plotë"
          required
          className="h-11 rounded-lg border border-slate-300 px-3 text-sm"
        />
        <input
          value={email}
          readOnly
          placeholder="Email"
          className="h-11 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-500"
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Telefoni"
          className="h-11 rounded-lg border border-slate-300 px-3 text-sm"
        />
        <input
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Adresa"
          className="h-11 rounded-lg border border-slate-300 px-3 text-sm"
        />
      </div>

      <input
        value={avatarUrl}
        onChange={(e) => setAvatarUrl(e.target.value)}
        placeholder="URL e fotos së profilit"
        className="h-11 w-full rounded-lg border border-slate-300 px-3 text-sm"
      />

      <textarea
        value={profileDescription}
        onChange={(e) => setProfileDescription(e.target.value)}
        placeholder="Rreth meje"
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
