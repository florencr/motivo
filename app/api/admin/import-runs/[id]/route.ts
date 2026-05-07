import { prisma } from "@/lib/prisma";
import { getSessionUserFromRequest } from "@/lib/session-user";
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const user = await getSessionUserFromRequest(req);
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const { id } = await context.params;
  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const run = await prisma.importRun.findUnique({
    where: { id },
    include: {
      source: { select: { id: true, name: true, connectorKey: true } },
      records: {
        orderBy: { createdAt: "desc" },
        take: 200,
      },
    },
  });

  if (!run) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  return NextResponse.json({ run });
}
