import { getSessionUserFromRequest } from "@/lib/session-user";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

function isSellerRole(role: string) {
  return role === "DEALER" || role === "PRIVATE_SELLER";
}

type Params = { params: Promise<{ id: string }> };

export async function GET(req: Request, { params }: Params) {
  const user = await getSessionUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!isSellerRole(user.role)) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const { id } = await params;
  const listing = await prisma.listing.findUnique({
    where: { id },
    select: {
      id: true,
      sellerId: true,
      title: true,
      makeId: true,
      modelId: true,
      year: true,
      mileageKm: true,
      price: true,
      fuelType: true,
      transmission: true,
      city: true,
      description: true,
      isPublished: true,
    },
  });

  if (!listing || listing.sellerId !== user.id) {
    return NextResponse.json({ error: "listing not found" }, { status: 404 });
  }

  return NextResponse.json({ listing });
}

export async function PATCH(req: Request, { params }: Params) {
  const user = await getSessionUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!isSellerRole(user.role)) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const { id } = await params;
  const existing = await prisma.listing.findUnique({ where: { id } });
  if (!existing || existing.sellerId !== user.id) {
    return NextResponse.json({ error: "listing not found" }, { status: 404 });
  }

  try {
    const body = await req.json();
    const title = String(body?.title ?? "").trim();
    const year = Number(body?.year ?? 0);
    const mileageKm = Number(body?.mileageKm ?? 0);
    const price = Number(body?.price ?? 0);
    const city = body?.city ? String(body.city).trim() : null;
    const description = String(body?.description ?? "").trim();
    const fuelType = String(body?.fuelType ?? "PETROL");
    const transmission = String(body?.transmission ?? "MANUAL");

    if (!title || !year || !mileageKm || !price || !description) {
      return NextResponse.json(
        { error: "title, year, mileage, price, description are required" },
        { status: 400 }
      );
    }

    const updated = await prisma.listing.update({
      where: { id },
      data: {
        title,
        year,
        mileageKm,
        price,
        city,
        description,
        fuelType: fuelType as "PETROL" | "DIESEL" | "ELECTRIC" | "HYBRID",
        transmission: transmission as "MANUAL" | "AUTOMATIC",
      },
      select: {
        id: true,
        title: true,
      },
    });

    return NextResponse.json({ listing: updated });
  } catch {
    return NextResponse.json({ error: "failed to update listing" }, { status: 500 });
  }
}
