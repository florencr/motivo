ALTER TABLE "User"
ADD COLUMN "profileDescription" TEXT;

CREATE TABLE "ListingTagOption" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ListingTagOption_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ListingTagOption_name_key" ON "ListingTagOption"("name");
CREATE INDEX "ListingTagOption_isActive_idx" ON "ListingTagOption"("isActive");

CREATE TABLE "ListingFeatureOption" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ListingFeatureOption_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ListingFeatureOption_name_key" ON "ListingFeatureOption"("name");
CREATE INDEX "ListingFeatureOption_isActive_idx" ON "ListingFeatureOption"("isActive");
