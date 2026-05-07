/**
 * Truncate all app tables (keeps _prisma_migrations). Uses pg so Neon URLs with &
 * are not mangled by PowerShell.
 *
 *   LIVE_DATABASE_URL=... node scripts/truncate-app-data.mjs
 * or set DATABASE_URL in .env.neon (first line wins if LIVE not set).
 */

import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { Client } from "pg";
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
  if (!existsSync(p)) {
    console.error("Set LIVE_DATABASE_URL or add .env.neon with DATABASE_URL.");
    process.exit(1);
  }
  const merged = parseEnvFile(readFileSync(p, "utf8"));
  return merged.DATABASE_URL?.trim() ?? "";
}

const url = loadUrl();
if (!url) {
  console.error("No database URL found.");
  process.exit(1);
}

const sqlPath = resolve(process.cwd(), "scripts/truncate-app-data-for-import.sql");
const sql = readFileSync(sqlPath, "utf8");

const client = new Client({ connectionString: neonDirectUrl(url) });
await client.connect();
try {
  await client.query(sql);
  console.log("App tables truncated.");
} finally {
  await client.end();
}
