import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { runImportSource } from "@/lib/imports/engine";

/** Allow longer runtime; cron may iterate many sources. */
export const maxDuration = 300;

/**
 * Scheduled import dispatcher. Triggered by Vercel Cron (vercel.json) every
 * few hours. For each ACTIVE source, it runs the import only if more than
 * `cronIntervalHours` have elapsed since the last run. Re-runs are safe
 * because listings keep stable slugs (CREATE → UPDATE on second pass).
 *
 * Auth: requires `Authorization: Bearer ${CRON_SECRET}`. Vercel Cron jobs
 * automatically include this header when CRON_SECRET is set as an env var.
 */
export async function GET(req: Request) {
  const expected = (process.env.CRON_SECRET ?? "").trim();
  if (!expected) {
    return NextResponse.json(
      { error: "CRON_SECRET is not configured" },
      { status: 500 },
    );
  }
  const auth = req.headers.get("authorization") ?? "";
  if (auth !== `Bearer ${expected}`) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const now = Date.now();
  const sources = await prisma.importSource.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      lastRunAt: true,
      cronIntervalHours: true,
    },
    orderBy: { createdAt: "asc" },
  });

  const triggered: Array<{ id: string; name: string; runId: string }> = [];
  const skipped: Array<{ id: string; name: string; reason: string }> = [];
  const failed: Array<{ id: string; name: string; error: string }> = [];

  for (const src of sources) {
    const intervalMs = Math.max(1, src.cronIntervalHours) * 60 * 60 * 1000;
    const dueAt = src.lastRunAt
      ? new Date(src.lastRunAt).getTime() + intervalMs
      : 0;
    if (dueAt > now) {
      skipped.push({
        id: src.id,
        name: src.name,
        reason: `not due until ${new Date(dueAt).toISOString()}`,
      });
      continue;
    }
    try {
      const result = await runImportSource(src.id);
      triggered.push({ id: src.id, name: src.name, runId: result.runId });
    } catch (err) {
      failed.push({
        id: src.id,
        name: src.name,
        error: (err as Error).message ?? "run failed",
      });
    }
  }

  return NextResponse.json({
    ok: true,
    checkedSources: sources.length,
    triggered,
    skipped,
    failed,
  });
}
