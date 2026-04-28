import { prisma } from "@/lib/prisma";

type CategoryItem = { id: string; name: string; slug: string };
type MakeItem = { id: string; name: string; slug: string };
type ModelItem = { id: string; name: string; slug: string; make: { name: string } };

export async function getCatalogData() {
  const prismaAny = prisma as unknown as {
    vehicleCategory?: { findMany: (args: unknown) => Promise<CategoryItem[]> };
    make: { findMany: (args: unknown) => Promise<MakeItem[]> };
    model: { findMany: (args: unknown) => Promise<ModelItem[]> };
  };

  try {
    const [vehicleCategories, makes, models] = await Promise.all([
      prismaAny.vehicleCategory
        ? prismaAny.vehicleCategory.findMany({ orderBy: { name: "asc" } })
        : Promise.resolve([]),
      prismaAny.make.findMany({ orderBy: { name: "asc" } }),
      prismaAny.model.findMany({ include: { make: true }, orderBy: { name: "asc" } }),
    ]);

    return { vehicleCategories, makes, models };
  } catch {
    return { vehicleCategories: [], makes: [], models: [] };
  }
}
