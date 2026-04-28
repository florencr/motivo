import { PrismaClient } from "@/app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const databaseUrl = process.env.DATABASE_URL ?? "";
const accelerateUrlFromEnv = process.env.PRISMA_ACCELERATE_URL ?? "";
const isAccelerateProtocol = (url: string) =>
  url.startsWith("prisma://") || url.startsWith("prisma+postgres://");
const hasAccelerateEnv = isAccelerateProtocol(accelerateUrlFromEnv);
const hasAccelerateInDatabaseUrl = isAccelerateProtocol(databaseUrl);

const prismaClient = (() => {
  if (hasAccelerateEnv) {
    return new PrismaClient({ accelerateUrl: accelerateUrlFromEnv });
  }
  if (hasAccelerateInDatabaseUrl) {
    return new PrismaClient({ accelerateUrl: databaseUrl });
  }
  return new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl }) });
})();

export const prisma =
  globalForPrisma.prisma ??
  prismaClient;

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
