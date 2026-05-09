import { getCurrentUser } from "@/lib/session-user";
import UserMenu from "./user-menu";

export default async function SiteHeader() {
  const user = await getCurrentUser();

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <a href="/" className="inline-flex items-center gap-1 text-slate-900">
          <span className="inline-flex h-11 w-11 items-center justify-center">
            <svg
              viewBox="0 0 24 24"
              className="h-8 w-8"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.9"
            >
              <path d="M5 10.5 6.7 7.8C7.2 6.9 8.1 6.3 9.1 6.3h5.8c1 0 1.9.6 2.4 1.5l1.7 2.7" />
              <path d="M4.5 10.5h15a1.5 1.5 0 0 1 1.5 1.5v4.2a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 16.2V12a1.5 1.5 0 0 1 1.5-1.5Z" />
              <circle cx="7.5" cy="14.2" r="1.1" />
              <circle cx="16.5" cy="14.2" r="1.1" />
              <path d="M9.5 14.2h5" />
            </svg>
          </span>
          <span className="text-2xl font-bold tracking-tight">Motivo</span>
        </a>

        <nav className="hidden items-center gap-5 text-sm font-medium text-slate-700 md:flex">
          <a href="/" className="transition hover:text-slate-900">
            Kreu
          </a>
          <a href="/automjetet" className="transition hover:text-slate-900">
            Automjetet
          </a>
          <a href="/dealers" className="transition hover:text-slate-900">
            Koncesionarët
          </a>
        </nav>

        <div className="flex items-center gap-2">
          <a
            href="/dashboard/sell"
            className="inline-flex h-9 items-center justify-center rounded-lg bg-slate-900 px-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            + Shto mjet
          </a>
          {user ? (
            <UserMenu
              user={{
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                avatarUrl: user.avatarUrl ?? null,
              }}
            />
          ) : (
            <a
              href="/login"
              aria-label="Identifikohu"
              className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-300 px-3 text-sm font-medium text-slate-700 transition hover:border-slate-500 hover:bg-slate-100"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
                <circle cx="12" cy="8" r="3.2" />
                <path d="M5 19c1.3-3 3.8-4.5 7-4.5s5.7 1.5 7 4.5" />
              </svg>
              <span className="hidden sm:inline">Identifikohu</span>
            </a>
          )}
          <a
            href="#"
            aria-label="Të preferuarat"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 text-slate-700 transition hover:border-slate-500 hover:bg-slate-100"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M12 20 4.5 13.3a4.7 4.7 0 0 1 6.6-6.7L12 7.5l.9-.9a4.7 4.7 0 0 1 6.6 6.7Z" />
            </svg>
          </a>
          <a
            href="#"
            aria-label="Krahasimi"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 text-slate-700 transition hover:border-slate-500 hover:bg-slate-100"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M4 8h8M12 16h8M10 5l2 3-2 3M14 13l-2 3 2 3" />
            </svg>
          </a>
        </div>
      </div>
    </header>
  );
}
