"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type DashboardSidebarProps = {
  showCompany: boolean;
};

export default function DashboardSidebar({ showCompany }: DashboardSidebarProps) {
  const pathname = usePathname();

  const menu = [
    { href: "/dashboard/profile", label: "Profili i llogarisë" },
    ...(showCompany
      ? [{ href: "/dashboard/company", label: "Profili i kompanisë" }]
      : []),
    { href: "/dashboard/listings", label: "Listimet e mia" },
    { href: "/dashboard/sell", label: "Shto mjet" },
  ];

  return (
    <aside className="w-64 shrink-0 bg-slate-900 text-slate-100">
      <div className="border-b border-slate-700 px-4 py-4">
        <p className="text-xs uppercase tracking-wider text-slate-300">Motivo</p>
        <h2 className="mt-1 text-lg font-semibold">Zona e shitësit</h2>
      </div>

      <nav className="px-2 py-3">
        {menu.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`mb-1 block rounded-md px-3 py-2 text-sm ${
                active
                  ? "bg-slate-100 text-slate-900"
                  : "text-slate-100 hover:bg-slate-800"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
