import { createHash } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { toSlug } from "@/lib/slug";
import {
  isCurrency,
  isFuel,
  isSellerType,
  isTransmission,
} from "@/lib/imports/parsers";
import type { NormalizedListing } from "@/lib/imports/types";

const CURRENT_YEAR = new Date().getFullYear();

export type UpsertOutcome =
  | { status: "CREATED"; listingSlug: string }
  | { status: "UPDATED"; listingSlug: string }
  | { status: "SKIPPED"; reason: string }
  | { status: "FAILED"; reason: string };

function stableSlugFromExternalId(externalId: string): string {
  const h = createHash("sha256").update(externalId).digest("hex").slice(0, 24);
  return `imp-${h}`;
}

function resolveSlug(record: NormalizedListing): string {
  if (record.externalId && record.externalId.trim()) {
    return stableSlugFromExternalId(record.externalId.trim());
  }
  const base = toSlug(record.title || "listing");
  const fallback = createHash("sha256")
    .update(`${base}-${record.makeName}-${record.modelName}-${record.year}`)
    .digest("hex")
    .slice(0, 12);
  return `${base || "listing"}-${fallback}`;
}

function validateRecord(record: NormalizedListing): string | null {
  if (!record.title?.trim()) return "missing title";
  if (!record.makeName?.trim()) return "missing makeName";
  if (!record.modelName?.trim()) return "missing modelName";
  if (!Number.isFinite(record.price) || record.price <= 0) return "invalid price";
  if (
    !Number.isFinite(record.year) ||
    record.year < 1950 ||
    record.year > CURRENT_YEAR + 1
  )
    return "invalid year";
  if (!Number.isFinite(record.mileageKm) || record.mileageKm < 0)
    return "invalid mileageKm";
  if (!isFuel(record.fuelType)) return "invalid fuelType";
  if (!isTransmission(record.transmission)) return "invalid transmission";
  if (record.sellerType && !isSellerType(record.sellerType))
    return "invalid sellerType";
  if (record.currency && !isCurrency(record.currency))
    return "invalid currency";
  return null;
}

/**
 * Validate and upsert a normalized listing.
 *
 * @param defaults values applied when the connector did not specify them
 *   (sellerEmail/sellerType/currency/autoPublish).
 */
export async function upsertNormalizedListing(
  record: NormalizedListing,
  defaults: {
    sellerEmail: string;
    sellerType: "PRIVATE" | "DEALER";
    currency: "EUR" | "ALL";
    autoPublish: boolean;
  },
): Promise<UpsertOutcome> {
  const validationError = validateRecord(record);
  if (validationError) {
    return { status: "SKIPPED", reason: validationError };
  }

  const seller = await prisma.user.findFirst({
    where: { email: { equals: defaults.sellerEmail, mode: "insensitive" } },
    select: { id: true },
  });
  if (!seller) {
    return {
      status: "FAILED",
      reason: `seller email not found in database: ${defaults.sellerEmail}`,
    };
  }

  const make = await prisma.make.findFirst({
    where: { name: { equals: record.makeName.trim(), mode: "insensitive" } },
    select: { id: true, name: true },
  });
  if (!make) {
    return {
      status: "SKIPPED",
      reason: `make not in catalog: ${record.makeName}`,
    };
  }

  const model = await prisma.model.findFirst({
    where: {
      makeId: make.id,
      name: { equals: record.modelName.trim(), mode: "insensitive" },
    },
    select: { id: true, name: true },
  });
  if (!model) {
    return {
      status: "SKIPPED",
      reason: `model not in catalog for ${make.name}: ${record.modelName}`,
    };
  }

  const slug = resolveSlug(record);
  const sellerType = record.sellerType ?? defaults.sellerType;
  const currency = record.currency ?? defaults.currency;
  const featuresJson = {
    selectedFeatures: record.selectedFeatures ?? [],
    selectedTags: record.selectedTags ?? [],
    imageUrls: record.imageUrls ?? [],
  } as const;

  const data = {
    title: record.title.trim(),
    slug,
    sellerId: seller.id,
    makeId: make.id,
    modelId: model.id,
    makeName: make.name,
    modelName: model.name,
    price: record.price,
    currency,
    year: record.year,
    mileageKm: record.mileageKm,
    sellerType,
    fuelType: record.fuelType,
    transmission: record.transmission,
    description: record.description?.trim() || record.title.trim(),
    city: record.city ?? null,
    features: featuresJson,
    isPublished: defaults.autoPublish,
  };

  const existing = await prisma.listing.findUnique({
    where: { slug },
    select: { id: true },
  });

  if (existing) {
    await prisma.listing.update({
      where: { slug },
      data: {
        ...data,
      },
    });
    return { status: "UPDATED", listingSlug: slug };
  }

  await prisma.listing.create({ data });
  return { status: "CREATED", listingSlug: slug };
}
