"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Role = "BUYER" | "PRIVATE_SELLER" | "DEALER";

export default function RegisterPage() {
  const router = useRouter();
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
    if (role === "DEALER") return "Dealer account";
    if (role === "PRIVATE_SELLER") return "Private seller account";
    return "Buyer account";
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
        setError(data?.error ?? "Registration failed");
        return;
      }
      router.push("/");
      router.refresh();
    } catch {
      setError("Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-10">
      <div className="mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">Create Account</h1>
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
                ? "Buyer"
                : item === "PRIVATE_SELLER"
                  ? "Private Seller"
                  : "Dealer"}
            </button>
          ))}
        </div>

        <form onSubmit={onSubmit} className="mt-5 space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="First name"
              required
              className="h-11 rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-slate-500"
            />
            <input
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Last name"
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
            placeholder="Password (min 8 characters)"
            required
            className="h-11 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-slate-500"
          />

          {(role === "PRIVATE_SELLER" || role === "DEALER") && (
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Phone"
              required={role === "PRIVATE_SELLER"}
              className="h-11 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-slate-500"
            />
          )}

          {role === "PRIVATE_SELLER" && (
            <input
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="Avatar URL (optional)"
              className="h-11 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-slate-500"
            />
          )}

          {role === "DEALER" && (
            <>
              <input
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Company name"
                required
                className="h-11 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-slate-500"
              />
              <input
                value={taxId}
                onChange={(e) => setTaxId(e.target.value)}
                placeholder="Tax ID"
                required
                className="h-11 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-slate-500"
              />
              <input
                value={companyLogoUrl}
                onChange={(e) => setCompanyLogoUrl(e.target.value)}
                placeholder="Company logo URL (optional)"
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
            {loading ? "Creating..." : "Create account"}
          </button>
        </form>

        <p className="mt-4 text-sm text-slate-600">
          Already have account?{" "}
          <a href="/login" className="font-medium text-slate-900 underline">
            Login
          </a>
        </p>
      </div>
    </main>
  );
}
