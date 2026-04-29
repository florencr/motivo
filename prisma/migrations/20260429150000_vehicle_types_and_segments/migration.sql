-- VehicleType: top-level tabs (cars, vans, …)
CREATE TABLE "VehicleType" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VehicleType_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "VehicleType_slug_key" ON "VehicleType"("slug");
CREATE INDEX "VehicleType_sortOrder_idx" ON "VehicleType"("sortOrder");

INSERT INTO "VehicleType" ("id", "name", "slug", "sortOrder", "createdAt", "updatedAt") VALUES
('seed_vtype_cars', 'Cars', 'cars', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('seed_vtype_vans', 'Vans', 'vans', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('seed_vtype_trucks', 'Trucks', 'trucks', 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('seed_vtype_bikes', 'Bikes', 'bikes', 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('seed_vtype_boats', 'Boats', 'boats', 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- VehicleSegment: second level (sedan, SUV, …) per vehicle type
CREATE TABLE "VehicleSegment" (
    "id" TEXT NOT NULL,
    "vehicleTypeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VehicleSegment_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "VehicleSegment_vehicleTypeId_slug_key" ON "VehicleSegment"("vehicleTypeId", "slug");
CREATE INDEX "VehicleSegment_vehicleTypeId_idx" ON "VehicleSegment"("vehicleTypeId");

ALTER TABLE "VehicleSegment"
ADD CONSTRAINT "VehicleSegment_vehicleTypeId_fkey"
FOREIGN KEY ("vehicleTypeId") REFERENCES "VehicleType"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Make" ADD COLUMN "vehicleTypeId" TEXT;
ALTER TABLE "Make" ADD COLUMN "segmentId" TEXT;

UPDATE "Make" SET "vehicleTypeId" = 'seed_vtype_cars' WHERE "vehicleTypeId" IS NULL;

INSERT INTO "VehicleSegment" ("id", "vehicleTypeId", "name", "slug", "sortOrder", "createdAt", "updatedAt")
SELECT
    vc."id",
    'seed_vtype_cars',
    vc."name",
    vc."slug",
    0,
    vc."createdAt",
    vc."updatedAt"
FROM "VehicleCategory" vc;

UPDATE "Make" m
SET "segmentId" = m."categoryId"
WHERE m."categoryId" IS NOT NULL
  AND EXISTS (SELECT 1 FROM "VehicleSegment" s WHERE s."id" = m."categoryId");

ALTER TABLE "Make" DROP CONSTRAINT IF EXISTS "Make_categoryId_fkey";
ALTER TABLE "Make" DROP COLUMN IF EXISTS "categoryId";

DROP TABLE "VehicleCategory";

ALTER TABLE "Make" ALTER COLUMN "vehicleTypeId" SET NOT NULL;

ALTER TABLE "Make" ADD CONSTRAINT "Make_vehicleTypeId_fkey"
FOREIGN KEY ("vehicleTypeId") REFERENCES "VehicleType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Make" ADD CONSTRAINT "Make_segmentId_fkey"
FOREIGN KEY ("segmentId") REFERENCES "VehicleSegment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

DROP INDEX IF EXISTS "Make_name_key";
DROP INDEX IF EXISTS "Make_slug_key";

CREATE UNIQUE INDEX "Make_vehicleTypeId_slug_key" ON "Make"("vehicleTypeId", "slug");
CREATE INDEX "Make_vehicleTypeId_idx" ON "Make"("vehicleTypeId");
CREATE INDEX "Make_segmentId_idx" ON "Make"("segmentId");
