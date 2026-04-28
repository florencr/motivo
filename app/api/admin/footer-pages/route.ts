import { prisma } from "@/lib/prisma";
import { getSessionUserFromRequest } from "@/lib/session-user";
import { toSlug } from "@/lib/slug";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const user = await getSessionUserFromRequest(req);
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const pages = await prisma.footerPage.findMany({
    orderBy: [{ section: "asc" }, { sortOrder: "asc" }, { createdAt: "desc" }],
  });
  return NextResponse.json({ pages });
}

export async function POST(req: Request) {
  try {
    const user = await getSessionUserFromRequest(req);
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const title = String(body?.title ?? "").trim();
    const section = String(body?.section ?? "").trim();
    const content = String(body?.content ?? "").trim();
    const slugInput = String(body?.slug ?? "").trim();
    const sortOrder = Number(body?.sortOrder ?? 0);

    if (!title || !section || !content) {
      return NextResponse.json(
        { error: "title, section and content are required" },
        { status: 400 }
      );
    }

    const slug = toSlug(slugInput || title);
    if (!slug) {
      return NextResponse.json({ error: "invalid slug" }, { status: 400 });
    }

    const page = await prisma.footerPage.create({
      data: {
        title,
        section: section as "GET_STARTED" | "USER_LINKS" | "COMPANY" | "APP",
        content,
        slug,
        sortOrder: Number.isNaN(sortOrder) ? 0 : sortOrder,
        isPublished: true,
      },
    });

    return NextResponse.json({ page });
  } catch {
    return NextResponse.json({ error: "failed to create footer page" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const user = await getSessionUserFromRequest(req);
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const id = String(body?.id ?? "");
    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

    const page = await prisma.footerPage.update({
      where: { id },
      data: {
        isPublished:
          typeof body?.isPublished === "boolean" ? body.isPublished : undefined,
      },
    });
    return NextResponse.json({ page });
  } catch {
    return NextResponse.json({ error: "failed to update footer page" }, { status: 500 });
  }
}
