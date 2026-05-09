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

const updates = [
  {
    email: "dealer1@motivo.auto",
    role: "DEALER",
    sellerType: "DEALER",
    name: "Motivo Dealer 1",
    companyName: "Motivo Dealer 1",
  },
  {
    email: "njoftime@motivo.autos",
    role: "PRIVATE_SELLER",
    sellerType: "PRIVATE",
    name: "Private Seller",
    companyName: null,
  },
];

for (const u of updates) {
  const res = await c.query(
    `UPDATE "User"
     SET role = $1, "sellerType" = $2, name = $3, "companyName" = $4
     WHERE LOWER(email) = LOWER($5)
     RETURNING id, email, role, "sellerType", name, "companyName"`,
    [u.role, u.sellerType, u.name, u.companyName, u.email],
  );
  if (res.rowCount === 0) {
    console.warn(`No user found for ${u.email}`);
  } else {
    console.log("Updated:", res.rows[0]);
  }
}

await c.end();
