import type {
  Currency,
  FuelType,
  SellerType,
  Transmission,
} from "@/app/generated/prisma/enums";

const FUEL_VALUES = new Set<FuelType>(["PETROL", "DIESEL", "ELECTRIC", "HYBRID"]);
const TRANS_VALUES = new Set<Transmission>(["MANUAL", "AUTOMATIC"]);
const SELLER_VALUES = new Set<SellerType>(["PRIVATE", "DEALER"]);
const CUR_VALUES = new Set<Currency>(["EUR", "ALL"]);

export function parsePriceMajor(raw: unknown): number {
  const s = String(raw ?? "").replace(/\s/g, "");
  const cleaned = s.replace(/[^\d.,]/g, "");
  if (!cleaned) return Number.NaN;

  let normalized = cleaned;
  if (/,/.test(normalized) && /\./.test(normalized)) {
    if (normalized.lastIndexOf(",") > normalized.lastIndexOf(".")) {
      normalized = normalized.replace(/\./g, "").replace(",", ".");
    } else {
      normalized = normalized.replace(/,/g, "");
    }
  } else if (/,/.test(normalized)) {
    const parts = normalized.split(",");
    if (parts.length === 2 && parts[1].length <= 2) {
      normalized = parts.join(".");
    } else {
      normalized = normalized.replace(/,/g, "");
    }
  } else if (/\./.test(normalized)) {
    const parts = normalized.split(".");
    if (parts.length > 2) {
      // Multiple dots = thousand separators (e.g. "1.234.567").
      normalized = parts.join("");
    } else if (parts.length === 2 && parts[1].length === 3) {
      // "3.500" — European thousand separator (no decimals for car prices).
      normalized = parts.join("");
    }
  }

  const n = Number.parseFloat(normalized);
  return Number.isFinite(n) ? Math.round(n) : Number.NaN;
}

export function parseKm(raw: unknown): number {
  const digits = String(raw ?? "").replace(/[^\d]/g, "");
  const n = Number.parseInt(digits, 10);
  return Number.isFinite(n) ? n : Number.NaN;
}

export function parseYear(raw: unknown): number {
  const m = String(raw ?? "").match(/(19|20)\d{2}/);
  return m ? Number.parseInt(m[0], 10) : Number.NaN;
}

export function mapFuel(text: unknown): FuelType {
  const t = String(text ?? "").toLowerCase();
  if (t.includes("diesel") || t.includes("nafte") || t.includes("naftë")) return "DIESEL";
  if (t.includes("electric") || t.includes("elektri") || t === "ev") return "ELECTRIC";
  if (t.includes("hybrid") || t.includes("hibrid")) return "HYBRID";
  return "PETROL";
}

export function mapTransmission(text: unknown): Transmission {
  const t = String(text ?? "").toLowerCase();
  if (t.includes("manual") || t.includes("manuale")) return "MANUAL";
  return "AUTOMATIC";
}

export function isFuel(value: unknown): value is FuelType {
  return typeof value === "string" && FUEL_VALUES.has(value as FuelType);
}

export function isTransmission(value: unknown): value is Transmission {
  return typeof value === "string" && TRANS_VALUES.has(value as Transmission);
}

export function isSellerType(value: unknown): value is SellerType {
  return typeof value === "string" && SELLER_VALUES.has(value as SellerType);
}

export function isCurrency(value: unknown): value is Currency {
  return typeof value === "string" && CUR_VALUES.has(value as Currency);
}

export function absolutizeUrl(origin: string | null | undefined, href: unknown): string | null {
  if (!href) return null;
  try {
    return new URL(String(href), origin || undefined).href;
  } catch {
    return null;
  }
}

/** Best-effort split: "Audi A4 2.0 TDI" → make=Audi model="A4 2.0 TDI". */
export function guessMakeModelFromTitle(title: string): {
  makeName: string;
  modelName: string;
} {
  const words = String(title).trim().split(/\s+/).filter(Boolean);
  if (words.length < 2) return { makeName: "", modelName: "" };
  return { makeName: words[0], modelName: words.slice(1).join(" ") };
}
