import { prisma } from "@/lib/prisma";
import { getSessionUserFromRequest } from "@/lib/session-user";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const user = await getSessionUserFromRequest(req);
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const url = new URL(req.url);
  const sourceId = url.searchParams.get("sourceId");
  const limit = Math.min(Number(url.searchParams.get("limit") ?? 25), 100);

  const runs = await prisma.importRun.findMany({
    where: sourceId ? { sourceId } : undefined,
    orderBy: { startedAt: "desc" },
    take: limit,
    include: {
      source: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json({ runs });
}
