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

const sources = await c.query('SELECT name, "connectorKey", "defaultSellerEmail" FROM "ImportSource" ORDER BY name');
console.log("ImportSources:");
console.table(sources.rows);

const users = await c.query('SELECT id, email, role, "companyName", name FROM "User" ORDER BY email');
console.log("Users:");
console.table(users.rows);

const listingsCount = await c.query('SELECT COUNT(*) AS c FROM "Listing"');
console.log("Listing total:", listingsCount.rows[0].c);

const sellers = await c.query(
  `SELECT u.email, u.role, u."companyName", COUNT(l.id) AS listings
   FROM "User" u LEFT JOIN "Listing" l ON l."sellerId" = u.id
   GROUP BY u.id, u.email, u.role, u."companyName"
   ORDER BY listings DESC`,
);
console.log("Listings by seller:");
console.table(sellers.rows);

await c.end();
