import { PrismaClient } from "@/app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

/**
 * Bump when connection wiring changes. Dev (Turbopack) reuses a global client;
 * mismatch recreates the client after edits.
 */
const PRISMA_CLIENT_CACHE_VERSION = 7;

/** Quiets pg v8 deprecation warning when URL uses sslmode=require (e.g. Neon). */
function withPgDriverSslCompat(connectionString: string): string {
  const u = connectionString.trim();
  if (!u || /uselibpqcompat\s*=\s*true/i.test(u)) return u;
  if (!/sslmode=(require|prefer|verify-ca)\b/i.test(u)) return u;
  return u.includes("?") ? `${u}&uselibpqcompat=true` : `${u}?uselibpqcompat=true`;
}

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  prismaCacheVersion?: number;
};

function createPrismaClient(): PrismaClient {
  const databaseUrl = (process.env.DATABASE_URL ?? "").trim();
  const accelerateUrlFromEnv = (process.env.PRISMA_ACCELERATE_URL ?? "").trim();
  const isAccelerateProtocol = (url: string) =>
    url.startsWith("prisma://") || url.startsWith("prisma+postgres://");
  const hasAccelerateEnv = isAccelerateProtocol(accelerateUrlFromEnv);
  const hasAccelerateInDatabaseUrl = isAccelerateProtocol(databaseUrl);

  if (hasAccelerateEnv) {
    return new PrismaClient({ accelerateUrl: accelerateUrlFromEnv });
  }
  if (hasAccelerateInDatabaseUrl) {
    return new PrismaClient({ accelerateUrl: databaseUrl });
  }
  if (!databaseUrl) {
    throw new Error(
      "DATABASE_URL is missing or empty. Add postgresql://… to .env locally, set DATABASE_URL in Vercel → Settings → Environment Variables (Production), or use PRISMA_ACCELERATE_URL with a prisma:// URL."
    );
  }
  return new PrismaClient({
    adapter: new PrismaPg({ connectionString: withPgDriverSslCompat(databaseUrl) }),
  });
}

function getPrisma(): PrismaClient {
  const dev = process.env.NODE_ENV !== "production";
  const versionOk = globalForPrisma.prismaCacheVersion === PRISMA_CLIENT_CACHE_VERSION;

  if (globalForPrisma.prisma) {
    if (!dev || versionOk) return globalForPrisma.prisma;
    globalForPrisma.prisma = undefined;
  }

  const client = createPrismaClient();
  globalForPrisma.prisma = client;
  globalForPrisma.prismaCacheVersion = PRISMA_CLIENT_CACHE_VERSION;
  return client;
}

/**
 * Lazy client: importing this module must not throw when DATABASE_URL is unset
 * (e.g. Vercel build before env is available). First real query creates the client.
 */
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    const client = getPrisma();
    const value = Reflect.get(client, prop, receiver);
    if (typeof value === "function") {
      return (value as (...args: unknown[]) => unknown).bind(client);
    }
    return value;
  },
}) as PrismaClient;
