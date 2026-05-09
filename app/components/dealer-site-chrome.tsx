import Link from "next/link";
import type { DealerPublicCard } from "@/lib/dealer-public-page";
import DealerSiteNav from "./dealer-site-nav";

type DealerSiteChromeProps = {
  dealer: DealerPublicCard;
  children: React.ReactNode;
};

export default function DealerSiteChrome({
  dealer,
  children,
}: DealerSiteChromeProps) {
  const basePath = `/${dealer.companySlug}`;
  const displayName = (dealer.companyName?.trim() || dealer.name).trim();
  const slogan = dealer.companySlogan?.trim();

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white shadow-lg">
        <div className="pointer-events-none absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_20%_20%,rgba(56,189,248,0.35),transparent_45%),radial-gradient(circle_at_80%_0%,rgba(167,139,250,0.25),transparent_40%)]" />
        <div className="relative mx-auto max-w-7xl px-4 pb-6 pt-8 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start sm:justify-between">
            <Link
              href={basePath}
              className="flex shrink-0 flex-col items-center gap-3 text-center sm:items-start sm:text-left"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={dealer.companyLogoUrl ?? "/images/no-logo.svg"}
                alt={`${displayName} logo`}
                width={112}
                height={112}
                className="h-28 w-28 rounded-2xl border border-white/20 bg-white/10 object-cover shadow-md"
              />
              <div>
                <p className="text-2xl font-bold tracking-tight sm:text-3xl">
                  {displayName}
                </p>
                {slogan ? (
                  <p className="mt-2 max-w-xl text-sm text-white/85 sm:text-base">
                    {slogan}
                  </p>
                ) : null}
              </div>
            </Link>
            <div className="w-full sm:w-auto sm:min-w-[280px]">
              <DealerSiteNav basePath={basePath} />
            </div>
          </div>
          <p className="mt-4 text-center text-xs text-white/60 sm:text-right">
            Faqe publike në{" "}
            <Link href="/" className="underline underline-offset-2 hover:text-white">
              Motivo
            </Link>
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">{children}</div>
    </div>
  );
}
