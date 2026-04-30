import { prisma } from "@/lib/prisma";

export type CatalogOptions = {
  /** Filter makes (and models under those makes) by vehicle type slug, e.g. `cars`. */
  vehicleTypeSlug?: string | null;
  vehicleTypeId?: string | null;
};

export async function getVehicleTypes() {
  try {
    return await prisma.vehicleType.findMany({ orderBy: { sortOrder: "asc" } });
  } catch {
    return [];
  }
}

export type PopularMakeFromListings = {
  id: string;
  name: string;
  vehicleTypeSlug: string;
  publishedListingCount: number;
};

export type TopRatedSeller = {
  id: string;
  name: string;
  companyName: string | null;
  role: "DEALER" | "PRIVATE_SELLER";
  dealerRating: number;
  dealerReviewCount: number;
};

/** Makes with the most published listings (for homepage “Popular makes”). */
export async function getPopularMakesFromListings(limit = 8): Promise<PopularMakeFromListings[]> {
  try {
    const grouped = await prisma.listing.groupBy({
      by: ["makeId"],
      where: { isPublished: true },
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: limit,
    });
    if (grouped.length === 0) return [];

    const makeIds = grouped.map((g) => g.makeId);
    const makes = await prisma.make.findMany({
      where: { id: { in: makeIds } },
      select: {
        id: true,
        name: true,
        vehicleType: { select: { slug: true } },
      },
    });
    const makeById = new Map(makes.map((m) => [m.id, m]));

    return grouped
      .map((g) => {
        const m = makeById.get(g.makeId);
        if (!m) return null;
        return {
          id: m.id,
          name: m.name,
          vehicleTypeSlug: m.vehicleType.slug,
          publishedListingCount: g._count.id,
        };
      })
      .filter((row): row is PopularMakeFromListings => row != null);
  } catch {
    return [];
  }
}

export async function getTopRatedSellers(limit = 5): Promise<TopRatedSeller[]> {
  try {
    const users = await prisma.user.findMany({
      where: {
        role: { in: ["DEALER", "PRIVATE_SELLER"] },
        isActive: true,
        dealerRating: { not: null, gt: 0 },
      },
      orderBy: [{ dealerRating: "desc" }, { dealerReviewCount: "desc" }],
      take: limit,
      select: {
        id: true,
        name: true,
        companyName: true,
        role: true,
        dealerRating: true,
        dealerReviewCount: true,
      },
    });

    return users.map((u) => ({
      id: u.id,
      name: u.name,
      companyName: u.companyName,
      role: u.role as "DEALER" | "PRIVATE_SELLER",
      dealerRating: Number(u.dealerRating ?? 0),
      dealerReviewCount: u.dealerReviewCount,
    }));
  } catch {
    return [];
  }
}

export async function getVehicleSegmentsForTypeSlug(slug: string) {
  const s = slug.trim();
  if (!s) return [];
  try {
    const vt = await prisma.vehicleType.findUnique({ where: { slug: s } });
    if (!vt) return [];
    return await prisma.vehicleSegment.findMany({
      where: { vehicleTypeId: vt.id },
      orderBy: { sortOrder: "asc" },
    });
  } catch {
    return [];
  }
}

export async function getCatalogData(options?: CatalogOptions) {
  const slug = options?.vehicleTypeSlug?.trim();
  const typeIdOpt = options?.vehicleTypeId?.trim();

  try {
    let vehicleTypeId: string | undefined;
    if (typeIdOpt) {
      vehicleTypeId = typeIdOpt;
    } else if (slug) {
      const vt = await prisma.vehicleType.findUnique({ where: { slug } });
      vehicleTypeId = vt?.id;
    }

    const makeWhere = vehicleTypeId ? { vehicleTypeId } : {};

    const [vehicleTypes, vehicleSegments, makes, models] = await Promise.all([
      prisma.vehicleType.findMany({ orderBy: { sortOrder: "asc" } }),
      prisma.vehicleSegment.findMany({
        include: { vehicleType: true },
        orderBy: [{ vehicleType: { sortOrder: "asc" } }, { sortOrder: "asc" }],
      }),
      prisma.make.findMany({
        where: makeWhere,
        include: { vehicleType: true, segment: true },
        orderBy: { name: "asc" },
      }),
      prisma.model.findMany({
        include: { make: { include: { vehicleType: true, segment: true } } },
        orderBy: { name: "asc" },
      }),
    ]);

    const makeIds = new Set(makes.map((m) => m.id));
    const modelsFiltered = vehicleTypeId
      ? models.filter((mod) => makeIds.has(mod.makeId))
      : models;

    return {
      vehicleTypes,
      vehicleSegments,
      makes,
      models: modelsFiltered,
    };
  } catch {
    return { vehicleTypes: [], vehicleSegments: [], makes: [], models: [] };
  }
}
