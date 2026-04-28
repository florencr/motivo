import { prisma } from "@/lib/prisma";
import { getSessionUserFromRequest } from "@/lib/session-user";
import { toSlug } from "@/lib/slug";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const user = await getSessionUserFromRequest(req);
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const [categories, makes, models] = await Promise.all([
    prisma.vehicleCategory.findMany({ orderBy: { name: "asc" } }),
    prisma.make.findMany({ include: { category: true }, orderBy: { name: "asc" } }),
    prisma.model.findMany({ include: { make: true }, orderBy: { name: "asc" } }),
  ]);

  return NextResponse.json({ categories, makes, models });
}

export async function POST(req: Request) {
  try {
    const user = await getSessionUserFromRequest(req);
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const type = String(body?.type ?? "");
    const name = String(body?.name ?? "").trim();

    if (!type || !name) {
      return NextResponse.json({ error: "type and name are required" }, { status: 400 });
    }

    const slug = toSlug(name);
    if (!slug) {
      return NextResponse.json({ error: "invalid name" }, { status: 400 });
    }

    if (type === "category") {
      const category = await prisma.vehicleCategory.create({
        data: { name, slug },
      });
      return NextResponse.json({ category });
    }

    if (type === "make") {
      const categoryId = body?.categoryId ? String(body.categoryId) : null;
      const make = await prisma.make.create({
        data: { name, slug, categoryId },
      });
      return NextResponse.json({ make });
    }

    if (type === "model") {
      const makeId = String(body?.makeId ?? "");
      if (!makeId) {
        return NextResponse.json({ error: "makeId is required for model" }, { status: 400 });
      }
      const make = await prisma.make.findUnique({ where: { id: makeId } });
      if (!make) {
        return NextResponse.json({ error: "make not found" }, { status: 404 });
      }
      const model = await prisma.model.create({
        data: {
          name,
          slug,
          makeId,
        },
      });
      return NextResponse.json({ model });
    }

    return NextResponse.json({ error: "unsupported type" }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "failed to save catalog item" }, { status: 500 });
  }
}
