-- Clear app data before importing a local data-only dump (keeps _prisma_migrations).
TRUNCATE TABLE
  "Listing",
  "SellerReview",
  "UserSession",
  "Generation",
  "Model",
  "Make",
  "VehicleSegment",
  "VehicleType",
  "FooterPage",
  "ListingTagOption",
  "ListingFeatureOption",
  "User"
RESTART IDENTITY CASCADE;
