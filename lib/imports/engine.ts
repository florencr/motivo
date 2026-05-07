import { prisma } from "@/lib/prisma";
import { getConnector } from "@/lib/imports/connectors";
import { upsertNormalizedListing } from "@/lib/imports/upsert";
import type {
  Currency,
  ImportSourceType,
  SellerType,
} from "@/app/generated/prisma/enums";
import type { NormalizedListing } from "@/lib/imports/types";

type RunLogLevel = "info" | "warn" | "error";

type SourceForRun = {
  id: string;
  name: string;
  type: ImportSourceType;
  connectorKey: string;
  baseUrl: string | null;
  listUrls: unknown;
  config: unknown;
  defaultSellerEmail: string;
  defaultSellerType: SellerType;
  defaultCurrency: Currency;
  autoPublish: boolean;
  requestDelayMs: number;
  maxPerRun: number;
};

function asListUrls(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  return input
    .map((entry) => (typeof entry === "string" ? entry.trim() : ""))
    .filter((url) => url.length > 0);
}

function asConfig(input: unknown): Record<string, unknown> {
  if (!input || typeof input !== "object" || Array.isArray(input)) return {};
  return input as Record<string, unknown>;
}

/**
 * Drive one import run end-to-end. The run row is created up-front and
 * always closed in a final state, even on connector or DB errors.
 */
export async function runImportSource(sourceId: string): Promise<{
  runId: string;
  createdCount: number;
  updatedCount: number;
  skippedCount: number;
  failedCount: number;
}> {
  const source = (await prisma.importSource.findUnique({
    where: { id: sourceId },
    select: {
      id: true,
      name: true,
      type: true,
      connectorKey: true,
      baseUrl: true,
      listUrls: true,
      config: true,
      defaultSellerEmail: true,
      defaultSellerType: true,
      defaultCurrency: true,
      autoPublish: true,
      requestDelayMs: true,
      maxPerRun: true,
    },
  })) as SourceForRun | null;

  if (!source) {
    throw new Error(`Import source not found: ${sourceId}`);
  }

  const run = await prisma.importRun.create({
    data: {
      sourceId: source.id,
      status: "RUNNING",
      logs: [] as unknown as object,
    },
    select: { id: true },
  });

  const logs: { level: RunLogLevel; message: string; at: string }[] = [];
  const log = (level: RunLogLevel, message: string) => {
    logs.push({ level, message, at: new Date().toISOString() });
  };

  let created = 0;
  let updated = 0;
  let skipped = 0;
  let failed = 0;
  let errorMessage: string | null = null;

  try {
    const connector = getConnector(source.connectorKey);
    if (!connector) {
      throw new Error(`unknown connectorKey: ${source.connectorKey}`);
    }

    const ctx = {
      baseUrl: source.baseUrl,
      listUrls: asListUrls(source.listUrls),
      config: asConfig(source.config),
      requestDelayMs: source.requestDelayMs,
      maxPerRun: source.maxPerRun,
      defaults: {
        sellerType: source.defaultSellerType,
        currency: source.defaultCurrency,
      },
      log,
    };

    if (ctx.listUrls.length === 0) {
      throw new Error("source has no listUrls configured");
    }

    log("info", `connector=${connector.key} source=${source.name}`);

    for await (const raw of connector.fetch(ctx)) {
      const record: NormalizedListing = {
        ...raw,
        currency: raw.currency ?? source.defaultCurrency,
        sellerType: raw.sellerType ?? source.defaultSellerType,
      };

      let outcome;
      try {
        outcome = await upsertNormalizedListing(record, {
          sellerEmail: source.defaultSellerEmail,
          sellerType: source.defaultSellerType,
          currency: source.defaultCurrency,
          autoPublish: source.autoPublish,
        });
      } catch (err) {
        outcome = {
          status: "FAILED" as const,
          reason: (err as Error).message || "unknown error",
        };
      }

      await prisma.importRecord.create({
        data: {
          runId: run.id,
          sourceUrl: record.sourceUrl ?? null,
          externalId: record.externalId ?? null,
          status: outcome.status,
          listingSlug:
            outcome.status === "CREATED" || outcome.status === "UPDATED"
              ? outcome.listingSlug
              : null,
          message:
            outcome.status === "CREATED" || outcome.status === "UPDATED"
              ? null
              : outcome.reason,
          rawData: record as unknown as object,
        },
      });

      if (outcome.status === "CREATED") created += 1;
      else if (outcome.status === "UPDATED") updated += 1;
      else if (outcome.status === "SKIPPED") skipped += 1;
      else failed += 1;
    }
  } catch (err) {
    errorMessage = (err as Error).message ?? "import failed";
    log("error", errorMessage);
  }

  const finalStatus =
    errorMessage && created === 0 && updated === 0
      ? "FAILED"
      : failed > 0 || (errorMessage && (created > 0 || updated > 0))
        ? "PARTIAL"
        : "SUCCESS";

  await prisma.importRun.update({
    where: { id: run.id },
    data: {
      status: finalStatus,
      finishedAt: new Date(),
      createdCount: created,
      updatedCount: updated,
      skippedCount: skipped,
      failedCount: failed,
      errorMessage,
      logs: logs as unknown as object,
    },
  });

  await prisma.importSource.update({
    where: { id: source.id },
    data: { lastRunAt: new Date() },
  });

  return {
    runId: run.id,
    createdCount: created,
    updatedCount: updated,
    skippedCount: skipped,
    failedCount: failed,
  };
}
