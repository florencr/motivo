import { getSessionUserFromRequest } from "@/lib/session-user";
import { runImportSource } from "@/lib/imports/engine";
import { NextResponse } from "next/server";

/**
 * Trigger an import run for a source. Runs synchronously inside this request
 * and returns the final counts. Suitable for small `maxPerRun` values; for
 * larger runs a background queue should replace this.
 */
export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const user = await getSessionUserFromRequest(req);
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const { id } = await context.params;
  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  try {
    const result = await runImportSource(id);
    return NextResponse.json({ run: result });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message ?? "import run failed" },
      { status: 500 },
    );
  }
}
