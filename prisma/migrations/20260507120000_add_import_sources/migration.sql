-- CreateEnum
CREATE TYPE "ImportSourceType" AS ENUM ('WEBSITE', 'FACEBOOK_MARKETPLACE', 'FACEBOOK_POST', 'INSTAGRAM_POST', 'MANUAL');

-- CreateEnum
CREATE TYPE "ImportRunStatus" AS ENUM ('PENDING', 'RUNNING', 'SUCCESS', 'PARTIAL', 'FAILED');

-- CreateEnum
CREATE TYPE "ImportRecordStatus" AS ENUM ('CREATED', 'UPDATED', 'SKIPPED', 'FAILED');

-- CreateTable
CREATE TABLE "ImportSource" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "ImportSourceType" NOT NULL DEFAULT 'WEBSITE',
    "connectorKey" TEXT NOT NULL DEFAULT 'generic',
    "baseUrl" TEXT,
    "listUrls" JSONB NOT NULL,
    "config" JSONB,
    "defaultSellerEmail" TEXT NOT NULL,
    "defaultSellerType" "SellerType" NOT NULL DEFAULT 'DEALER',
    "defaultCurrency" "Currency" NOT NULL DEFAULT 'EUR',
    "autoPublish" BOOLEAN NOT NULL DEFAULT true,
    "requestDelayMs" INTEGER NOT NULL DEFAULT 1500,
    "maxPerRun" INTEGER NOT NULL DEFAULT 100,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastRunAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ImportSource_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ImportSource_type_idx" ON "ImportSource"("type");
CREATE INDEX "ImportSource_isActive_idx" ON "ImportSource"("isActive");

-- CreateTable
CREATE TABLE "ImportRun" (
    "id" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "status" "ImportRunStatus" NOT NULL DEFAULT 'PENDING',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "createdCount" INTEGER NOT NULL DEFAULT 0,
    "updatedCount" INTEGER NOT NULL DEFAULT 0,
    "skippedCount" INTEGER NOT NULL DEFAULT 0,
    "failedCount" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "logs" JSONB,

    CONSTRAINT "ImportRun_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ImportRun_sourceId_idx" ON "ImportRun"("sourceId");
CREATE INDEX "ImportRun_status_idx" ON "ImportRun"("status");
CREATE INDEX "ImportRun_startedAt_idx" ON "ImportRun"("startedAt");

-- CreateTable
CREATE TABLE "ImportRecord" (
    "id" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "sourceUrl" TEXT,
    "externalId" TEXT,
    "status" "ImportRecordStatus" NOT NULL,
    "listingSlug" TEXT,
    "message" TEXT,
    "rawData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ImportRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ImportRecord_runId_idx" ON "ImportRecord"("runId");
CREATE INDEX "ImportRecord_status_idx" ON "ImportRecord"("status");
CREATE INDEX "ImportRecord_listingSlug_idx" ON "ImportRecord"("listingSlug");

-- AddForeignKey
ALTER TABLE "ImportRun" ADD CONSTRAINT "ImportRun_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "ImportSource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImportRecord" ADD CONSTRAINT "ImportRecord_runId_fkey" FOREIGN KEY ("runId") REFERENCES "ImportRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;
