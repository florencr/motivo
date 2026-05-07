/**
 * Import carlist-data.sql (from export-local-db-data) into the database in LIVE_DATABASE_URL.
 * Use your hosted Postgres connection string (e.g. Neon), usually with ?sslmode=require
 *
 * Prerequisite: same schema on live — run: DATABASE_URL=<live> npx prisma migrate deploy
 * Best if live app tables are empty (no duplicate keys).
 */

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { neonDirectUrl } from "./neon-direct-url.mjs";

function parseEnvFile(contents) {
  const out = {};
  for (const rawLine of contents.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let val = line.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    out[key] = val;
  }
  return out;
}

function loadUrl() {
  const live = process.env.LIVE_DATABASE_URL?.trim();
  if (live) return live;
  const p = resolve(process.cwd(), ".env.neon");
  if (existsSync(p)) {
    const u = parseEnvFile(readFileSync(p, "utf8")).DATABASE_URL?.trim();
    if (u) return u;
  }
  return "";
}

const url = loadUrl();
const sqlFile = resolve(process.cwd(), "carlist-data.sql");

if (!url) {
  console.error("Set LIVE_DATABASE_URL or put DATABASE_URL in .env.neon.");
  process.exit(1);
}
if (!existsSync(sqlFile)) {
  console.error(`Missing ${sqlFile}. Run npm run db:export-local-data first.`);
  process.exit(1);
}

const work = resolve(process.cwd()).replace(/\\/g, "/");
const connectUrl = neonDirectUrl(url);

execFileSync(
  "docker",
  [
    "run",
    "--rm",
    "-i",
    "-v",
    `${work}:/work`,
    "postgres:16-alpine",
    "psql",
    connectUrl,
    "-v",
    "ON_ERROR_STOP=1",
    "-f",
    "/work/carlist-data.sql",
  ],
  { stdio: "inherit" },
);

console.log("Import finished.");
