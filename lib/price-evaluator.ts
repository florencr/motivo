type ComparableListing = {
  id: string;
  price: number;
  year: number;
  mileageKm: number;
  powerHp: number | null;
  ownerCount: number;
  hasAccidentHistory: boolean;
  damageSeverity: string | null;
  hasServiceHistory: boolean;
  modelId: string;
  makeId: string;
  features: unknown;
};

type PriceEvaluation = {
  expectedPrice: number;
  deltaRatio: number;
  priceValue: number;
  label: "Good Price" | "Fair Price" | "High Price";
};

function toArray(value: unknown): string[] {
  if (!value || typeof value !== "object") return [];
  const raw = (value as Record<string, unknown>).selectedFeatures;
  if (!Array.isArray(raw)) return [];
  return raw.filter((item): item is string => typeof item === "string");
}

function median(values: number[]) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

function getDamagePenalty(severity: string | null) {
  const s = String(severity ?? "").toLowerCase();
  if (s === "major") return 0.15;
  if (s === "minor") return 0.06;
  return 0;
}

export function evaluateListingPrice(
  listing: ComparableListing,
  pool: ComparableListing[],
): PriceEvaluation {
  const comparablesBase = pool.filter((x) => x.id !== listing.id && x.modelId === listing.modelId);
  const comparables =
    comparablesBase.length >= 2
      ? comparablesBase
      : pool.filter((x) => x.id !== listing.id && x.makeId === listing.makeId);

  if (comparables.length === 0) {
    return { expectedPrice: listing.price, deltaRatio: 0, priceValue: 3, label: "Fair Price" };
  }

  const basePrice = median(comparables.map((c) => c.price));
  const medianYear = median(comparables.map((c) => c.year));
  const medianMileage = median(comparables.map((c) => c.mileageKm));
  const medianPower = median(comparables.map((c) => c.powerHp ?? 0));
  const medianFeatures = median(comparables.map((c) => toArray(c.features).length));

  let expected = basePrice;

  expected *= 1 + (listing.year - medianYear) * 0.03;
  expected *= 1 - ((listing.mileageKm - medianMileage) / 10000) * 0.012;
  expected *= 1 + ((listing.powerHp ?? 0) - medianPower) * 0.0015;

  if (listing.ownerCount > 1) {
    expected *= 1 - Math.min(0.12, (listing.ownerCount - 1) * 0.02);
  }
  if (listing.hasAccidentHistory) {
    expected *= 0.9;
  }
  expected *= 1 - getDamagePenalty(listing.damageSeverity);
  if (listing.hasServiceHistory) {
    expected *= 1.03;
  }

  const featureBoost = Math.min(0.05, Math.max(-0.05, (toArray(listing.features).length - medianFeatures) * 0.006));
  expected *= 1 + featureBoost;

  const expectedPrice = Math.max(1000, expected);
  const deltaRatio = (listing.price - expectedPrice) / expectedPrice;

  if (deltaRatio <= -0.1) {
    return { expectedPrice, deltaRatio, priceValue: 5, label: "Good Price" };
  }
  if (deltaRatio <= -0.03) {
    return { expectedPrice, deltaRatio, priceValue: 4, label: "Good Price" };
  }
  if (deltaRatio < 0.08) {
    return { expectedPrice, deltaRatio, priceValue: 3, label: "Fair Price" };
  }
  if (deltaRatio < 0.16) {
    return { expectedPrice, deltaRatio, priceValue: 2, label: "High Price" };
  }
  return { expectedPrice, deltaRatio, priceValue: 1, label: "High Price" };
}
