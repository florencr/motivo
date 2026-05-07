import * as cheerio from "cheerio";
import {
  absolutizeUrl,
  guessMakeModelFromTitle,
  mapFuel,
  mapTransmission,
  parsePriceMajor,
  parseYear,
} from "@/lib/imports/parsers";
import type { Connector, ConnectorContext, NormalizedListing } from "@/lib/imports/types";

type MerrjepConfig = {
  userAgent?: string;
  /** Optional hand-picked details to include while testing a new strategy. */
  detailUrls?: string[];
};

const DEFAULT_USER_AGENT =
  "MotivoBot/1.0 (+contact@motivo.example) - admin-managed MerrJep import";

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

async function fetchHtml(url: string, userAgent: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      "User-Agent": userAgent,
      Accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "sq-AL,sq;q=0.9,en-US;q=0.8,en;q=0.7",
    },
    redirect: "follow",
  });
  if (!res.ok) throw new Error(`GET ${url} -> ${res.status}`);
  return res.text();
}

function cleanText(value: string | undefined | null): string {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim();
}

function meta($: cheerio.CheerioAPI, selector: string): string {
  return cleanText($(selector).attr("content"));
}

function normalizeTitle(raw: string): string {
  return cleanText(raw.replace(/\s*\|\s*MerrJep\.al\s*$/i, "").split("|")[0]);
}

function normalizeMake(value: string): string {
  const v = cleanText(value);
  if (/^vw\s+volkswagen$/i.test(v)) return "Volkswagen";
  if (/^mercedes$/i.test(v)) return "Mercedes-Benz";
  return v;
}

function parseMileageRange(value: string): number {
  const match = cleanText(value).match(/\d[\d\s.]*/);
  if (!match) return Number.NaN;
  const digits = match[0].replace(/[^\d]/g, "");
  const n = Number.parseInt(digits, 10);
  return Number.isFinite(n) ? n : Number.NaN;
}

function extractPrice(text: string): { price: number; currency: "EUR" | "ALL" } {
  const t = cleanText(text);
  const cmimi = t.match(/(?:cmimi|çmimi)\s*:\s*([\d\s.,]+)\s*(euro|eur|lek|all)/i);
  if (cmimi) {
    return {
      price: parsePriceMajor(cmimi[1]),
      currency: /lek|all/i.test(cmimi[2]) ? "ALL" : "EUR",
    };
  }

  const generic = t.match(/([\d\s.,]+)\s*(euro|eur|lek|all)\b/i);
  if (generic) {
    return {
      price: parsePriceMajor(generic[1]),
      currency: /lek|all/i.test(generic[2]) ? "ALL" : "EUR",
    };
  }

  return { price: Number.NaN, currency: "EUR" };
}

function collectListLinks(html: string, origin: string): string[] {
  const $ = cheerio.load(html);
  const out = new Set<string>();

  $('a[href*="/njoftim/"]').each((_, el) => {
    const abs = absolutizeUrl(origin, $(el).attr("href"));
    if (abs && /^https:\/\/www\.merrjep\.al\/njoftim\//i.test(abs)) {
      out.add(abs.split("?")[0]);
    }
  });

  return [...out];
}

function extractTags($: cheerio.CheerioAPI): Record<string, string> {
  const tags: Record<string, string> = {};
  $(".tag-item").each((_, el) => {
    const label = cleanText($(el).find("span").first().text()).replace(/:$/, "");
    const value = cleanText($(el).find("bdi").first().text());
    if (label && value) tags[label] = value;
  });
  return tags;
}

function extractImages($: cheerio.CheerioAPI): string[] {
  const out = new Set<string>();

  for (const selector of ['meta[property="og:image"]', 'meta[name="twitter:image"]']) {
    const value = $(selector).attr("content");
    if (value && /^https?:\/\//i.test(value)) out.add(value);
  }

  $("img").each((_, el) => {
    const src =
      $(el).attr("src") ||
      $(el).attr("data-src") ||
      $(el).attr("data-original") ||
      $(el).attr("data-lazy");
    if (src && /media\.merrjep\.al\/Image/i.test(src)) {
      out.add(src);
    }
  });

  return [...out].slice(0, 12);
}

function sellerTypeFromTag(value: string): "PRIVATE" | "DEALER" {
  return /kompani|dyqan|company/i.test(value) ? "DEALER" : "PRIVATE";
}

function parseDetail(html: string, url: string): NormalizedListing | null {
  const $ = cheerio.load(html);
  const tags = extractTags($);
  const title =
    normalizeTitle($("h1").first().text()) ||
    normalizeTitle(meta($, 'meta[property="og:title"]')) ||
    normalizeTitle(meta($, 'meta[name="title"]')) ||
    normalizeTitle($("title").text());

  const description =
    meta($, 'meta[name="description"]') ||
    meta($, 'meta[property="og:description"]') ||
    title;

  const priceFromMeta = extractPrice(description);
  const pageText = cleanText($("body").text());
  const price = Number.isFinite(priceFromMeta.price)
    ? priceFromMeta
    : extractPrice(pageText.slice(0, 3000));

  let makeName = normalizeMake(tags["Prodhuesi"]);
  let modelName = cleanText(tags["Modeli"]);
  if (!makeName || !modelName) {
    const guess = guessMakeModelFromTitle(title);
    if (!makeName) makeName = normalizeMake(guess.makeName);
    if (!modelName) modelName = guess.modelName;
  }

  const year = parseYear(tags["Viti"] || description || title);
  const mileageKm = parseMileageRange(tags["Kilometrazha"]);
  const fuelType = mapFuel(tags["Karburanti"] || description || title);
  const transmission = mapTransmission(tags["Transmetuesi"] || description || title);
  const city = cleanText(tags["Komuna"]) || null;
  const sellerType = tags["Njoftim nga"] ? sellerTypeFromTag(tags["Njoftim nga"]) : undefined;

  if (!title || !makeName || !modelName) return null;

  return {
    externalId: url,
    sourceUrl: url,
    title,
    makeName,
    modelName,
    price: price.price,
    currency: price.currency,
    year,
    mileageKm,
    sellerType,
    fuelType,
    transmission,
    city,
    description,
    imageUrls: extractImages($),
  };
}

export const merrjepConnector: Connector = {
  key: "merrjep",
  label: "MerrJep.al vehicles",
  async *fetch(ctx: ConnectorContext) {
    const config = (ctx.config ?? {}) as MerrjepConfig;
    const userAgent = config.userAgent || DEFAULT_USER_AGENT;
    const origin = ctx.baseUrl || "https://www.merrjep.al";
    const links = new Set<string>();

    for (const url of ctx.listUrls) {
      try {
        ctx.log("info", `MerrJep list page: ${url}`);
        const html = await fetchHtml(url, userAgent);
        for (const link of collectListLinks(html, origin)) links.add(link);
        ctx.log("info", `MerrJep unique links so far: ${links.size}`);
      } catch (err) {
        ctx.log("error", `MerrJep list failed ${url}: ${(err as Error).message}`);
      }
      await sleep(ctx.requestDelayMs);
    }

    for (const detailUrl of config.detailUrls ?? []) {
      const abs = absolutizeUrl(origin, detailUrl);
      if (abs) links.add(abs.split("?")[0]);
    }

    for (const url of [...links].slice(0, ctx.maxPerRun)) {
      try {
        const html = await fetchHtml(url, userAgent);
        const record = parseDetail(html, url);
        if (record) {
          yield record;
        } else {
          ctx.log("warn", `MerrJep parse skipped: ${url}`);
        }
      } catch (err) {
        ctx.log("error", `MerrJep detail failed ${url}: ${(err as Error).message}`);
      }
      await sleep(ctx.requestDelayMs);
    }
  },
};
