"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ADMIN_MENU = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/catalog", label: "Catalog Manager" },
  { href: "/admin/footer-pages", label: "Footer Pages" },
  { href: "/admin/users", label: "User Profiles" },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 shrink-0 bg-slate-900 text-slate-100">
      <div className="border-b border-slate-700 px-4 py-4">
        <p className="text-xs uppercase tracking-wider text-slate-300">Carlist</p>
        <h2 className="mt-1 text-lg font-semibold">Admin Panel</h2>
      </div>

      <nav className="px-2 py-3">
        {ADMIN_MENU.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
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
