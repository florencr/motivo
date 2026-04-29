import { prisma } from "@/lib/prisma";
import { getSessionUserFromRequest } from "@/lib/session-user";
import { toSlug } from "@/lib/slug";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const user = await getSessionUserFromRequest(req);
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const [vehicleTypes, vehicleSegments, makes, models] = await Promise.all([
    prisma.vehicleType.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.vehicleSegment.findMany({
      include: { vehicleType: true },
      orderBy: [{ vehicleType: { sortOrder: "asc" } }, { sortOrder: "asc" }],
    }),
    prisma.make.findMany({
      include: { vehicleType: true, segment: true },
      orderBy: { name: "asc" },
    }),
    prisma.model.findMany({ include: { make: true }, orderBy: { name: "asc" } }),
  ]);

  return NextResponse.json({ vehicleTypes, vehicleSegments, makes, models });
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

    if (!type) {
      return NextResponse.json({ error: "type is required" }, { status: 400 });
    }

    if (type === "vehicleType") {
      if (!name) {
        return NextResponse.json({ error: "name is required" }, { status: 400 });
      }
      const slug = toSlug(name);
      if (!slug) {
        return NextResponse.json({ error: "invalid name" }, { status: 400 });
      }
      const sortOrder = Number(body?.sortOrder ?? 0) || 0;
      const vehicleType = await prisma.vehicleType.create({
        data: { name, slug, sortOrder },
      });
      return NextResponse.json({ vehicleType });
    }

    if (type === "segment") {
      if (!name) {
        return NextResponse.json({ error: "name is required" }, { status: 400 });
      }
      const vehicleTypeId = String(body?.vehicleTypeId ?? "").trim();
      if (!vehicleTypeId) {
        return NextResponse.json({ error: "vehicleTypeId is required" }, { status: 400 });
      }
      const slug = toSlug(name);
      if (!slug) {
        return NextResponse.json({ error: "invalid name" }, { status: 400 });
      }
      const sortOrder = Number(body?.sortOrder ?? 0) || 0;
      const segment = await prisma.vehicleSegment.create({
        data: { name, slug, sortOrder, vehicleTypeId },
      });
      return NextResponse.json({ segment });
    }

    if (type === "make") {
      if (!name) {
        return NextResponse.json({ error: "name is required" }, { status: 400 });
      }
      const slug = toSlug(name);
      if (!slug) {
        return NextResponse.json({ error: "invalid name" }, { status: 400 });
      }
      const vehicleTypeId = String(body?.vehicleTypeId ?? "").trim();
      if (!vehicleTypeId) {
        return NextResponse.json({ error: "vehicleTypeId is required" }, { status: 400 });
      }
      const segmentId = body?.segmentId ? String(body.segmentId).trim() : null;
      const make = await prisma.make.create({
        data: {
          name,
          slug,
          vehicleTypeId,
          segmentId: segmentId || null,
        },
      });
      return NextResponse.json({ make });
    }

    if (type === "model") {
      if (!name) {
        return NextResponse.json({ error: "name is required" }, { status: 400 });
      }
      const slug = toSlug(name);
      if (!slug) {
        return NextResponse.json({ error: "invalid name" }, { status: 400 });
      }
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

export async function PATCH(req: Request) {
  try {
    const user = await getSessionUserFromRequest(req);
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const entity = String(body?.entity ?? "");
    const id = String(body?.id ?? "").trim();
    if (!entity || !id) {
      return NextResponse.json({ error: "entity and id are required" }, { status: 400 });
    }

    if (entity === "vehicleType") {
      const name = body?.name != null ? String(body.name).trim() : undefined;
      const sortOrder = body?.sortOrder != null ? Number(body.sortOrder) : undefined;
      const data: { name?: string; slug?: string; sortOrder?: number } = {};
      if (name !== undefined) {
        if (!name) return NextResponse.json({ error: "invalid name" }, { status: 400 });
        data.name = name;
        const slug = toSlug(name);
        if (!slug) return NextResponse.json({ error: "invalid name" }, { status: 400 });
        data.slug = slug;
      }
      if (sortOrder !== undefined && !Number.isNaN(sortOrder)) {
        data.sortOrder = sortOrder;
      }
      if (Object.keys(data).length === 0) {
        return NextResponse.json({ error: "nothing to update" }, { status: 400 });
      }
      const vehicleType = await prisma.vehicleType.update({ where: { id }, data });
      return NextResponse.json({ vehicleType });
    }

    if (entity === "segment") {
      const name = body?.name != null ? String(body.name).trim() : undefined;
      const sortOrder = body?.sortOrder != null ? Number(body.sortOrder) : undefined;
      const vehicleTypeId = body?.vehicleTypeId != null ? String(body.vehicleTypeId).trim() : undefined;
      const data: {
        name?: string;
        slug?: string;
        sortOrder?: number;
        vehicleTypeId?: string;
      } = {};
      if (name !== undefined) {
        if (!name) return NextResponse.json({ error: "invalid name" }, { status: 400 });
        data.name = name;
        const slug = toSlug(name);
        if (!slug) return NextResponse.json({ error: "invalid name" }, { status: 400 });
        data.slug = slug;
      }
      if (sortOrder !== undefined && !Number.isNaN(sortOrder)) {
        data.sortOrder = sortOrder;
      }
      if (vehicleTypeId !== undefined) {
        if (!vehicleTypeId) return NextResponse.json({ error: "invalid vehicleTypeId" }, { status: 400 });
        data.vehicleTypeId = vehicleTypeId;
      }
      if (Object.keys(data).length === 0) {
        return NextResponse.json({ error: "nothing to update" }, { status: 400 });
      }
      const segment = await prisma.vehicleSegment.update({ where: { id }, data });
      return NextResponse.json({ segment });
    }

    if (entity === "make") {
      const name = body?.name != null ? String(body.name).trim() : undefined;
      const vehicleTypeId = body?.vehicleTypeId != null ? String(body.vehicleTypeId).trim() : undefined;
      const segmentId =
        body?.segmentId === "" || body?.segmentId === null
          ? null
          : body?.segmentId != null
            ? String(body.segmentId).trim()
            : undefined;
      const data: {
        name?: string;
        slug?: string;
        vehicleTypeId?: string;
        segmentId?: string | null;
      } = {};
      if (name !== undefined) {
        if (!name) return NextResponse.json({ error: "invalid name" }, { status: 400 });
        data.name = name;
        data.slug = toSlug(name);
        if (!data.slug) return NextResponse.json({ error: "invalid name" }, { status: 400 });
      }
      if (vehicleTypeId !== undefined) {
        if (!vehicleTypeId) return NextResponse.json({ error: "invalid vehicleTypeId" }, { status: 400 });
        data.vehicleTypeId = vehicleTypeId;
      }
      if (segmentId !== undefined) {
        data.segmentId = segmentId;
      }
      if (Object.keys(data).length === 0) {
        return NextResponse.json({ error: "nothing to update" }, { status: 400 });
      }
      const make = await prisma.make.update({ where: { id }, data });
      return NextResponse.json({ make });
    }

    if (entity === "model") {
      const name = body?.name != null ? String(body.name).trim() : undefined;
      const makeId = body?.makeId != null ? String(body.makeId).trim() : undefined;
      const data: { name?: string; slug?: string; makeId?: string } = {};
      if (name !== undefined) {
        if (!name) return NextResponse.json({ error: "invalid name" }, { status: 400 });
        data.name = name;
        data.slug = toSlug(name);
        if (!data.slug) return NextResponse.json({ error: "invalid name" }, { status: 400 });
      }
      if (makeId !== undefined) {
        if (!makeId) return NextResponse.json({ error: "invalid makeId" }, { status: 400 });
        data.makeId = makeId;
      }
      if (Object.keys(data).length === 0) {
        return NextResponse.json({ error: "nothing to update" }, { status: 400 });
      }
      const model = await prisma.model.update({ where: { id }, data });
      return NextResponse.json({ model });
    }

    return NextResponse.json({ error: "unsupported entity" }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "failed to update catalog item" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const user = await getSessionUserFromRequest(req);
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }

    const url = new URL(req.url);
    const entity = String(url.searchParams.get("entity") ?? "");
    const id = String(url.searchParams.get("id") ?? "").trim();
    if (!entity || !id) {
      return NextResponse.json({ error: "entity and id query params are required" }, { status: 400 });
    }

    if (entity === "vehicleType") {
      const count = await prisma.make.count({ where: { vehicleTypeId: id } });
      if (count > 0) {
        return NextResponse.json(
          { error: "Cannot delete: there are makes linked to this vehicle type. Reassign or delete them first." },
          { status: 400 },
        );
      }
      await prisma.vehicleType.delete({ where: { id } });
      return NextResponse.json({ ok: true });
    }

    if (entity === "segment") {
      await prisma.vehicleSegment.delete({ where: { id } });
      return NextResponse.json({ ok: true });
    }

    if (entity === "make") {
      const listingCount = await prisma.listing.count({ where: { makeId: id } });
      if (listingCount > 0) {
        return NextResponse.json(
          { error: "Cannot delete: listings use this make." },
          { status: 400 },
        );
      }
      await prisma.model.deleteMany({ where: { makeId: id } });
      await prisma.make.delete({ where: { id } });
      return NextResponse.json({ ok: true });
    }

    if (entity === "model") {
      const listingCount = await prisma.listing.count({ where: { modelId: id } });
      if (listingCount > 0) {
        return NextResponse.json(
          { error: "Cannot delete: listings use this model." },
          { status: 400 },
        );
      }
      await prisma.model.delete({ where: { id } });
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "unsupported entity" }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "failed to delete catalog item" }, { status: 500 });
  }
}
