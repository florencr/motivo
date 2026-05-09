ALTER TABLE "Listing" ALTER COLUMN "hasAlbanianPlates" DROP DEFAULT;
ALTER TABLE "Listing" ALTER COLUMN "hasAlbanianPlates" DROP NOT NULL;
ALTER TABLE "Listing" ALTER COLUMN "isCustomsPaid" DROP DEFAULT;
ALTER TABLE "Listing" ALTER COLUMN "isCustomsPaid" DROP NOT NULL;

UPDATE "Listing"
SET "hasAlbanianPlates" = NULL,
    "isCustomsPaid" = NULL
WHERE "hasAlbanianPlates" = false
  AND "isCustomsPaid" = false;
