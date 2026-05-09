"use client";

import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type Role = "BUYER" | "PRIVATE_SELLER" | "DEALER";

function safeNext(value: string | null): string {
  if (!value) return "/";
  if (!value.startsWith("/") || value.startsWith("//")) return "/";
  return value;
}

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextUrl = safeNext(searchParams.get("next"));
  const loginHref = `/login?next=${encodeURIComponent(nextUrl)}`;
  const [role, setRole] = useState<Role>("BUYER");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [taxId, setTaxId] = useState("");
  const [companyLogoUrl, setCompanyLogoUrl] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const roleTitle = useMemo(() => {
    if (role === "DEALER") return "Llogari koncesionari";
    if (role === "PRIVATE_SELLER") return "Llogari shitësi privat";
    return "Llogari blerësi";
  }, [role]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role,
          firstName,
          lastName,
          email,
          password,
          phone: phone || null,
          avatarUrl: avatarUrl || null,
          companyName: companyName || null,
          taxId: taxId || null,
          companyLogoUrl: companyLogoUrl || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error ?? "Regjistrimi dështoi");
        return;
      }
      router.push(nextUrl);
      router.refresh();
    } catch {
      setError("Regjistrimi dështoi");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-10">
      <div className="mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">Krijo llogari</h1>
        <p className="mt-1 text-sm text-slate-600">{roleTitle}</p>

        <div className="mt-4 flex flex-wrap gap-2">
          {(["BUYER", "PRIVATE_SELLER", "DEALER"] as const).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setRole(item)}
              className={`rounded-full px-3 py-1.5 text-sm transition ${
                role === item
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {item === "BUYER"
                ? "Blerës"
                : item === "PRIVATE_SELLER"
                  ? "Shitës privat"
                  : "Koncesionar"}
            </button>
          ))}
        </div>

        <form onSubmit={onSubmit} className="mt-5 space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Emri"
              required
              className="h-11 rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-slate-500"
            />
            <input
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Mbiemri"
              required
              className="h-11 rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-slate-500"
            />
          </div>

          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            required
            className="h-11 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-slate-500"
          />

          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Fjalëkalimi (min 8 karaktere)"
            required
            className="h-11 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-slate-500"
          />

          {(role === "PRIVATE_SELLER" || role === "DEALER") && (
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Telefoni"
              required={role === "PRIVATE_SELLER"}
              className="h-11 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-slate-500"
            />
          )}

          {role === "PRIVATE_SELLER" && (
            <input
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="URL e fotos së profilit (opsionale)"
              className="h-11 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-slate-500"
            />
          )}

          {role === "DEALER" && (
            <>
              <input
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Emri i kompanisë"
                required
                className="h-11 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-slate-500"
              />
              <input
                value={taxId}
                onChange={(e) => setTaxId(e.target.value)}
                placeholder="NIPT / Numri i tatimit"
                required
                className="h-11 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-slate-500"
              />
              <input
                value={companyLogoUrl}
                onChange={(e) => setCompanyLogoUrl(e.target.value)}
                placeholder="URL e logos së kompanisë (opsionale)"
                className="h-11 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-slate-500"
              />
            </>
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="h-11 w-full rounded-lg bg-slate-900 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-60"
          >
            {loading ? "Po krijohet..." : "Krijo llogari"}
          </button>
        </form>

        <p className="mt-4 text-sm text-slate-600">
          Ke tashmë llogari?{" "}
          <a href={loginHref} className="font-medium text-slate-900 underline">
            Identifikohu
          </a>
        </p>
      </div>
    </main>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={null}>
      <RegisterForm />
    </Suspense>
  );
}
