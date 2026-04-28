-- CreateEnum
CREATE TYPE "FooterSection" AS ENUM ('GET_STARTED', 'USER_LINKS', 'COMPANY', 'APP');

-- AlterTable
ALTER TABLE "Make" ADD COLUMN     "categoryId" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "avatarUrl" TEXT,
ADD COLUMN     "companyLogoUrl" TEXT,
ADD COLUMN     "taxId" TEXT;

-- CreateTable
CREATE TABLE "VehicleCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VehicleCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FooterPage" (
    "id" TEXT NOT NULL,
    "section" "FooterSection" NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FooterPage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "VehicleCategory_name_key" ON "VehicleCategory"("name");

-- CreateIndex
CREATE UNIQUE INDEX "VehicleCategory_slug_key" ON "VehicleCategory"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "FooterPage_slug_key" ON "FooterPage"("slug");

-- CreateIndex
CREATE INDEX "FooterPage_section_idx" ON "FooterPage"("section");

-- CreateIndex
CREATE INDEX "FooterPage_isPublished_idx" ON "FooterPage"("isPublished");

-- CreateIndex
CREATE INDEX "Make_categoryId_idx" ON "Make"("categoryId");

-- AddForeignKey
ALTER TABLE "Make" ADD CONSTRAINT "Make_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "VehicleCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;
