import { getSessionUserFromRequest } from "@/lib/session-user";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

function isSellerRole(role: string) {
  return role === "DEALER" || role === "PRIVATE_SELLER";
}

function parseNullableBoolean(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  return Boolean(value);
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
      hasAlbanianPlates: true,
      isCustomsPaid: true,
      isTaxRefundable: true,
      engineCapacity: true,
      powerHp: true,
      features: true,
      make: { select: { vehicleTypeId: true, segmentId: true } },
    },
  });

  if (!listing || listing.sellerId !== user.id) {
    return NextResponse.json({ error: "listing not found" }, { status: 404 });
  }

  const featuresJson = (listing.features as Record<string, unknown> | null) ?? {};
  const selectedFeatures = Array.isArray(featuresJson?.selectedFeatures)
    ? (featuresJson.selectedFeatures as unknown[]).filter((v): v is string => typeof v === "string")
    : [];
  const selectedTags = Array.isArray(featuresJson?.selectedTags)
    ? (featuresJson.selectedTags as unknown[]).filter((v): v is string => typeof v === "string")
    : [];
  const imageUrls = Array.isArray(featuresJson?.imageUrls)
    ? (featuresJson.imageUrls as unknown[]).filter((v): v is string => typeof v === "string")
    : [];

  return NextResponse.json({
    listing: {
      id: listing.id,
      title: listing.title,
      makeId: listing.makeId,
      modelId: listing.modelId,
      vehicleTypeId: listing.make?.vehicleTypeId ?? "",
      segmentId: listing.make?.segmentId ?? "",
      year: listing.year,
      mileageKm: listing.mileageKm,
      price: Number(listing.price),
      fuelType: listing.fuelType,
      transmission: listing.transmission,
      city: listing.city,
      description: listing.description,
      isPublished: listing.isPublished,
      hasAlbanianPlates: listing.hasAlbanianPlates,
      isCustomsPaid: listing.isCustomsPaid,
      isTaxRefundable: listing.isTaxRefundable,
      engineCapacity: listing.engineCapacity,
      powerHp: listing.powerHp,
      selectedFeatures,
      selectedTags,
      imageUrls,
    },
  });
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
    const makeId = body?.makeId ? String(body.makeId).trim() : null;
    const modelId = body?.modelId ? String(body.modelId).trim() : null;
    const hasAlbanianPlates = parseNullableBoolean(body?.hasAlbanianPlates);
    const isCustomsPaid = parseNullableBoolean(body?.isCustomsPaid);
    const isTaxRefundable = Boolean(body?.isTaxRefundable);
    const engineCapacityRaw = Number(body?.engineCapacity ?? 0);
    const engineCapacity =
      Number.isFinite(engineCapacityRaw) && engineCapacityRaw > 0
        ? Math.round(engineCapacityRaw)
        : null;
    const powerHpRaw = Number(body?.powerHp ?? 0);
    const powerHp =
      Number.isFinite(powerHpRaw) && powerHpRaw > 0 ? Math.round(powerHpRaw) : null;
    const selectedFeatures = Array.isArray(body?.selectedFeatures)
      ? body.selectedFeatures.filter((v: unknown): v is string => typeof v === "string")
      : [];
    const selectedTags = Array.isArray(body?.selectedTags)
      ? body.selectedTags.filter((v: unknown): v is string => typeof v === "string")
      : [];
    const imageUrls = Array.isArray(body?.imageUrls)
      ? body.imageUrls.filter((v: unknown): v is string => typeof v === "string")
      : [];

    if (!title || !year || !mileageKm || !price || !description) {
      return NextResponse.json(
        { error: "title, year, mileage, price, description are required" },
        { status: 400 }
      );
    }

    const data: Record<string, unknown> = {
      title,
      year,
      mileageKm,
      price,
      city,
      description,
      fuelType: fuelType as "PETROL" | "DIESEL" | "ELECTRIC" | "HYBRID",
      transmission: transmission as "MANUAL" | "AUTOMATIC",
      hasAlbanianPlates,
      isCustomsPaid,
      isTaxRefundable,
      engineCapacity,
      powerHp,
      features: {
        selectedFeatures,
        selectedTags,
        imageUrls,
      },
    };

    if (makeId && modelId) {
      const make = await prisma.make.findUnique({ where: { id: makeId } });
      const model = await prisma.model.findUnique({ where: { id: modelId } });
      if (!make || !model) {
        return NextResponse.json({ error: "invalid make/model" }, { status: 400 });
      }
      if (model.makeId !== make.id) {
        return NextResponse.json({ error: "model does not belong to selected make" }, { status: 400 });
      }
      data.makeId = make.id;
      data.modelId = model.id;
      data.makeName = make.name;
      data.modelName = model.name;
    }

    const updated = await prisma.listing.update({
      where: { id },
      data,
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
