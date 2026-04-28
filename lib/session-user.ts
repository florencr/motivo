import { getSessionCookieName, hashSessionToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

function readTokenFromCookieHeader(cookieHeader: string | null) {
  if (!cookieHeader) return null;
  const cookieName = `${getSessionCookieName()}=`;
  return cookieHeader
    .split(";")
    .map((item) => item.trim())
    .find((item) => item.startsWith(cookieName))
    ?.slice(cookieName.length);
}

export async function getSessionUserFromCookieHeader(cookieHeader: string | null) {
  const token = readTokenFromCookieHeader(cookieHeader);
  if (!token) return null;

  const tokenHash = hashSessionToken(token);
  const session = await prisma.userSession.findFirst({
    where: {
      tokenHash,
      revokedAt: null,
      expiresAt: { gt: new Date() },
    },
    include: { user: true },
  });

  return session?.user ?? null;
}

export async function getSessionUserFromRequest(req: Request) {
  return getSessionUserFromCookieHeader(req.headers.get("cookie"));
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(getSessionCookieName())?.value;
  if (!token) return null;

  const tokenHash = hashSessionToken(token);
  const session = await prisma.userSession.findFirst({
    where: {
      tokenHash,
      revokedAt: null,
      expiresAt: { gt: new Date() },
    },
    include: { user: true },
  });

  return session?.user ?? null;
}
