/*
  Warnings:

  - You are about to drop the column `gearbox` on the `Listing` table. All the data in the column will be lost.
  - Added the required column `currency` to the `Listing` table without a default value. This is not possible if the table is not empty.
  - Added the required column `makeName` to the `Listing` table without a default value. This is not possible if the table is not empty.
  - Added the required column `modelName` to the `Listing` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sellerId` to the `Listing` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sellerType` to the `Listing` table without a default value. This is not possible if the table is not empty.
  - Added the required column `transmission` to the `Listing` table without a default value. This is not possible if the table is not empty.
  - Made the column `mileageKm` on table `Listing` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `fuelType` to the `Listing` table without a default value. This is not possible if the table is not empty.
  - Made the column `description` on table `Listing` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "SellerType" AS ENUM ('PRIVATE', 'DEALER');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'DEALER', 'PRIVATE_SELLER', 'BUYER');

-- CreateEnum
CREATE TYPE "Currency" AS ENUM ('EUR', 'ALL');

-- CreateEnum
CREATE TYPE "FuelType" AS ENUM ('PETROL', 'DIESEL', 'ELECTRIC', 'HYBRID');

-- CreateEnum
CREATE TYPE "Transmission" AS ENUM ('MANUAL', 'AUTOMATIC');

-- CreateEnum
CREATE TYPE "DriveTrain" AS ENUM ('FWD', 'RWD', 'AWD');

-- DropIndex
DROP INDEX "Listing_gearbox_idx";

-- AlterTable
ALTER TABLE "Listing" DROP COLUMN "gearbox",
ADD COLUMN     "color" TEXT,
ADD COLUMN     "currency" "Currency" NOT NULL,
ADD COLUMN     "driveTrain" "DriveTrain",
ADD COLUMN     "engineCapacity" INTEGER,
ADD COLUMN     "generationName" TEXT,
ADD COLUMN     "hasAlbanianPlates" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isCustomsPaid" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isTaxRefundable" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "makeName" TEXT NOT NULL,
ADD COLUMN     "modelName" TEXT NOT NULL,
ADD COLUMN     "powerHp" INTEGER,
ADD COLUMN     "sellerId" TEXT NOT NULL,
ADD COLUMN     "sellerType" "SellerType" NOT NULL,
ADD COLUMN     "transmission" "Transmission" NOT NULL,
ADD COLUMN     "trim" TEXT,
ALTER COLUMN "price" SET DATA TYPE DECIMAL(12,2),
ALTER COLUMN "mileageKm" SET NOT NULL,
DROP COLUMN "fuelType",
ADD COLUMN     "fuelType" "FuelType" NOT NULL,
ALTER COLUMN "description" SET NOT NULL;

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'BUYER',
    "sellerType" "SellerType",
    "companyName" TEXT,
    "dealerLicenseNo" TEXT,
    "address" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "User_sellerType_idx" ON "User"("sellerType");

-- CreateIndex
CREATE INDEX "Listing_fuelType_idx" ON "Listing"("fuelType");

-- CreateIndex
CREATE INDEX "Listing_transmission_idx" ON "Listing"("transmission");

-- CreateIndex
CREATE INDEX "Listing_sellerId_idx" ON "Listing"("sellerId");

-- AddForeignKey
ALTER TABLE "Listing" ADD CONSTRAINT "Listing_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
