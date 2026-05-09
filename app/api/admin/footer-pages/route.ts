import { prisma } from "@/lib/prisma";
import { getSessionUserFromRequest } from "@/lib/session-user";
import { toSlug } from "@/lib/slug";
import { NextResponse } from "next/server";

type Section = "GET_STARTED" | "USER_LINKS" | "COMPANY" | "APP";
const ALLOWED_SECTIONS: Section[] = [
  "GET_STARTED",
  "USER_LINKS",
  "COMPANY",
  "APP",
];

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
    const section = String(body?.section ?? "").trim() as Section;
    const content = String(body?.content ?? "").trim();
    const slugInput = String(body?.slug ?? "").trim();
    const sortOrder = Number(body?.sortOrder ?? 0);

    if (!title || !section || !content) {
      return NextResponse.json(
        { error: "title, section and content are required" },
        { status: 400 },
      );
    }
    if (!ALLOWED_SECTIONS.includes(section)) {
      return NextResponse.json({ error: "invalid section" }, { status: 400 });
    }

    const slug = toSlug(slugInput || title);
    if (!slug) {
      return NextResponse.json({ error: "invalid slug" }, { status: 400 });
    }

    const page = await prisma.footerPage.create({
      data: {
        title,
        section,
        content,
        slug,
        sortOrder: Number.isNaN(sortOrder) ? 0 : sortOrder,
        isPublished: true,
      },
    });

    return NextResponse.json({ page });
  } catch {
    return NextResponse.json(
      { error: "failed to create footer page" },
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
    const id = String(body?.id ?? "");
    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

    const data: {
      title?: string;
      content?: string;
      slug?: string;
      section?: Section;
      sortOrder?: number;
      isPublished?: boolean;
    } = {};

    if (typeof body?.isPublished === "boolean") {
      data.isPublished = body.isPublished;
    }
    if (typeof body?.title === "string" && body.title.trim().length > 0) {
      data.title = body.title.trim();
    }
    if (typeof body?.content === "string") {
      data.content = body.content;
    }
    if (typeof body?.section === "string") {
      const s = body.section.trim() as Section;
      if (!ALLOWED_SECTIONS.includes(s)) {
        return NextResponse.json({ error: "invalid section" }, { status: 400 });
      }
      data.section = s;
    }
    if (
      typeof body?.sortOrder === "string" ||
      typeof body?.sortOrder === "number"
    ) {
      const n = Number(body.sortOrder);
      if (!Number.isNaN(n)) data.sortOrder = n;
    }
    if (typeof body?.slug === "string") {
      const baseTitle = data.title ?? "";
      const slug = toSlug(body.slug.trim() || baseTitle);
      if (slug) data.slug = slug;
    }

    const page = await prisma.footerPage.update({
      where: { id },
      data,
    });
    return NextResponse.json({ page });
  } catch {
    return NextResponse.json(
      { error: "failed to update footer page" },
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

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    await prisma.footerPage.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "failed to delete footer page" },
      { status: 500 },
    );
  }
}
