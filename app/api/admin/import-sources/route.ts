import { prisma } from "@/lib/prisma";
import { getSessionUserFromRequest } from "@/lib/session-user";
import { listConnectors } from "@/lib/imports/connectors";
import { NextResponse } from "next/server";

const ALLOWED_TYPES = new Set([
  "WEBSITE",
  "FACEBOOK_MARKETPLACE",
  "FACEBOOK_POST",
  "INSTAGRAM_POST",
  "MANUAL",
]);
const ALLOWED_SELLER_TYPES = new Set(["PRIVATE", "DEALER"]);
const ALLOWED_CURRENCIES = new Set(["EUR", "ALL"]);

function normalizeListUrls(input: unknown): string[] {
  const arr = Array.isArray(input)
    ? input
    : typeof input === "string"
      ? input.split(/\r?\n/)
      : [];
  return arr
    .map((entry) => (typeof entry === "string" ? entry.trim() : ""))
    .filter((url) => url.length > 0);
}

function normalizeConfig(input: unknown): Record<string, unknown> {
  if (!input) return {};
  if (typeof input === "string") {
    try {
      const parsed = JSON.parse(input);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>;
      }
    } catch {
      return {};
    }
    return {};
  }
  if (typeof input === "object" && !Array.isArray(input)) {
    return input as Record<string, unknown>;
  }
  return {};
}

export async function GET(req: Request) {
  const user = await getSessionUserFromRequest(req);
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const sources = await prisma.importSource.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { runs: true } },
    },
  });

  return NextResponse.json({
    sources,
    connectors: listConnectors().map((c) => ({ key: c.key, label: c.label })),
  });
}

export async function POST(req: Request) {
  try {
    const user = await getSessionUserFromRequest(req);
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const name = String(body?.name ?? "").trim();
    const type = String(body?.type ?? "WEBSITE");
    let connectorKey = String(body?.connectorKey ?? "generic").trim() || "generic";
    if (type === "FACEBOOK_MARKETPLACE" && connectorKey === "generic") {
      connectorKey = "facebook_marketplace";
    }
    const baseUrl = body?.baseUrl ? String(body.baseUrl).trim() : null;
    const listUrls = normalizeListUrls(body?.listUrls);
    const config = normalizeConfig(body?.config);
    const defaultSellerEmail = String(body?.defaultSellerEmail ?? "").trim();
    const defaultSellerType = String(body?.defaultSellerType ?? "DEALER");
    const defaultCurrency = String(body?.defaultCurrency ?? "EUR");
    const autoPublish = body?.autoPublish !== false;
    const requestDelayMs = Number(body?.requestDelayMs ?? 1500) || 1500;
    const maxPerRun = Number(body?.maxPerRun ?? 100) || 100;
    const cronIntervalHours = Math.max(
      1,
      Math.min(Number(body?.cronIntervalHours ?? 6) || 6, 168),
    );
    const isActive = body?.isActive !== false;

    if (!name) {
      return NextResponse.json({ error: "name is required" }, { status: 400 });
    }
    if (!ALLOWED_TYPES.has(type)) {
      return NextResponse.json({ error: "invalid type" }, { status: 400 });
    }
    if (!ALLOWED_SELLER_TYPES.has(defaultSellerType)) {
      return NextResponse.json(
        { error: "invalid defaultSellerType" },
        { status: 400 },
      );
    }
    if (!ALLOWED_CURRENCIES.has(defaultCurrency)) {
      return NextResponse.json(
        { error: "invalid defaultCurrency" },
        { status: 400 },
      );
    }
    if (!defaultSellerEmail) {
      return NextResponse.json(
        { error: "defaultSellerEmail is required" },
        { status: 400 },
      );
    }
    if (listUrls.length === 0) {
      return NextResponse.json(
        { error: "at least one listUrl is required" },
        { status: 400 },
      );
    }

    const created = await prisma.importSource.create({
      data: {
        name,
        type: type as never,
        connectorKey,
        baseUrl,
        listUrls: listUrls as unknown as object,
        config: config as unknown as object,
        defaultSellerEmail,
        defaultSellerType: defaultSellerType as never,
        defaultCurrency: defaultCurrency as never,
        autoPublish,
        requestDelayMs,
        maxPerRun,
        cronIntervalHours,
        isActive,
      },
    });

    return NextResponse.json({ source: created });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message ?? "failed to create source" },
      { status: 500 },
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const user = await getSessionUserFromRequest(req);
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const id = String(body?.id ?? "").trim();
    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const data: Record<string, unknown> = {};
    if (body?.name !== undefined) data.name = String(body.name).trim();
    if (body?.type !== undefined) {
      const type = String(body.type);
      if (!ALLOWED_TYPES.has(type)) {
        return NextResponse.json({ error: "invalid type" }, { status: 400 });
      }
      data.type = type;
    }
    if (body?.connectorKey !== undefined) {
      data.connectorKey = String(body.connectorKey).trim() || "generic";
    }
    if (body?.baseUrl !== undefined) {
      data.baseUrl = body.baseUrl ? String(body.baseUrl).trim() : null;
    }
    if (body?.listUrls !== undefined) {
      data.listUrls = normalizeListUrls(body.listUrls);
    }
    if (body?.config !== undefined) {
      data.config = normalizeConfig(body.config);
    }
    if (body?.defaultSellerEmail !== undefined) {
      data.defaultSellerEmail = String(body.defaultSellerEmail).trim();
    }
    if (body?.defaultSellerType !== undefined) {
      const value = String(body.defaultSellerType);
      if (!ALLOWED_SELLER_TYPES.has(value)) {
        return NextResponse.json(
          { error: "invalid defaultSellerType" },
          { status: 400 },
        );
      }
      data.defaultSellerType = value;
    }
    if (body?.defaultCurrency !== undefined) {
      const value = String(body.defaultCurrency);
      if (!ALLOWED_CURRENCIES.has(value)) {
        return NextResponse.json(
          { error: "invalid defaultCurrency" },
          { status: 400 },
        );
      }
      data.defaultCurrency = value;
    }
    if (body?.autoPublish !== undefined) data.autoPublish = !!body.autoPublish;
    if (body?.requestDelayMs !== undefined) {
      data.requestDelayMs = Number(body.requestDelayMs) || 1500;
    }
    if (body?.maxPerRun !== undefined) {
      data.maxPerRun = Number(body.maxPerRun) || 100;
    }
    if (body?.cronIntervalHours !== undefined) {
      data.cronIntervalHours = Math.max(
        1,
        Math.min(Number(body.cronIntervalHours) || 6, 168),
      );
    }
    if (body?.isActive !== undefined) data.isActive = !!body.isActive;

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "nothing to update" }, { status: 400 });
    }

    const existing = await prisma.importSource.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "not found" }, { status: 404 });
    }

    const mergedType =
      data.type !== undefined ? String(data.type) : existing.type;
    const mergedConnector =
      data.connectorKey !== undefined
        ? String(data.connectorKey)
        : existing.connectorKey;
    if (mergedType === "FACEBOOK_MARKETPLACE" && mergedConnector === "generic") {
      data.connectorKey = "facebook_marketplace";
    }

    const updated = await prisma.importSource.update({
      where: { id },
      data: data as never,
    });
    return NextResponse.json({ source: updated });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message ?? "failed to update source" },
      { status: 500 },
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const user = await getSessionUserFromRequest(req);
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
    const url = new URL(req.url);
    const id = String(url.searchParams.get("id") ?? "").trim();
    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }
    await prisma.importSource.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message ?? "failed to delete source" },
      { status: 500 },
    );
  }
}
