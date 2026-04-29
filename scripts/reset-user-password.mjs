/**
 * Reset a user's password (same hashing as lib/auth.ts).
 *
 * Loads DATABASE_URL from env, or from files in order (later overrides earlier):
 *   .env  →  .env.production
 *
 * Usage:
 *   node scripts/reset-user-password.mjs <email> <newPassword>
 *
 * For Neon / production, put the Neon connection string in `.env.production`:
 *   DATABASE_URL="postgresql://..."
 */

import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { randomBytes, scryptSync } from "node:crypto";
import { Client } from "pg";

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

function loadDatabaseUrl() {
  if (process.env.DATABASE_URL?.trim()) {
    return process.env.DATABASE_URL.trim();
  }
  const root = resolve(process.cwd());
  const merged = {};
  for (const name of [".env", ".env.production"]) {
    const p = resolve(root, name);
    if (!existsSync(p)) continue;
    Object.assign(merged, parseEnvFile(readFileSync(p, "utf8")));
  }
  const url = merged.DATABASE_URL?.trim();
  return url || "";
}

function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const hashed = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hashed}`;
}

async function main() {
  const email = String(process.argv[2] ?? "").trim().toLowerCase();
  const password = String(process.argv[3] ?? "");
  if (!email || !password) {
    console.error("Usage: node scripts/reset-user-password.mjs <email> <newPassword>");
    process.exit(1);
  }
  if (password.length < 8) {
    console.error("Password must be at least 8 characters.");
    process.exit(1);
  }

  const connectionString = loadDatabaseUrl();
  if (!connectionString) {
    console.error(
      "DATABASE_URL is missing. Set it in the environment, or add it to .env.production (recommended for Neon).",
    );
    process.exit(1);
  }

  const passwordHash = hashPassword(password);
  const client = new Client({ connectionString });
  await client.connect();
  const res = await client.query(
    'UPDATE "User" SET "passwordHash" = $1, "role" = \'ADMIN\' WHERE lower("email") = lower($2)',
    [passwordHash, email],
  );
  await client.end();
  console.log(`updated_rows ${res.rowCount}`);
  if (res.rowCount === 0) {
    console.error("No user matched that email on this database.");
    process.exit(2);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
