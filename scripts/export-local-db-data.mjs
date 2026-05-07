/**
 * Export row data from local Docker Postgres (carlist-postgres) to carlist-data.sql
 * in the project root. Does not copy migration history or login sessions.
 *
 * Requires: docker running, `npm run db:up`, container name carlist-postgres.
 *
 * Then push schema to live: DATABASE_URL=<live> npx prisma migrate deploy
 * Then import: LIVE_DATABASE_URL=<live> npm run db:import-live-data
 */

import { execFileSync } from "node:child_process";
import { resolve } from "node:path";

const CONTAINER = "carlist-postgres";
const TMP = "/tmp/carlist-data-export.sql";
const OUT = resolve(process.cwd(), "carlist-data.sql");

function run(cmd, args) {
  execFileSync(cmd, args, { stdio: "inherit" });
}

try {
  run("docker", [
    "exec",
    CONTAINER,
    "pg_dump",
    "-U",
    "carlist",
    "-d",
    "carlist",
    "--data-only",
    "--no-owner",
    "--exclude-table=_prisma_migrations",
    "--exclude-table=UserSession",
    "-F",
    "p",
    "-f",
    TMP,
  ]);
} catch {
  console.error("Docker export failed. Is Docker running and the DB up? Try: npm run db:up");
  process.exit(1);
}

run("docker", ["cp", `${CONTAINER}:${TMP}`, OUT]);
console.log(`Wrote ${OUT}`);
console.log("Next: set LIVE_DATABASE_URL to your online Postgres URL, run prisma migrate deploy on live, then npm run db:import-live-data");
