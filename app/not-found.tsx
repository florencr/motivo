import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Faqja nuk u gjet",
  description: "Faqja që po kërkoni nuk ekziston në Motivo.",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <main className="min-h-[60vh] bg-slate-100 px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          404
        </p>
        <h1 className="mt-2 text-3xl font-bold text-slate-900">
          Faqja nuk u gjet
        </h1>
        <p className="mt-3 text-sm text-slate-600">
          Faqja që po kërkoni nuk ekziston ose është zhvendosur.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/"
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
          >
            Shko në Kreu
          </Link>
          <Link
            href="/makina"
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-500"
          >
            Shfleto makinat
          </Link>
        </div>
      </div>
    </main>
  );
}
