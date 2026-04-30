/**
 * Seed catalog data for vehicle posting:
 * - vehicle types
 * - categories (vehicle segments)
 * - makes
 * - models
 *
 * Usage:
 *   node scripts/seed-catalog.mjs
 */

import { readFileSync, existsSync } from "node:fs";
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
  return merged.DATABASE_URL?.trim() ?? "";
}

function toSlug(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const CATALOG = [
  {
    type: "Cars",
    segments: ["Sedan", "Hatchback", "SUV", "Coupe", "Convertible", "Wagon", "Van"],
    makes: [
      { name: "Volkswagen", segment: "Hatchback", models: ["Golf", "Polo", "Passat", "Tiguan", "Touareg"] },
      { name: "Mercedes-Benz", segment: "Sedan", models: ["A-Class", "C-Class", "E-Class", "S-Class", "GLC"] },
      { name: "BMW", segment: "Sedan", models: ["1 Series", "3 Series", "5 Series", "X3", "X5"] },
      { name: "Audi", segment: "Sedan", models: ["A3", "A4", "A6", "Q3", "Q5"] },
      { name: "Toyota", segment: "SUV", models: ["Corolla", "Yaris", "RAV4", "C-HR", "Hilux"] },
      { name: "Ford", segment: "SUV", models: ["Fiesta", "Focus", "Kuga", "Puma", "Ranger"] },
      { name: "Hyundai", segment: "SUV", models: ["i20", "i30", "Tucson", "Santa Fe", "Kona"] },
      { name: "Kia", segment: "SUV", models: ["Rio", "Ceed", "Sportage", "Sorento", "Stonic"] },
      { name: "Skoda", segment: "Sedan", models: ["Fabia", "Octavia", "Superb", "Kodiaq", "Kamiq"] },
      { name: "Renault", segment: "Hatchback", models: ["Clio", "Megane", "Captur", "Kadjar", "Koleos"] },
    ],
  },
  {
    type: "Motorcycles",
    segments: ["Naked", "Sport", "Touring", "Scooter", "Adventure", "Cruiser"],
    makes: [
      { name: "Yamaha", segment: "Sport", models: ["MT-07", "R1", "Tracer 9", "NMAX", "Tenere 700"] },
      { name: "Honda", segment: "Scooter", models: ["CB500F", "CBR600RR", "Africa Twin", "PCX", "Forza"] },
      { name: "Kawasaki", segment: "Sport", models: ["Z650", "Ninja 650", "Versys 650", "Z900", "Vulcan S"] },
      { name: "Suzuki", segment: "Sport", models: ["GSX-R600", "SV650", "V-Strom 650", "Burgman", "Hayabusa"] },
      { name: "Ducati", segment: "Sport", models: ["Monster", "Panigale V2", "Multistrada", "Scrambler", "Diavel"] },
    ],
  },
  {
    type: "Trucks",
    segments: ["Light Duty", "Medium Duty", "Heavy Duty", "Pickup"],
    makes: [
      { name: "MAN", segment: "Heavy Duty", models: ["TGL", "TGM", "TGS", "TGX"] },
      { name: "Volvo Trucks", segment: "Heavy Duty", models: ["FH", "FM", "FE"] },
      { name: "Scania", segment: "Heavy Duty", models: ["P-Series", "G-Series", "R-Series", "S-Series"] },
      { name: "Iveco", segment: "Medium Duty", models: ["Daily", "Eurocargo", "S-Way"] },
      { name: "Ford Trucks", segment: "Heavy Duty", models: ["F-MAX", "Cargo"] },
    ],
  },
  {
    type: "Boats",
    segments: ["Motorboat", "Yacht", "Sailing", "Jet Ski", "RIB"],
    makes: [
      { name: "Yamaha Marine", segment: "Jet Ski", models: ["FX Cruiser", "GP SVHO", "VX Deluxe"] },
      { name: "Bayliner", segment: "Motorboat", models: ["VR4", "VR5", "Element M17"] },
      { name: "Sea Ray", segment: "Yacht", models: ["SPX 190", "SLX 280", "Sundancer 320"] },
      { name: "Beneteau", segment: "Sailing", models: ["Oceanis 30.1", "Oceanis 34.1", "First 36"] },
      { name: "Jeanneau", segment: "Sailing", models: ["Sun Odyssey 349", "Sun Odyssey 410", "Leader 33"] },
    ],
  },
];

async function upsertVehicleType(client, name, sortOrder) {
  const slug = toSlug(name);
  const id = `seed_vtype_${slug}`;
  const res = await client.query(
    `
    INSERT INTO "VehicleType" ("id", "name", "slug", "sortOrder", "updatedAt")
    VALUES ($1, $2, $3, $4, now())
    ON CONFLICT ("slug")
    DO UPDATE SET "name" = EXCLUDED."name", "sortOrder" = EXCLUDED."sortOrder", "updatedAt" = now()
    RETURNING "id"
  `,
    [id, name, slug, sortOrder],
  );
  return res.rows[0].id;
}

async function upsertSegment(client, vehicleTypeId, name, sortOrder) {
  const slug = toSlug(name);
  const id = `seed_vseg_${vehicleTypeId}_${slug}`.slice(0, 190);
  const res = await client.query(
    `
    INSERT INTO "VehicleSegment" ("id", "vehicleTypeId", "name", "slug", "sortOrder", "updatedAt")
    VALUES ($1, $2, $3, $4, $5, now())
    ON CONFLICT ("vehicleTypeId", "slug")
    DO UPDATE SET "name" = EXCLUDED."name", "sortOrder" = EXCLUDED."sortOrder", "updatedAt" = now()
    RETURNING "id"
  `,
    [id, vehicleTypeId, name, slug, sortOrder],
  );
  return res.rows[0].id;
}

async function upsertMake(client, vehicleTypeId, segmentId, name) {
  const slug = toSlug(name);
  const id = `seed_make_${vehicleTypeId}_${slug}`.slice(0, 190);
  const res = await client.query(
    `
    INSERT INTO "Make" ("id", "name", "slug", "vehicleTypeId", "segmentId", "updatedAt")
    VALUES ($1, $2, $3, $4, $5, now())
    ON CONFLICT ("vehicleTypeId", "slug")
    DO UPDATE SET "name" = EXCLUDED."name", "segmentId" = EXCLUDED."segmentId", "updatedAt" = now()
    RETURNING "id"
  `,
    [id, name, slug, vehicleTypeId, segmentId],
  );
  return res.rows[0].id;
}

async function upsertModel(client, makeId, name) {
  const slug = toSlug(name);
  const id = `seed_model_${makeId}_${slug}`.slice(0, 190);
  await client.query(
    `
    INSERT INTO "Model" ("id", "makeId", "name", "slug", "updatedAt")
    VALUES ($1, $2, $3, $4, now())
    ON CONFLICT ("makeId", "slug")
    DO UPDATE SET "name" = EXCLUDED."name", "updatedAt" = now()
  `,
    [id, makeId, name, slug],
  );
}

async function main() {
  const connectionString = loadDatabaseUrl();
  if (!connectionString) {
    console.error("DATABASE_URL is missing.");
    process.exit(1);
  }

  const client = new Client({ connectionString });
  await client.connect();

  try {
    await client.query("BEGIN");

    for (let typeIndex = 0; typeIndex < CATALOG.length; typeIndex += 1) {
      const item = CATALOG[typeIndex];
      const vehicleTypeId = await upsertVehicleType(client, item.type, typeIndex + 1);
      const segmentIdByName = new Map();

      for (let segIndex = 0; segIndex < item.segments.length; segIndex += 1) {
        const segmentName = item.segments[segIndex];
        const segmentId = await upsertSegment(client, vehicleTypeId, segmentName, segIndex + 1);
        segmentIdByName.set(segmentName, segmentId);
      }

      for (const make of item.makes) {
        const segmentId = segmentIdByName.get(make.segment) ?? null;
        const makeId = await upsertMake(client, vehicleTypeId, segmentId, make.name);
        for (const modelName of make.models) {
          await upsertModel(client, makeId, modelName);
        }
      }
    }

    await client.query("COMMIT");
    console.log("Catalog seeded successfully.");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
