/**
 * Generic listing scraper → NDJSON for `npm run db:import-listings-bulk`.
 *
 * ⚠️ Legal: Only use on sites you own, have a contract with, or that explicitly
 * allow scraping / offer an API or feed. Respect robots.txt and reasonable rate limits.
 *
 * 1. Edit SITE below (selectors must match the HTML of your permitted source).
 * 2. Set env:
 *      SCRAPE_DEFAULT_SELLER_EMAIL — must exist in your DB (e.g. dealer@autoprime.al)
 *      SCRAPE_DEFAULT_SELLER_TYPE — PRIVATE | DEALER (default DEALER)
 *      SCRAPE_OUTPUT — optional output path (default data/scraped.ndjson)
 * 3. Run: node scripts/scrape-to-ndjson.mjs
 * 4. Import: npm run db:import-listings-bulk -- data/scraped.ndjson
 *
 * makeName / modelName must match catalog rows (seed-catalog / Admin).
 */

import { writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import * as cheerio from "cheerio";

/** @typedef {{ sellerEmail: string, sellerType: "PRIVATE"|"DEALER", currency?: "EUR"|"ALL" }} Defaults */

/**
 * EDIT THIS for your permitted source site.
 * Selectors are CSS. Leave optional fields out if unused.
 */
const SITE = {
  /** Pages that list many ads (add multiple URLs for more inventory). */
  listUrls: [
    // "https://YOUR-PERMITTED-DOMAIN/search?q=cars",
  ],

  /** How to find each listing link on a list page */
  list: {
    /** Wrapper around one listing card (optional). If omitted, links are collected globally. */
    cardSelector: null,
    /** Anchor pointing to the detail page */
    linkSelector: 'a[href*="/listing/"]',
    hrefAttr: "href",
  },

  /** Detail page fields */
  detail: {
    title: "h1",
    /** Plain number or text like "€ 12.500" */
    price: "[data-price], .price",
    year: "[data-year], .year",
    mileageKm: "[data-mileage], .mileage",
    fuel: "[data-fuel], .fuel",
    transmission: "[data-transmission], .gearbox",
    description: ".description, .details",
    /** Image nodes; first N collected */
    images: ".gallery img, .photos img",
    imageSrcAttr: "src",
    /** If the site exposes make/model separately (recommended) */
    makeName: null,
    modelName: null,
  },

  /** Base URL if list/detail links are relative, e.g. https://example.com */
  origin: "",

  requestDelayMs: 1500,
  maxListingsPerRun: 500,
  userAgent: "MotivoCatalogBot/1.0 (+contact@yourdomain.com)",
};

// --- runtime defaults from env ---

function env(name, fallback = "") {
  const v = process.env[name];
  return v != null && String(v).trim() !== "" ? String(v).trim() : fallback;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchHtml(url) {
  const res = await fetch(url, {
    headers: {
      "User-Agent": SITE.userAgent,
      Accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9,sq;q=0.8",
    },
    redirect: "follow",
  });
  if (!res.ok) throw new Error(`GET ${url} → ${res.status}`);
  return res.text();
}

function absolutize(origin, href) {
  if (!href) return null;
  try {
    return new URL(href, origin || undefined).href;
  } catch {
    return null;
  }
}

function firstMatchText($, selectorList) {
  if (!selectorList) return "";
  const parts = String(selectorList)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  for (const sel of parts) {
    const el = $(sel).first();
    const t = el.text().trim();
    if (t) return t;
  }
  return "";
}

function parsePriceEUR(raw) {
  const s = String(raw).replace(/\s/g, "");
  const cleaned = s.replace(/[^\d.,]/g, "");
  if (!cleaned) return NaN;
  let normalized = cleaned;
  if (/,/.test(normalized) && /\./.test(normalized)) {
    if (normalized.lastIndexOf(",") > normalized.lastIndexOf(".")) {
      normalized = normalized.replace(/\./g, "").replace(",", ".");
    } else {
      normalized = normalized.replace(/,/g, "");
    }
  } else if (/,/.test(normalized)) {
    const parts = normalized.split(",");
    if (parts.length === 2 && parts[1].length <= 2) normalized = parts.join(".");
    else normalized = normalized.replace(/,/g, "");
  }
  const n = Number.parseFloat(normalized);
  return Number.isFinite(n) ? Math.round(n) : NaN;
}

function parseKm(raw) {
  const digits = String(raw).replace(/[^\d]/g, "");
  const n = Number.parseInt(digits, 10);
  return Number.isFinite(n) ? n : NaN;
}

function parseYear(raw) {
  const m = String(raw).match(/(19|20)\d{2}/);
  return m ? Number.parseInt(m[0], 10) : NaN;
}

function mapFuel(text) {
  const t = String(text).toLowerCase();
  if (t.includes("diesel")) return "DIESEL";
  if (t.includes("electric") || t.includes("ev ") || t === "ev") return "ELECTRIC";
  if (t.includes("hybrid")) return "HYBRID";
  if (t.includes("petrol") || t.includes("gasoline") || t.includes("benzin")) return "PETROL";
  return "PETROL";
}

function mapTransmission(text) {
  const t = String(text).toLowerCase();
  if (t.includes("manual")) return "MANUAL";
  return "AUTOMATIC";
}

/** Very rough fallback: "Audi A4 2018 ..." → make + model guess */
function guessMakeModelFromTitle(title) {
  const words = String(title).trim().split(/\s+/).filter(Boolean);
  if (words.length < 2) return { makeName: "", modelName: "" };
  const makeName = words[0];
  const modelName = words.slice(1).join(" ");
  return { makeName, modelName };
}

function collectLinksFromListPage(html, listOrigin) {
  const $ = cheerio.load(html);
  const seen = new Set();
  const out = [];

  const baseOrigin =
    listOrigin ||
    SITE.origin ||
    (SITE.listUrls[0] ? new URL(SITE.listUrls[0]).origin : "");

  if (SITE.list.cardSelector) {
    $(SITE.list.cardSelector).each((_, el) => {
      const a = $(el).find(SITE.list.linkSelector).first();
      const href = a.attr(SITE.list.hrefAttr);
      const abs = absolutize(baseOrigin, href);
      if (abs && !seen.has(abs)) {
        seen.add(abs);
        out.push(abs);
      }
    });
  } else {
    $(SITE.list.linkSelector).each((_, el) => {
      const href = $(el).attr(SITE.list.hrefAttr);
      const abs = absolutize(baseOrigin, href);
      if (abs && !seen.has(abs)) {
        seen.add(abs);
        out.push(abs);
      }
    });
  }

  return out;
}

function parseDetail(html, url) {
  const $ = cheerio.load(html);
  const det = SITE.detail;

  let title = firstMatchText($, det.title);
  let makeName = det.makeName ? $(det.makeName).first().text().trim() : "";
  let modelName = det.modelName ? $(det.modelName).first().text().trim() : "";

  if (!makeName || !modelName) {
    const g = guessMakeModelFromTitle(title);
    if (!makeName) makeName = g.makeName;
    if (!modelName) modelName = g.modelName;
  }

  const price = parsePriceEUR(firstMatchText($, det.price));
  const year = parseYear(firstMatchText($, det.year));
  const mileageKm = parseKm(firstMatchText($, det.mileageKm));
  const fuelType = mapFuel(firstMatchText($, det.fuel));
  const transmission = mapTransmission(firstMatchText($, det.transmission));
  const description =
    firstMatchText($, det.description) || title || "Imported listing.";
  const imageUrls = [];
  $(det.images).each((i, el) => {
    if (i >= 12) return false;
    const src = $(el).attr(det.imageSrcAttr || "src");
    const abs = absolutize(SITE.origin || new URL(url).origin, src);
    if (abs && /^https?:\/\//i.test(abs)) imageUrls.push(abs);
    return undefined;
  });

  return {
    title: title || "Listing",
    makeName,
    modelName,
    price,
    year,
    mileageKm,
    fuelType,
    transmission,
    description,
    imageUrls,
    sourceUrl: url,
  };
}

async function main() {
  const sellerEmail = env("SCRAPE_DEFAULT_SELLER_EMAIL");
  const sellerType = env("SCRAPE_DEFAULT_SELLER_TYPE", "DEALER");
  const outputPath = resolve(process.cwd(), env("SCRAPE_OUTPUT", "data/scraped.ndjson"));

  if (!sellerEmail) {
    console.error("Set SCRAPE_DEFAULT_SELLER_EMAIL to a User.email that exists in your database.");
    process.exit(1);
  }
  if (!["PRIVATE", "DEALER"].includes(sellerType)) {
    console.error("SCRAPE_DEFAULT_SELLER_TYPE must be PRIVATE or DEALER");
    process.exit(1);
  }
  if (!SITE.listUrls.length || !SITE.listUrls[0]) {
    console.error('Edit scripts/scrape-to-ndjson.mjs — add at least one URL to SITE.listUrls.');
    process.exit(1);
  }

  const allDetailUrls = [];
  for (const listUrl of SITE.listUrls) {
    const originForPage = SITE.origin || new URL(listUrl).origin;
    console.error(`List page: ${listUrl}`);
    const html = await fetchHtml(listUrl);
    const links = collectLinksFromListPage(html, originForPage);
    console.error(`  Found ${links.length} listing links`);
    allDetailUrls.push(...links);
    await sleep(SITE.requestDelayMs);
  }

  const unique = [...new Set(allDetailUrls)].slice(0, SITE.maxListingsPerRun);
  console.error(`Fetching ${unique.length} detail pages…`);

  const lines = [];
  let ok = 0;
  let bad = 0;

  for (let i = 0; i < unique.length; i++) {
    const url = unique[i];
    try {
      const html = await fetchHtml(url);
      const row = parseDetail(html, url);
      if (!Number.isFinite(row.price) || row.price <= 0) {
        console.error(`Skip (bad price): ${url}`);
        bad += 1;
        continue;
      }
      if (!Number.isFinite(row.year) || row.year < 1950 || row.year > new Date().getFullYear() + 1) {
        console.error(`Skip (bad year): ${url}`);
        bad += 1;
        continue;
      }
      if (!Number.isFinite(row.mileageKm) || row.mileageKm < 0) {
        console.error(`Skip (bad mileage): ${url}`);
        bad += 1;
        continue;
      }
      if (!row.makeName?.trim() || !row.modelName?.trim()) {
        console.error(`Skip (missing make/model): ${url}`);
        bad += 1;
        continue;
      }

      const record = {
        sellerEmail,
        sellerType,
        currency: env("SCRAPE_CURRENCY", "EUR"),
        title: row.title,
        makeName: row.makeName.trim(),
        modelName: row.modelName.trim(),
        price: row.price,
        year: row.year,
        mileageKm: row.mileageKm,
        fuelType: row.fuelType,
        transmission: row.transmission,
        description: row.description.trim(),
        externalId: url,
        imageUrls: row.imageUrls,
      };
      lines.push(JSON.stringify(record));
      ok += 1;
    } catch (e) {
      console.error(`Error ${url}:`, e.message || e);
      bad += 1;
    }
    await sleep(SITE.requestDelayMs);
    if ((i + 1) % 25 === 0) console.error(`Progress ${i + 1}/${unique.length}`);
  }

  const dir = dirname(outputPath);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(outputPath, lines.join("\n") + (lines.length ? "\n" : ""), "utf8");

  console.error(`Done. written=${ok} skipped/errors=${bad} → ${outputPath}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
