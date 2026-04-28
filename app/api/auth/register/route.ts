import { SellerType } from "@/app/generated/prisma/enums";
import {
  createSessionToken,
  getSessionCookieName,
  getSessionExpiryDate,
  getSessionTtlSeconds,
  hashPassword,
  hashSessionToken,
  normalizeRole,
} from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const role = normalizeRole(body?.role);
    const firstName = String(body?.firstName ?? "").trim();
    const lastName = String(body?.lastName ?? "").trim();
    const fallbackName = String(body?.name ?? "").trim();
    const name = `${firstName} ${lastName}`.trim() || fallbackName;
    const email = String(body?.email ?? "").trim().toLowerCase();
    const password = String(body?.password ?? "");
    const phone = body?.phone ? String(body.phone).trim() : null;
    const avatarUrl = body?.avatarUrl ? String(body.avatarUrl).trim() : null;
    const companyName = body?.companyName ? String(body.companyName).trim() : null;
    const companyLogoUrl = body?.companyLogoUrl
      ? String(body.companyLogoUrl).trim()
      : null;
    const taxId = body?.taxId ? String(body.taxId).trim() : null;

    if (!name || !email || !password || !role) {
      return NextResponse.json(
        { error: "name (or firstName/lastName), email, password, role are required" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "password must be at least 8 characters" },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "email already exists" }, { status: 409 });
    }

    const sellerType =
      role === "DEALER"
        ? SellerType.DEALER
        : role === "PRIVATE_SELLER"
          ? SellerType.PRIVATE
          : null;

    if (role === "DEALER" && (!companyName || !taxId)) {
      return NextResponse.json(
        { error: "companyName and taxId are required for dealer accounts" },
        { status: 400 }
      );
    }

    if (role === "PRIVATE_SELLER" && !phone) {
      return NextResponse.json(
        { error: "phone is required for private seller accounts" },
        { status: 400 }
      );
    }

    const user = await prisma.user.create({
      data: {
        name,
        email,
        phone,
        avatarUrl,
        role,
        sellerType,
        companyName,
        companyLogoUrl,
        taxId,
        passwordHash: hashPassword(password),
      },
    });

    const rawToken = createSessionToken();
    const tokenHash = hashSessionToken(rawToken);
    const expiresAt = getSessionExpiryDate();

    await prisma.userSession.create({
      data: {
        userId: user.id,
        tokenHash,
        userAgent: req.headers.get("user-agent") ?? null,
        ipAddress: req.headers.get("x-forwarded-for") ?? null,
        expiresAt,
      },
    });

    const response = NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });

    response.cookies.set(getSessionCookieName(), rawToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: getSessionTtlSeconds(),
    });

    return response;
  } catch {
    return NextResponse.json({ error: "failed to register" }, { status: 500 });
  }
}
