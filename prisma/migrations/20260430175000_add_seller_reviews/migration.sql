CREATE TABLE "SellerReview" (
    "id" TEXT NOT NULL,
    "reviewerId" TEXT NOT NULL,
    "reviewedUserId" TEXT NOT NULL,
    "responsivenessRating" INTEGER NOT NULL,
    "realityMatchRating" INTEGER NOT NULL,
    "overallExperienceRating" INTEGER NOT NULL,
    "averageRating" DOUBLE PRECISION NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SellerReview_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SellerReview_reviewerId_reviewedUserId_key" ON "SellerReview"("reviewerId", "reviewedUserId");
CREATE INDEX "SellerReview_reviewedUserId_idx" ON "SellerReview"("reviewedUserId");

ALTER TABLE "SellerReview" ADD CONSTRAINT "SellerReview_reviewerId_fkey"
FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SellerReview" ADD CONSTRAINT "SellerReview_reviewedUserId_fkey"
FOREIGN KEY ("reviewedUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
