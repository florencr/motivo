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

const total = await c.query(`SELECT COUNT(*) FROM "Listing"`);
console.log("Total listings:", total.rows[0].count);

const pub = await c.query(`SELECT COUNT(*) FROM "Listing" WHERE "isPublished" = true`);
console.log("Published listings:", pub.rows[0].count);

const grouped = await c.query(`
  SELECT vt.slug as type_slug, COUNT(l.id) as count
  FROM "Listing" l
  LEFT JOIN "Make" m ON m.id = l."makeId"
  LEFT JOIN "VehicleType" vt ON vt.id = m."vehicleTypeId"
  WHERE l."isPublished" = true
  GROUP BY vt.slug
  ORDER BY count DESC
`);
console.log("Published listings by vehicle type:");
console.table(grouped.rows);

const noMake = await c.query(`
  SELECT COUNT(*)
  FROM "Listing" l
  LEFT JOIN "Make" m ON m.id = l."makeId"
  WHERE l."isPublished" = true AND m.id IS NULL
`);
console.log("Published listings with NO make:", noMake.rows[0].count);

const noVehicleType = await c.query(`
  SELECT COUNT(*)
  FROM "Listing" l
  LEFT JOIN "Make" m ON m.id = l."makeId"
  LEFT JOIN "VehicleType" vt ON vt.id = m."vehicleTypeId"
  WHERE l."isPublished" = true AND vt.id IS NULL
`);
console.log("Published listings with NO vehicle type:", noVehicleType.rows[0].count);

const sample = await c.query(`
  SELECT l.id, l.title, l.city, l."makeName", l."modelName", l."isPublished",
         m.name as make, vt.slug as type_slug
  FROM "Listing" l
  LEFT JOIN "Make" m ON m.id = l."makeId"
  LEFT JOIN "VehicleType" vt ON vt.id = m."vehicleTypeId"
  WHERE l."isPublished" = true
  ORDER BY l."createdAt" DESC
  LIMIT 30
`);
console.log("First 30 published listings:");
console.table(sample.rows);

await c.end();
