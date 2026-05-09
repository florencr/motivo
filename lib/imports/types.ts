import type {
  Currency,
  FuelType,
  SellerType,
  Transmission,
} from "@/app/generated/prisma/enums";

/**
 * One vehicle record produced by a connector. Connectors do their own HTML/HTTP
 * parsing and return objects shaped like this; the engine normalizes,
 * validates, and upserts them into `Listing`.
 */
export type NormalizedListing = {
  /** Stable identifier on the source (URL or numeric id). */
  externalId: string;
  /** Source URL (used for diagnostics + as a default externalId). */
  sourceUrl?: string;
  title: string;
  makeName: string;
  modelName: string;
  /** EUR or ALL value as integer/decimal in major units. */
  price: number;
  currency?: Currency;
  year: number;
  mileageKm: number;
  fuelType: FuelType;
  transmission: Transmission;
  engineCapacity?: number;
  powerHp?: number;
  description: string;
  sellerType?: SellerType;
  imageUrls?: string[];
  selectedFeatures?: string[];
  selectedTags?: string[];
  city?: string | null;
};

export type ConnectorContext = {
  /** Origin URL like `https://example.com`. */
  baseUrl?: string | null;
  /** List pages to crawl (search/category URLs). */
  listUrls: string[];
  /** Connector-specific settings (selectors, headers, etc.). */
  config: Record<string, unknown>;
  /** Delay between HTTP requests, ms. */
  requestDelayMs: number;
  /** Hard cap for listings produced by this run. */
  maxPerRun: number;
  /** Defaults applied to records when the connector cannot derive them. */
  defaults: {
    sellerType: SellerType;
    currency: Currency;
  };
  /** Append a diagnostic line to the run log. */
  log: (level: "info" | "warn" | "error", message: string) => void;
};

/**
 * A connector knows how to talk to one kind of source and yield records.
 * It must respect `ctx.maxPerRun` and `ctx.requestDelayMs`.
 */
export type Connector = {
  key: string;
  label: string;
  fetch: (ctx: ConnectorContext) => AsyncIterable<NormalizedListing>;
};

export type ImportRunResult = {
  createdCount: number;
  updatedCount: number;
  skippedCount: number;
  failedCount: number;
};
