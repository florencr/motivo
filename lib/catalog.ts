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
