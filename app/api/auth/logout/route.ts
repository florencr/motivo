import { getSessionCookieName, hashSessionToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const cookie = req.headers.get("cookie") ?? "";
  const cookieName = `${getSessionCookieName()}=`;
  const token = cookie
    .split(";")
    .map((item) => item.trim())
    .find((item) => item.startsWith(cookieName))
    ?.slice(cookieName.length);

  if (token) {
    const tokenHash = hashSessionToken(token);
    await prisma.userSession.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(getSessionCookieName(), "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });

  return response;
}
