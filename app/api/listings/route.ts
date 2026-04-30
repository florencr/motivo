import { Currency, FuelType, SellerType, Transmission } from "@/app/generated/prisma/enums";
import { getSessionUserFromRequest } from "@/lib/session-user";
import { prisma } from "@/lib/prisma";
import { toSlug } from "@/lib/slug";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const user = await getSessionUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const isSeller =
      user.role === "DEALER" || user.role === "PRIVATE_SELLER";
    if (!isSeller) {
      return NextResponse.json({ error: "only seller/dealer can add listings" }, { status: 403 });
    }

    const body = await req.json();
    const title = String(body?.title ?? "").trim();
    const makeId = String(body?.makeId ?? "").trim();
    const modelId = String(body?.modelId ?? "").trim();
    const year = Number(body?.year ?? 0);
    const mileageKm = Number(body?.mileageKm ?? 0);
    const price = Number(body?.price ?? 0);
    const city = body?.city ? String(body.city).trim() : null;
    const description = String(body?.description ?? "").trim();
    const ownerCount = Math.max(1, Number(body?.ownerCount ?? 1) || 1);
    const hasAccidentHistory = Boolean(body?.hasAccidentHistory);
    const damageSeverity = body?.damageSeverity ? String(body.damageSeverity).trim().toLowerCase() : null;
    const hasServiceHistory = Boolean(body?.hasServiceHistory);
    const fuelType = String(body?.fuelType ?? "PETROL");
    const transmission = String(body?.transmission ?? "MANUAL");
    const selectedFeatures = Array.isArray(body?.selectedFeatures)
      ? body.selectedFeatures.filter((value: unknown): value is string => typeof value === "string")
      : [];
    const selectedTags = Array.isArray(body?.selectedTags)
      ? body.selectedTags.filter((value: unknown): value is string => typeof value === "string")
      : [];
    const imageUrls = Array.isArray(body?.imageUrls)
      ? body.imageUrls.filter((value: unknown): value is string => typeof value === "string")
      : [];

    if (!title || !makeId || !modelId || !year || !mileageKm || !price || !description) {
      return NextResponse.json(
        { error: "title, make, model, year, mileage, price, description are required" },
        { status: 400 }
      );
    }

    const make = await prisma.make.findUnique({ where: { id: makeId } });
    const model = await prisma.model.findUnique({ where: { id: modelId } });
    if (!make || !model) {
      return NextResponse.json({ error: "invalid make/model" }, { status: 400 });
    }
    if (model.makeId !== make.id) {
      return NextResponse.json({ error: "model does not belong to selected make" }, { status: 400 });
    }

    const baseSlug = toSlug(title);
    const slug = `${baseSlug}-${Math.random().toString(36).slice(2, 7)}`;

    const sellerType =
      user.role === "DEALER" ? SellerType.DEALER : SellerType.PRIVATE;

    const listing = await prisma.listing.create({
      data: {
        title,
        slug,
        sellerId: user.id,
        makeId: make.id,
        modelId: model.id,
        makeName: make.name,
        modelName: model.name,
        year,
        mileageKm,
        price,
        currency: Currency.EUR,
        city,
        description,
        fuelType: (FuelType as Record<string, FuelType>)[fuelType] ?? FuelType.PETROL,
        transmission:
          (Transmission as Record<string, Transmission>)[transmission] ?? Transmission.MANUAL,
        ownerCount,
        hasAccidentHistory,
        damageSeverity,
        hasServiceHistory,
        sellerType,
        isPublished: true,
        features: {
          selectedFeatures,
          selectedTags,
          imageUrls,
        },
      },
    });

    return NextResponse.json({ listing });
  } catch {
    return NextResponse.json({ error: "failed to create listing" }, { status: 500 });
  }
}
