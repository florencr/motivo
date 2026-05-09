import { VEHICLE_TYPE_PAGES } from "@/lib/vehicle-type-pages";

/** Single-path segments that cannot be used as a dealer `companySlug`. */
const EXTRA_RESERVED = new Set([
  "admin",
  "api",
  "automjetet",
  "cars",
  "dashboard",
  "dealers",
  "info",
  "login",
  "register",
  "sell",
  "_next",
  "favicon",
  "robots",
  "sitemap",
]);

export function getReservedUrlSlugSet(): ReadonlySet<string> {
  const merged = new Set<string>(EXTRA_RESERVED);
  for (const key of Object.keys(VEHICLE_TYPE_PAGES)) {
    merged.add(key.toLowerCase());
  }
  return merged;
}

const RESERVED = getReservedUrlSlugSet();

/** Normalize dealer slug for storage and URLs (unique, case-insensitive matching). */
export function normalizeCompanySlug(raw: string): string {
  return raw.trim().toLowerCase();
}

export function validateCompanySlug(raw: string): { ok: true; slug: string } | { ok: false; error: string } {
  const slug = normalizeCompanySlug(raw);
  if (slug.length < 2) {
    return { ok: false, error: "Slug-i duhet të ketë të paktën 2 karaktere." };
  }
  if (slug.length > 48) {
    return { ok: false, error: "Slug-i është shumë i gjatë (maks. 48)." };
  }
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    return {
      ok: false,
      error:
        "Lejohen vetëm shkronja, numra dhe vizatimëza (-), pa hapësira.",
    };
  }
  if (RESERVED.has(slug.toLowerCase())) {
    return { ok: false, error: "Ky adresë është e rezervuar; zgjidh një tjetër." };
  }
  return { ok: true, slug };
}
