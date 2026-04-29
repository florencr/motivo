import { PrismaClient } from "@/app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

/**
 * Bump when connection wiring changes. Dev (Turbopack) keeps a global PrismaClient;
 * without this, hot reload can reuse an old client built with wrong options.
 */
const PRISMA_CLIENT_CACHE_VERSION = 4;

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
      "DATABASE_URL is missing or empty. Add postgresql://… to .env (local Docker) or set PRISMA_ACCELERATE_URL for Accelerate."
    );
  }
  return new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl }) });
}

export const prisma: PrismaClient = (() => {
  const dev = process.env.NODE_ENV !== "production";
  const cachedOk =
    dev &&
    globalForPrisma.prisma &&
    globalForPrisma.prismaCacheVersion === PRISMA_CLIENT_CACHE_VERSION;

  if (cachedOk && globalForPrisma.prisma) {
    return globalForPrisma.prisma;
  }

  const client = createPrismaClient();

  if (dev) {
    globalForPrisma.prisma = client;
    globalForPrisma.prismaCacheVersion = PRISMA_CLIENT_CACHE_VERSION;
  }

  return client;
})();
