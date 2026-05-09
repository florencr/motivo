"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type DealerSiteNavProps = {
  basePath: string;
};

const LINKS: Array<{ href: string; label: string }> = [
  { href: "", label: "Ballina" },
  { href: "/about", label: "Rreth nesh" },
  { href: "/contact", label: "Kontakt" },
  { href: "/cars", label: "Makinat" },
];

export default function DealerSiteNav({ basePath }: DealerSiteNavProps) {
  const pathname = usePathname();
  const normalizedBase =
    basePath.endsWith("/") && basePath.length > 1
      ? basePath.slice(0, -1)
      : basePath;

  return (
    <nav
      className="flex flex-wrap items-center justify-center gap-2 border-b border-white/15 px-4 py-3 text-sm font-medium text-white/95 sm:justify-end sm:gap-4"
      aria-label="Navigimi i kompanisë"
    >
      {LINKS.map(({ href, label }) => {
        const full = href === "" ? normalizedBase : `${normalizedBase}${href}`;
        const active =
          href === ""
            ? pathname === normalizedBase || pathname === `${normalizedBase}/`
            : pathname === full || pathname.startsWith(`${full}/`);
        return (
          <Link
            key={full}
            href={full}
            className={
              active
                ? "rounded-full bg-white/20 px-3 py-1.5 ring-1 ring-white/40"
                : "rounded-full px-3 py-1.5 transition hover:bg-white/10"
            }
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
