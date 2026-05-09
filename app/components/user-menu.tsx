"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronDown,
  LogOut,
  Plus,
  Settings,
  ShieldCheck,
  ListChecks,
  Building2,
  User as UserIcon,
} from "lucide-react";

export type UserMenuUser = {
  id: string;
  name: string;
  email: string;
  role: "BUYER" | "PRIVATE_SELLER" | "DEALER" | "ADMIN";
  avatarUrl?: string | null;
};

const ROLE_LABEL: Record<UserMenuUser["role"], string> = {
  BUYER: "Blerës",
  PRIVATE_SELLER: "Shitës privat",
  DEALER: "Koncesionar",
  ADMIN: "Administrator",
};

function initialsOf(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function UserMenu({ user }: { user: UserMenuUser }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (!wrapperRef.current) return;
      if (!wrapperRef.current.contains(e.target as Node)) setOpen(false);
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/");
      router.refresh();
    } finally {
      setLoggingOut(false);
      setOpen(false);
    }
  }

  const firstName = user.name.split(/\s+/)[0] || user.name;

  return (
    <div className="relative" ref={wrapperRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-300 px-2 text-sm font-medium text-slate-700 transition hover:border-slate-500 hover:bg-slate-100"
      >
        {user.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={user.avatarUrl}
            alt=""
            className="h-7 w-7 rounded-full object-cover"
          />
        ) : (
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white">
            {initialsOf(user.name)}
          </span>
        )}
        <span className="hidden max-w-[120px] truncate sm:inline">
          {firstName}
        </span>
        <ChevronDown className="h-4 w-4 text-slate-500" />
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-64 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg"
        >
          <div className="border-b border-slate-100 px-4 py-3">
            <p className="text-sm font-semibold text-slate-900">{user.name}</p>
            <p className="mt-0.5 truncate text-xs text-slate-500">
              {user.email}
            </p>
            <p className="mt-1 inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
              {ROLE_LABEL[user.role]}
            </p>
          </div>

          <div className="py-1 text-sm">
            <MenuLink
              href="/dashboard/profile"
              icon={<UserIcon className="h-4 w-4" />}
              onClick={() => setOpen(false)}
            >
              Profili im
            </MenuLink>
            {user.role === "DEALER" ? (
              <MenuLink
                href="/dashboard/company"
                icon={<Building2 className="h-4 w-4" />}
                onClick={() => setOpen(false)}
              >
                Profili i kompanisë
              </MenuLink>
            ) : null}
            <MenuLink
              href="/dashboard/listings"
              icon={<ListChecks className="h-4 w-4" />}
              onClick={() => setOpen(false)}
            >
              Listimet e mia
            </MenuLink>
            <MenuLink
              href="/dashboard/sell"
              icon={<Plus className="h-4 w-4" />}
              onClick={() => setOpen(false)}
            >
              Shto mjet
            </MenuLink>
            {user.role === "ADMIN" ? (
              <MenuLink
                href="/admin"
                icon={<ShieldCheck className="h-4 w-4" />}
                onClick={() => setOpen(false)}
              >
                Paneli i administrimit
              </MenuLink>
            ) : null}
          </div>

          <div className="border-t border-slate-100 py-1">
            <button
              type="button"
              role="menuitem"
              onClick={handleLogout}
              disabled={loggingOut}
              className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
            >
              <LogOut className="h-4 w-4 text-slate-500" />
              {loggingOut ? "Po del..." : "Dil"}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function MenuLink({
  href,
  icon,
  children,
  onClick,
}: {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <a
      href={href}
      role="menuitem"
      onClick={onClick}
      className="flex items-center gap-3 px-4 py-2 text-slate-700 transition hover:bg-slate-50"
    >
      <span className="text-slate-500">{icon}</span>
      <span>{children}</span>
    </a>
  );
}
