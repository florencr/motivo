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
  if (process.env.DATABASE_URL?.trim()) return process.env.DATABASE_URL.trim();
  const root = resolve(process.cwd());
  const merged = {};
  for (const name of [".env", ".env.production", ".env.neon"]) {
    const p = resolve(root, name);
    if (!existsSync(p)) continue;
    Object.assign(merged, parseEnvFile(readFileSync(p, "utf8")));
  }
  return merged.DATABASE_URL?.trim() ?? "";
}

const url = neonDirectUrl(loadUrl());
const c = new Client({ connectionString: url });
await c.connect();

console.log("Connected to:", url.replace(/:[^@]+@/, ":***@"));

const types = await c.query(
  `SELECT vt.id, vt.name, vt.slug, COUNT(l.id) AS listings
   FROM "VehicleType" vt
   LEFT JOIN "Make" m ON m."vehicleTypeId" = vt.id
   LEFT JOIN "Listing" l ON l."makeId" = m.id AND l."isPublished" = true
   GROUP BY vt.id, vt.name, vt.slug
   ORDER BY vt."sortOrder" ASC, vt.name ASC`,
);
console.log("VehicleTypes (with published listings count):");
console.table(types.rows);

await c.end();
