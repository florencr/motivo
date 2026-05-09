import { NextResponse } from "next/server";
import { getSessionUserFromRequest } from "@/lib/session-user";
import { prisma } from "@/lib/prisma";
import { validateCompanySlug } from "@/lib/reserved-url-slugs";

function trimOrNull(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

export async function GET(req: Request) {
  const user = await getSessionUserFromRequest(req);
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const profile = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      address: true,
      avatarUrl: true,
      profileDescription: true,
      role: true,
      sellerType: true,
      companyName: true,
      companySlug: true,
      companySlogan: true,
      companyLogoUrl: true,
      taxId: true,
      dealerLicenseNo: true,
    },
  });

  return NextResponse.json({ profile });
}

export async function PATCH(req: Request) {
  const user = await getSessionUserFromRequest(req);
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const scope = body?.scope === "company" ? "company" : "account";

  if (scope === "account") {
    const name = typeof body?.name === "string" ? body.name.trim() : "";
    if (!name) {
      return NextResponse.json({ error: "name is required" }, { status: 400 });
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        name,
        phone: trimOrNull(body?.phone),
        address: trimOrNull(body?.address),
        avatarUrl: trimOrNull(body?.avatarUrl),
        profileDescription: trimOrNull(body?.profileDescription),
      },
      select: {
        id: true,
        name: true,
        phone: true,
        address: true,
        avatarUrl: true,
        profileDescription: true,
      },
    });

    return NextResponse.json({ profile: updated });
  }

  if (user.role !== "DEALER") {
    return NextResponse.json(
      { error: "only dealers can update company profile" },
      { status: 403 },
    );
  }

  let nextSlug: string | null | undefined = undefined;
  if (Object.prototype.hasOwnProperty.call(body, "companySlug")) {
    if (body.companySlug === "" || body.companySlug == null) {
      nextSlug = null;
    } else if (typeof body.companySlug === "string") {
      const checked = validateCompanySlug(body.companySlug);
      if (!checked.ok) {
        return NextResponse.json({ error: checked.error }, { status: 400 });
      }
      nextSlug = checked.slug;
      const other = await prisma.user.findFirst({
        where: {
          companySlug: nextSlug,
          NOT: { id: user.id },
        },
        select: { id: true },
      });
      if (other) {
        return NextResponse.json(
          { error: "Ky slug është në përdorim nga një koncesionar tjetër." },
          { status: 409 },
        );
      }
    } else {
      return NextResponse.json({ error: "companySlug i pavlefshëm" }, { status: 400 });
    }
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      companyName: trimOrNull(body?.companyName),
      ...(nextSlug !== undefined ? { companySlug: nextSlug } : {}),
      companySlogan: trimOrNull(body?.companySlogan),
      companyLogoUrl: trimOrNull(body?.companyLogoUrl),
      taxId: trimOrNull(body?.taxId),
      dealerLicenseNo: trimOrNull(body?.dealerLicenseNo),
      profileDescription: trimOrNull(body?.profileDescription),
    },
    select: {
      id: true,
      companyName: true,
      companySlug: true,
      companySlogan: true,
      companyLogoUrl: true,
      taxId: true,
      dealerLicenseNo: true,
      profileDescription: true,
    },
  });

  return NextResponse.json({ profile: updated });
}
