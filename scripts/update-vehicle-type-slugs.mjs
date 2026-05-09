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
  for (const name of [".env", ".env.production"]) {
    const p = resolve(root, name);
    if (!existsSync(p)) continue;
    const env = parseEnvFile(readFileSync(p, "utf8"));
    if (env.DATABASE_URL?.trim()) return env.DATABASE_URL.trim();
  }
  return "";
}

const url = neonDirectUrl(loadUrl());
const c = new Client({ connectionString: url });
await c.connect();

console.log("Connected to:", url.replace(/:[^@]+@/, ":***@"));

const updates = [
  { id: "seed_vtype_cars", name: "Makina", slug: "makina" },
  { id: "seed_vtype_motorcycles", name: "Motoçikleta", slug: "motocikleta" },
  { id: "seed_vtype_vans", name: "Furgona", slug: "furgona" },
  { id: "seed_vtype_boats", name: "Varka", slug: "varka" },
  { id: "seed_vtype_trucks", name: "Kamionë", slug: "kamione" },
];

for (const u of updates) {
  const res = await c.query(
    `UPDATE "VehicleType" SET name = $1, slug = $2 WHERE id = $3 RETURNING id, name, slug`,
    [u.name, u.slug, u.id],
  );
  if (res.rows.length > 0) {
    console.log("Updated:", res.rows[0]);
  } else {
    console.log("Not found:", u.id);
  }
}

const verify = await c.query(`SELECT id, name, slug FROM "VehicleType" ORDER BY "sortOrder" ASC`);
console.log("Final state:");
console.table(verify.rows);

await c.end();
