/**
 * Seed sample seller accounts and listings for MVP demos.
 *
 * Usage:
 *   node scripts/seed-sample-listings.mjs
 */

import { randomBytes, scryptSync } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
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

function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const hashed = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hashed}`;
}

function cuidLike() {
  return `seed_${randomBytes(12).toString("hex")}`;
}

async function ensureSeller(client, payload) {
  const existing = await client.query(
    `SELECT "id" FROM "User" WHERE lower("email") = lower($1) LIMIT 1`,
    [payload.email],
  );
  if (existing.rows[0]?.id) {
    await client.query(
      `
      UPDATE "User"
      SET
        "name" = $1,
        "role" = $2,
        "sellerType" = $3,
        "companyName" = $4,
        "phone" = $5,
        "profileDescription" = $6,
        "isActive" = true,
        "isVerified" = true,
        "updatedAt" = now()
      WHERE "id" = $7
    `,
      [
        payload.name,
        payload.role,
        payload.sellerType,
        payload.companyName ?? null,
        payload.phone ?? null,
        payload.profileDescription ?? null,
        existing.rows[0].id,
      ],
    );
    return existing.rows[0].id;
  }

  const id = cuidLike();
  await client.query(
    `
    INSERT INTO "User" (
      "id", "name", "email", "passwordHash", "role", "sellerType", "companyName", "phone", "profileDescription", "isActive", "isVerified", "createdAt", "updatedAt"
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, true, true, now(), now()
    )
  `,
    [
      id,
      payload.name,
      payload.email.toLowerCase(),
      hashPassword(payload.password),
      payload.role,
      payload.sellerType,
      payload.companyName ?? null,
      payload.phone ?? null,
      payload.profileDescription ?? null,
    ],
  );
  return id;
}

async function upsertOption(client, table, name) {
  await client.query(
    `
    INSERT INTO "${table}" ("id", "name", "isActive", "updatedAt")
    VALUES ($1, $2, true, now())
    ON CONFLICT ("name")
    DO UPDATE SET "isActive" = true, "updatedAt" = now()
  `,
    [cuidLike(), name],
  );
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

async function createListingIfMissing(client, sellerId, item) {
  const slug = `${toSlug(item.title)}-seed`;
  const rel = await getMakeAndModel(client, item.makeName, item.modelName);
  if (!rel) return "skipped";

  const existing = await client.query(`SELECT "id" FROM "Listing" WHERE "slug" = $1 LIMIT 1`, [slug]);
  const payload = [
    sellerId,
    rel.makeName,
    rel.modelName,
    item.price,
    item.year,
    item.mileageKm,
    item.sellerType,
    item.fuelType,
    item.transmission,
    item.description,
    rel.makeId,
    rel.modelId,
    JSON.stringify({
      selectedFeatures: item.selectedFeatures,
      selectedTags: item.selectedTags ?? [],
      imageUrls: item.imageUrls,
    }),
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
        "updatedAt" = now()
      WHERE "slug" = $15
    `,
      [item.title, ...payload, slug],
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
      $1, $2, $3, $4, $5, $6, $7, 'EUR', $8,
      $9, $10, $11, $12, $13, true,
      $14, $15, $16::jsonb, now(), now()
    )
  `,
    [cuidLike(), item.title, slug, ...payload],
  );
  return "created";
}

async function main() {
  const databaseUrl = loadDatabaseUrl();
  if (!databaseUrl) {
    console.error("DATABASE_URL is missing.");
    process.exit(1);
  }

  const client = new Client({ connectionString: databaseUrl });
  await client.connect();

  const sellers = [
    {
      name: "AutoPrime Albania",
      email: "dealer@autoprime.al",
      password: "Dealer123!",
      role: "DEALER",
      sellerType: "DEALER",
      companyName: "AutoPrime Albania",
      phone: "+355681112233",
      profileDescription:
        "Trusted dealer focused on verified history, clear pricing, and after-sale support.",
    },
    {
      name: "Erjon Kola",
      email: "private.seller@example.com",
      password: "Seller123!",
      role: "PRIVATE_SELLER",
      sellerType: "PRIVATE",
      companyName: null,
      phone: "+355691234567",
      profileDescription: "Private seller with transparent listings and clean ownership history.",
    },
  ];

  const listingTemplates = [
    {
      sellerEmail: "dealer@autoprime.al",
      title: "Audi A4 2.0 TDI S-Line",
      makeName: "Audi",
      modelName: "A4",
      price: 17800,
      year: 2018,
      mileageKm: 128000,
      sellerType: "DEALER",
      fuelType: "DIESEL",
      transmission: "AUTOMATIC",
      description: "Well maintained dealer vehicle with full service history.",
      selectedFeatures: ["Navigation", "Parking Sensors", "Cruise Control"],
      selectedTags: ["No Accident", "One Owner"],
      imageUrls: [
        "https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=1600&q=80",
        "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&w=1600&q=80",
        "https://images.unsplash.com/photo-1523983388277-336a66bf9bcd?auto=format&fit=crop&w=1600&q=80",
      ],
    },
    {
      sellerEmail: "dealer@autoprime.al",
      title: "BMW 3 Series 320d",
      makeName: "BMW",
      modelName: "3 Series",
      price: 19400,
      year: 2019,
      mileageKm: 110500,
      sellerType: "DEALER",
      fuelType: "DIESEL",
      transmission: "AUTOMATIC",
      description: "Clean and ready for test drive.",
      selectedFeatures: ["Bluetooth", "Heated Seats", "Rear Camera"],
      selectedTags: ["No Accident", "Full Casco"],
      imageUrls: [
        "https://images.unsplash.com/photo-1532581140115-3e355d1ed1de?auto=format&fit=crop&w=1600&q=80",
        "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1600&q=80",
        "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?auto=format&fit=crop&w=1600&q=80",
      ],
    },
    {
      sellerEmail: "private.seller@example.com",
      title: "Volkswagen Golf 1.6 TDI",
      makeName: "Volkswagen",
      modelName: "Golf",
      price: 9200,
      year: 2014,
      mileageKm: 187300,
      sellerType: "PRIVATE",
      fuelType: "DIESEL",
      transmission: "MANUAL",
      description: "Private seller car in good condition, daily use.",
      selectedFeatures: ["Air Conditioning", "Bluetooth"],
      selectedTags: ["One Owner"],
      imageUrls: [
        "https://images.unsplash.com/photo-1542362567-b07e54358753?auto=format&fit=crop&w=1600&q=80",
        "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1600&q=80",
        "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1600&q=80",
      ],
    },
    {
      sellerEmail: "dealer@autoprime.al",
      title: "Mercedes-Benz C-Class 220d AMG",
      makeName: "Mercedes-Benz",
      modelName: "C-Class",
      price: 24600,
      year: 2020,
      mileageKm: 89500,
      sellerType: "DEALER",
      fuelType: "DIESEL",
      transmission: "AUTOMATIC",
      description: "Premium dealer listing with full AMG package and service history.",
      selectedFeatures: ["Navigation", "Heated Seats", "Rear Camera"],
      selectedTags: ["No Accident", "Full Casco"],
      imageUrls: [
        "https://images.unsplash.com/photo-1617469767053-d3b523a0b982?auto=format&fit=crop&w=1600&q=80",
        "https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=1600&q=80",
        "https://images.unsplash.com/photo-1590362891991-f776e747a588?auto=format&fit=crop&w=1600&q=80",
      ],
    },
    {
      sellerEmail: "private.seller@example.com",
      title: "Toyota Corolla Hybrid 1.8",
      makeName: "Toyota",
      modelName: "Corolla",
      price: 16900,
      year: 2021,
      mileageKm: 64200,
      sellerType: "PRIVATE",
      fuelType: "HYBRID",
      transmission: "AUTOMATIC",
      description: "Very economical private listing, ideal for city and family trips.",
      selectedFeatures: ["Bluetooth", "Cruise Control", "Parking Sensors"],
      selectedTags: ["One Owner", "No Accident"],
      imageUrls: [
        "https://images.unsplash.com/photo-1626668893632-6f3a4466d22f?auto=format&fit=crop&w=1600&q=80",
        "https://images.unsplash.com/photo-1619767886558-efdc259cde1a?auto=format&fit=crop&w=1600&q=80",
        "https://images.unsplash.com/photo-1553440569-bcc63803a83d?auto=format&fit=crop&w=1600&q=80",
      ],
    },
    {
      sellerEmail: "dealer@autoprime.al",
      title: "Hyundai Tucson 1.6 CRDi",
      makeName: "Hyundai",
      modelName: "Tucson",
      price: 21400,
      year: 2020,
      mileageKm: 103400,
      sellerType: "DEALER",
      fuelType: "DIESEL",
      transmission: "MANUAL",
      description: "Popular SUV in excellent condition, checked by our dealer workshop.",
      selectedFeatures: ["Navigation", "Parking Sensors", "Keyless Entry"],
      selectedTags: ["No Accident", "One Owner", "Full Casco"],
      imageUrls: [
        "https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&w=1600&q=80",
        "https://images.unsplash.com/photo-1502877338535-766e1452684a?auto=format&fit=crop&w=1600&q=80",
        "https://images.unsplash.com/photo-1504215680853-026ed2a45def?auto=format&fit=crop&w=1600&q=80",
      ],
    },
  ];

  try {
    await client.query("BEGIN");

    for (const tag of ["No Accident", "One Owner", "Full Casco"]) {
      await upsertOption(client, "ListingTagOption", tag);
    }
    for (const feature of [
      "Air Conditioning",
      "Leather Seats",
      "Navigation",
      "Parking Sensors",
      "Rear Camera",
      "Cruise Control",
      "Bluetooth",
      "Heated Seats",
      "Sunroof",
      "Keyless Entry",
    ]) {
      await upsertOption(client, "ListingFeatureOption", feature);
    }

    const sellerIdByEmail = new Map();
    for (const seller of sellers) {
      const id = await ensureSeller(client, seller);
      sellerIdByEmail.set(seller.email.toLowerCase(), id);
    }

    let createdCount = 0;
    let updatedCount = 0;
    for (const listing of listingTemplates) {
      const sellerId = sellerIdByEmail.get(listing.sellerEmail.toLowerCase());
      if (!sellerId) continue;
      const result = await createListingIfMissing(client, sellerId, listing);
      if (result === "created") createdCount += 1;
      if (result === "updated") updatedCount += 1;
    }

    await client.query("COMMIT");
    console.log(
      `Sample sellers ready: ${sellers.length}. New listings created: ${createdCount}. Listings updated: ${updatedCount}.`,
    );
    console.log("Login samples: dealer@autoprime.al / Dealer123! and private.seller@example.com / Seller123!");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
