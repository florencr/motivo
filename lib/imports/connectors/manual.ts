import type { Connector, ConnectorContext, NormalizedListing } from "@/lib/imports/types";

/**
 * Manual connector. Use it for content from sources where automated scraping
 * is not allowed (e.g. Facebook posts, Instagram posts, Marketplace ads).
 *
 * Configure the source with `connectorKey: "manual"` and put records directly
 * in `config.records` from the admin UI. Each record must already follow the
 * `NormalizedListing` shape; the engine will still validate and upsert it.
 */
export const manualConnector: Connector = {
  key: "manual",
  label: "Manual entry / paste",
  async *fetch(ctx: ConnectorContext) {
    const records = (ctx.config?.records ?? []) as unknown[];
    if (!Array.isArray(records) || records.length === 0) {
      ctx.log("warn", "manual connector: config.records is empty");
      return;
    }
    let count = 0;
    for (const raw of records) {
      if (count >= ctx.maxPerRun) break;
      if (!raw || typeof raw !== "object") {
        ctx.log("warn", "manual connector: skipped non-object record");
        continue;
      }
      yield raw as NormalizedListing;
      count += 1;
    }
  },
};
