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

  let seller = await prisma.user.findFirst({
    where: { email: { equals: defaults.sellerEmail, mode: "insensitive" } },
    select: { id: true },
  });
  if (!seller) {
    const trimmedEmail = defaults.sellerEmail.trim();
    if (!trimmedEmail || !trimmedEmail.includes("@")) {
      return {
        status: "FAILED",
        reason: `invalid seller email: ${defaults.sellerEmail}`,
      };
    }
    try {
      const created = await prisma.user.create({
        data: {
          email: trimmedEmail,
          name: trimmedEmail.split("@")[0] || trimmedEmail,
          role: defaults.sellerType === "DEALER" ? "DEALER" : "PRIVATE_SELLER",
          sellerType: defaults.sellerType,
          isActive: true,
          isVerified: false,
        },
        select: { id: true },
      });
      seller = created;
    } catch (err) {
      return {
        status: "FAILED",
        reason: `could not create seller ${trimmedEmail}: ${(err as Error).message}`,
      };
    }
  }

  const trimmedMakeName = record.makeName.trim();
  let make = await prisma.make.findFirst({
    where: { name: { equals: trimmedMakeName, mode: "insensitive" } },
    select: { id: true, name: true },
  });
  if (!make) {
    const defaultType = await prisma.vehicleType.findFirst({
      where: { slug: "makina" },
      select: { id: true },
    });
    if (!defaultType) {
      return {
        status: "SKIPPED",
        reason: `make not in catalog: ${trimmedMakeName} (no 'makina' vehicle type to attach to)`,
      };
    }
    try {
      const baseSlug = toSlug(trimmedMakeName) || "make";
      let slug = baseSlug;
      let suffix = 2;
      while (
        await prisma.make.findFirst({
          where: { vehicleTypeId: defaultType.id, slug },
          select: { id: true },
        })
      ) {
        slug = `${baseSlug}-${suffix++}`;
      }
      make = await prisma.make.create({
        data: { name: trimmedMakeName, slug, vehicleTypeId: defaultType.id },
        select: { id: true, name: true },
      });
    } catch (err) {
      return {
        status: "SKIPPED",
        reason: `could not create make ${trimmedMakeName}: ${(err as Error).message}`,
      };
    }
  }

  const trimmedModelName = record.modelName.trim();
  let model = await prisma.model.findFirst({
    where: {
      makeId: make.id,
      name: { equals: trimmedModelName, mode: "insensitive" },
    },
    select: { id: true, name: true },
  });
  if (!model) {
    try {
      const baseSlug = toSlug(trimmedModelName) || "model";
      let slug = baseSlug;
      let suffix = 2;
      while (
        await prisma.model.findFirst({
          where: { makeId: make.id, slug },
          select: { id: true },
        })
      ) {
        slug = `${baseSlug}-${suffix++}`;
      }
      model = await prisma.model.create({
        data: { name: trimmedModelName, slug, makeId: make.id },
        select: { id: true, name: true },
      });
    } catch (err) {
      return {
        status: "SKIPPED",
        reason: `could not create model ${trimmedModelName} for ${make.name}: ${(err as Error).message}`,
      };
    }
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
    engineCapacity:
      Number.isFinite(record.engineCapacity) && (record.engineCapacity ?? 0) > 0
        ? Math.round(record.engineCapacity ?? 0)
        : null,
    powerHp:
      Number.isFinite(record.powerHp) && (record.powerHp ?? 0) > 0
        ? Math.round(record.powerHp ?? 0)
        : null,
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
