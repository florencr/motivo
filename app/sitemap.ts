import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@/app/generated/prisma/enums";

const SITE_URL = "https://motivo.autos";

const VEHICLE_TYPE_PATHS = ["/makina", "/motocikleta", "/furgona", "/varka", "/kamione"];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/dealers`, lastModified: now, changeFrequency: "daily", priority: 0.7 },
    ...VEHICLE_TYPE_PATHS.map((path) => ({
      url: `${SITE_URL}${path}`,
      lastModified: now,
      changeFrequency: "daily" as const,
      priority: 0.9,
    })),
  ];

  let listingEntries: MetadataRoute.Sitemap = [];
  let dealerEntries: MetadataRoute.Sitemap = [];
  let infoEntries: MetadataRoute.Sitemap = [];

  try {
    const listings = await prisma.listing.findMany({
      where: { isPublished: true },
      select: { id: true, slug: true, updatedAt: true },
    });
    listingEntries = listings.map((listing) => ({
      url: `${SITE_URL}/makina/${listing.slug || listing.id}`,
      lastModified: listing.updatedAt,
      changeFrequency: "weekly",
      priority: 0.7,
    }));
  } catch (err) {
    console.error("[sitemap] failed to load listings:", err);
  }

  try {
    const dealers = await prisma.user.findMany({
      where: { role: UserRole.DEALER, isActive: true },
      select: { id: true, updatedAt: true },
    });
    dealerEntries = dealers.map((dealer) => ({
      url: `${SITE_URL}/dealers/${dealer.id}`,
      lastModified: dealer.updatedAt,
      changeFrequency: "weekly",
      priority: 0.5,
    }));
  } catch (err) {
    console.error("[sitemap] failed to load dealers:", err);
  }

  try {
    const pages = await prisma.footerPage.findMany({
      where: { isPublished: true },
      select: { slug: true, updatedAt: true },
    });
    infoEntries = pages.map((page) => ({
      url: `${SITE_URL}/info/${page.slug}`,
      lastModified: page.updatedAt,
      changeFrequency: "monthly",
      priority: 0.4,
    }));
  } catch (err) {
    console.error("[sitemap] failed to load info pages:", err);
  }

  return [...staticEntries, ...listingEntries, ...dealerEntries, ...infoEntries];
}
