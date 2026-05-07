/**
 * Bulk-insert listings from a newline-delimited JSON file (NDJSON).
 * Each line is one JSON object. Use this after your own scraper/exporter
 * produces data you are legally allowed to use.
 *
 * Required fields per line:
 *   sellerEmail, title, makeName, modelName, price (number),
 *   year, mileageKm, sellerType ("PRIVATE"|"DEALER"),
 *   fuelType ("PETROL"|"DIESEL"|"ELECTRIC"|"HYBRID"),
 *   transmission ("MANUAL"|"AUTOMATIC"),
 *   description (string)
 *
 * Optional: slug (stable unique), externalId (used if slug omitted),
 *   currency ("EUR"|"ALL"), selectedFeatures, selectedTags, imageUrls
 *
 * makeName/modelName must match rows already in your DB (see seed-catalog).
 *
 * Usage:
 *   node scripts/import-listings-bulk.mjs path/to/listings.ndjson
 */

import { createHash, randomBytes } from "node:crypto";
import { createReadStream, existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import readline from "node:readline";
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
  if (process.env.DATABASE_URL?.trim()) return process.env.DATABASE_URL.trim();
  const root = resolve(process.cwd());
  const merged = {};
  for (const name of [".env", ".env.production"]) {
    const p = resolve(root, name);
    if (!existsSync(p)) continue;
    Object.assign(merged, parseEnvFile(readFileSync(p, "utf8")));
  }
  return merged.DATABASE_URL?.trim() ?? "";
}

function toSlug(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function cuidLike() {
  return `imp_${randomBytes(12).toString("hex")}`;
}

function stableSlugFromExternalId(externalId) {
  const h = createHash("sha256").update(String(externalId)).digest("hex").slice(0, 24);
  return `bulk-${h}`;
}

async function getMakeAndModel(client, makeName, modelName) {
  const row = await client.query(
    `
    SELECT m."id" AS "makeId", m."name" AS "makeName", md."id" AS "modelId", md."name" AS "modelName"
    FROM "Make" m
    JOIN "Model" md ON md."makeId" = m."id"
    WHERE lower(m."name") = lower($1) AND lower(md."name") = lower($2)
    LIMIT 1
  `,
    [makeName, modelName],
  );
  return row.rows[0] ?? null;
}

async function getSellerId(client, email) {
  const row = await client.query(`SELECT "id" FROM "User" WHERE lower("email") = lower($1) LIMIT 1`, [
    email,
  ]);
  return row.rows[0]?.id ?? null;
}

const FUEL = new Set(["PETROL", "DIESEL", "ELECTRIC", "HYBRID"]);
const TRANS = new Set(["MANUAL", "AUTOMATIC"]);
const SELLER = new Set(["PRIVATE", "DEALER"]);
const CUR = new Set(["EUR", "ALL"]);

function resolveSlug(record) {
  if (record.slug && String(record.slug).trim()) return String(record.slug).trim();
  if (record.externalId != null && String(record.externalId).trim())
    return stableSlugFromExternalId(record.externalId);
  const base = toSlug(record.title || "listing");
  return `${base || "listing"}-${randomBytes(4).toString("hex")}`;
}

async function upsertListing(client, sellerId, record, rel) {
  const slug = resolveSlug(record);
  const currency = CUR.has(record.currency) ? record.currency : "EUR";
  const fuelType = record.fuelType;
  const transmission = record.transmission;
  const sellerType = record.sellerType;

  const features = JSON.stringify({
    selectedFeatures: record.selectedFeatures ?? [],
    selectedTags: record.selectedTags ?? [],
    imageUrls: record.imageUrls ?? [],
  });

  const existing = await client.query(`SELECT "id" FROM "Listing" WHERE "slug" = $1 LIMIT 1`, [slug]);

  const updateVals = [
    String(record.title),
    sellerId,
    rel.makeName,
    rel.modelName,
    String(record.price),
    Number(record.year),
    Number(record.mileageKm),
    sellerType,
    fuelType,
    transmission,
    String(record.description),
    rel.makeId,
    rel.modelId,
    features,
    currency,
    slug,
  ];

  if (existing.rows[0]?.id) {
    await client.query(
      `
      UPDATE "Listing"
      SET
        "title" = $1,
        "sellerId" = $2,
        "makeName" = $3,
        "modelName" = $4,
        "price" = $5,
        "year" = $6,
        "mileageKm" = $7,
        "sellerType" = $8,
        "fuelType" = $9,
        "transmission" = $10,
        "description" = $11,
        "isPublished" = true,
        "makeId" = $12,
        "modelId" = $13,
        "features" = $14::jsonb,
        "currency" = $15::"Currency",
        "updatedAt" = now()
      WHERE "slug" = $16
    `,
      updateVals,
    );
    return "updated";
  }

  await client.query(
    `
    INSERT INTO "Listing" (
      "id", "title", "slug", "sellerId", "makeName", "modelName", "price", "currency", "year",
      "mileageKm", "sellerType", "fuelType", "transmission", "description", "isPublished",
      "makeId", "modelId", "features", "createdAt", "updatedAt"
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8::"Currency", $9,
      $10, $11, $12, $13, $14, true,
      $15, $16, $17::jsonb, now(), now()
    )
  `,
    [
      cuidLike(),
      String(record.title),
      slug,
      sellerId,
      rel.makeName,
      rel.modelName,
      String(record.price),
      currency,
      Number(record.year),
      Number(record.mileageKm),
      sellerType,
      fuelType,
      transmission,
      String(record.description),
      rel.makeId,
      rel.modelId,
      features,
    ],
  );
  return "created";
}

function validateRecord(record, lineNo) {
  const req = [
    "sellerEmail",
    "title",
    "makeName",
    "modelName",
    "price",
    "year",
    "mileageKm",
    "sellerType",
    "fuelType",
    "transmission",
    "description",
  ];
  for (const k of req) {
    if (record[k] === undefined || record[k] === null || record[k] === "") {
      return `line ${lineNo}: missing "${k}"`;
    }
  }
  if (!FUEL.has(record.fuelType)) return `line ${lineNo}: invalid fuelType`;
  if (!TRANS.has(record.transmission)) return `line ${lineNo}: invalid transmission`;
  if (!SELLER.has(record.sellerType)) return `line ${lineNo}: invalid sellerType`;
  if (record.currency != null && !CUR.has(record.currency)) return `line ${lineNo}: invalid currency`;
  return null;
}

async function main() {
  const filePath = resolve(process.argv[2] || "data/listings-bulk.ndjson");
  if (!existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    console.error("Usage: node scripts/import-listings-bulk.mjs <path-to.ndjson>");
    process.exit(1);
  }

  const databaseUrl = loadDatabaseUrl();
  if (!databaseUrl) {
    console.error("DATABASE_URL is missing.");
    process.exit(1);
  }

  const client = new Client({ connectionString: databaseUrl });
  await client.connect();

  let created = 0;
  let updated = 0;
  let skipped = 0;
  let errors = 0;

  const rl = readline.createInterface({
    input: createReadStream(filePath, { encoding: "utf8" }),
    crlfDelay: Infinity,
  });

  let lineNo = 0;
  const rows = [];
  for await (const line of rl) {
    lineNo += 1;
    const trimmed = line.trim();
    if (!trimmed) continue;
    let record;
    try {
      record = JSON.parse(trimmed);
    } catch {
      console.warn(`line ${lineNo}: invalid JSON, skipped`);
      errors += 1;
      continue;
    }
    const err = validateRecord(record, lineNo);
    if (err) {
      console.warn(err);
      errors += 1;
      continue;
    }
    rows.push({ lineNo, record });
  }

  try {
    await client.query("BEGIN");
    for (const { lineNo, record } of rows) {
      const sellerId = await getSellerId(client, record.sellerEmail);
      if (!sellerId) {
        console.warn(`line ${lineNo}: unknown sellerEmail "${record.sellerEmail}", skipped`);
        skipped += 1;
        continue;
      }
      const rel = await getMakeAndModel(client, record.makeName, record.modelName);
      if (!rel) {
        console.warn(
          `line ${lineNo}: make/model not in catalog: "${record.makeName}" / "${record.modelName}", skipped`,
        );
        skipped += 1;
        continue;
      }
      const result = await upsertListing(client, sellerId, record, rel);
      if (result === "created") created += 1;
      else updated += 1;
    }
    await client.query("COMMIT");
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    await client.end();
  }

  console.log(`Done. created=${created} updated=${updated} skipped=${skipped} json_errors=${errors}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
