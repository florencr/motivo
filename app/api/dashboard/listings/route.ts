import { getSessionUserFromRequest } from "@/lib/session-user";
import { prisma } from "@/lib/prisma";
import { getImageUrlsFromFeatures } from "@/lib/listing-images";
import { NextResponse } from "next/server";

function isSellerRole(role: string) {
  return role === "DEALER" || role === "PRIVATE_SELLER";
}

export async function GET(req: Request) {
  const user = await getSessionUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!isSellerRole(user.role)) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const listings = await prisma.listing.findMany({
    where: { sellerId: user.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      slug: true,
      price: true,
      currency: true,
      year: true,
      mileageKm: true,
      city: true,
      isPublished: true,
      features: true,
      createdAt: true,
    },
  });

  const withImages = listings.map((item) => ({
    ...item,
    coverImageUrl: getImageUrlsFromFeatures(item.features)[0] ?? null,
  }));

  return NextResponse.json({ listings: withImages });
}

export async function PATCH(req: Request) {
  const user = await getSessionUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!isSellerRole(user.role)) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  try {
    const body = await req.json();
    const listingId = String(body?.listingId ?? "");
    const isPublished = Boolean(body?.isPublished);
    if (!listingId) {
      return NextResponse.json({ error: "listingId is required" }, { status: 400 });
    }

    const listing = await prisma.listing.findUnique({ where: { id: listingId } });
    if (!listing || listing.sellerId !== user.id) {
      return NextResponse.json({ error: "listing not found" }, { status: 404 });
    }

    const updated = await prisma.listing.update({
      where: { id: listingId },
      data: { isPublished },
      select: {
        id: true,
        title: true,
        isPublished: true,
      },
    });

    return NextResponse.json({ listing: updated });
  } catch {
    return NextResponse.json({ error: "failed to update listing" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const user = await getSessionUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!isSellerRole(user.role)) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  try {
    const body = await req.json();
    const listingId = String(body?.listingId ?? "");
    if (!listingId) {
      return NextResponse.json({ error: "listingId is required" }, { status: 400 });
    }

    const listing = await prisma.listing.findUnique({ where: { id: listingId } });
    if (!listing || listing.sellerId !== user.id) {
      return NextResponse.json({ error: "listing not found" }, { status: 404 });
    }

    await prisma.listing.delete({ where: { id: listingId } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "failed to delete listing" }, { status: 500 });
  }
}
