import { prisma } from "@/lib/prisma";

export async function getHomeStats() {
  try {
    const [listings, sellers, dealers] = await Promise.all([
      prisma.listing.count({ where: { isPublished: true } }),
      prisma.user.count({ where: { role: { in: ["DEALER", "PRIVATE_SELLER"] }, isActive: true } }),
      prisma.user.count({ where: { role: "DEALER", isActive: true } }),
    ]);
    return { listings, sellers, dealers };
  } catch {
    return { listings: 0, sellers: 0, dealers: 0 };
  }
}

export async function getActiveListingTagOptions() {
  try {
    const rows = await prisma.listingTagOption.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { name: true },
    });
    return rows.map((r) => r.name);
  } catch {
    return [];
  }
}

export async function getActiveListingFeatureOptions() {
  try {
    const rows = await prisma.listingFeatureOption.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { name: true },
    });
    return rows.map((r) => r.name);
  } catch {
    return [];
  }
}

export async function getCityOptionsFromListings() {
  try {
    const rows = await prisma.listing.findMany({
      where: { isPublished: true, city: { not: null } },
      select: { city: true },
      distinct: ["city"],
      orderBy: { city: "asc" },
    });
    return rows.map((r) => r.city).filter((c): c is string => Boolean(c && c.trim().length > 0));
  } catch {
    return [];
  }
}
