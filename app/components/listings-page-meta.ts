import type { Metadata } from "next";
import type { ListingsSearchParams } from "./listings-view";

const FILTER_KEYS: (keyof ListingsSearchParams)[] = [
  "segment",
  "make",
  "model",
  "registrationFrom",
  "registrationTo",
  "mileageFrom",
  "mileageTo",
  "priceFrom",
  "priceTo",
  "category",
  "type",
  "tag",
  "city",
  "fuel",
  "regStatus",
  "taxRefund",
];

/**
 * Returns true when the URL has any filter, pagination beyond page 1, sort,
 * or non-default per-page setting. Such URLs are thin variants of the
 * canonical type page and should not be indexed.
 */
export function hasFilteringOrPagination(params: ListingsSearchParams) {
  for (const key of FILTER_KEYS) {
    const value = params[key];
    if (value && String(value).trim() !== "") return true;
  }
  if (params.sort && params.sort !== "newest") return true;
  if (params.page && params.page !== "1") return true;
  if (params.perPage && params.perPage !== "6") return true;
  return false;
}

export function buildListingsMetadata(input: {
  basePath: string;
  searchParams: ListingsSearchParams;
  base: Metadata;
}): Metadata {
  const { basePath, searchParams, base } = input;
  const filtered = hasFilteringOrPagination(searchParams);
  return {
    ...base,
    alternates: { canonical: basePath },
    robots: filtered
      ? { index: false, follow: true }
      : { index: true, follow: true },
  };
}
