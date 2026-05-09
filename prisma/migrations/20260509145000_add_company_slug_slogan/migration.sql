-- AlterTable
ALTER TABLE "User" ADD COLUMN "companySlug" TEXT,
ADD COLUMN "companySlogan" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_companySlug_key" ON "User"("companySlug");
