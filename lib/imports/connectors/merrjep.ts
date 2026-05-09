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
  /**
   * Hard upper bound for pagination crawl per list URL. The connector also
   * stops automatically when a page yields no new listing links.
   */
  maxPages?: number;
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

function parseNumber(value: string | undefined): number {
  if (!value) return Number.NaN;
  const normalized = value.replace(/[^\d.,]/g, "").replace(",", ".");
  const n = Number.parseFloat(normalized);
  return Number.isFinite(n) ? n : Number.NaN;
}

function extractPowerHp(text: string): number {
  const t = cleanText(text);
  const match = t.match(
    /(?:fuqi(?:a)?|power|motorpower|hp|kw|kW|ks|kuaj)\s*[:\-]?\s*(\d{2,4}(?:[.,]\d+)?)\s*(kw|kW|hp|ps|ks|kuaj)?|(\d{2,4}(?:[.,]\d+)?)\s*(kw|kW|hp|ps|ks|kuaj)\b/i,
  );
  if (!match) return Number.NaN;

  const rawValue = match[1] || match[3];
  const unit = (match[2] || match[4] || "hp").toLowerCase();
  const value = parseNumber(rawValue);
  if (!Number.isFinite(value) || value <= 0) return Number.NaN;

  return unit === "kw" ? Math.round(value * 1.34102) : Math.round(value);
}

function extractEngineCapacity(text: string): number {
  const t = cleanText(text);
  const match = t.match(
    /(?:kubik(?:azha)?|cilindrata|motor(?:ri)?|engine)\s*[:\-]?\s*(\d{3,5})\s*(cc|cm3|ccm)?|(\d{3,5})\s*(cc|cm3|ccm)\b/i,
  );
  if (!match) return Number.NaN;

  const value = parseNumber(match[1] || match[3]);
  return Number.isFinite(value) && value > 0 ? Math.round(value) : Number.NaN;
}

function extractPrice(text: string): { price: number; currency: "EUR" | "ALL" } {
  const t = cleanText(text);

  // Pattern: "Cmimi: 12.345 euro" or "Çmimi 12,345 €" (label + value)
  const cmimi = t.match(
    /(?:cmimi|çmimi)\s*[:\-]?\s*([\d][\d\s.,]*)\s*(€|euro|eur|lek|lek[ëe]|all)\b/i,
  );
  if (cmimi) {
    return {
      price: parsePriceMajor(cmimi[1]),
      currency: /lek|all/i.test(cmimi[2]) ? "ALL" : "EUR",
    };
  }

  // Pattern: "12.345 €" (number then symbol)
  const eurAfter = t.match(/([\d][\d\s.,]{1,15})\s*€/);
  if (eurAfter) {
    return { price: parsePriceMajor(eurAfter[1]), currency: "EUR" };
  }

  // Pattern: "€ 12.345" (symbol then number)
  const eurBefore = t.match(/€\s*([\d][\d\s.,]{1,15})/);
  if (eurBefore) {
    return { price: parsePriceMajor(eurBefore[1]), currency: "EUR" };
  }

  // Pattern: "12.345 euro" / "9.000 lek"
  const generic = t.match(
    /([\d][\d\s.,]{2,15})\s*(euro|eur|lek|lek[ëe]|all)\b/i,
  );
  if (generic) {
    return {
      price: parsePriceMajor(generic[1]),
      currency: /lek|all/i.test(generic[2]) ? "ALL" : "EUR",
    };
  }

  // Pattern: "EUR 9999" / "LEKE 1.500.000" (currency word then number)
  const reverse = t.match(
    /\b(eur|euro|lek|lek[ëe]|all)\s*([\d][\d\s.,]{2,15})/i,
  );
  if (reverse) {
    return {
      price: parsePriceMajor(reverse[2]),
      currency: /lek|all/i.test(reverse[1]) ? "ALL" : "EUR",
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

function withPageParam(rawUrl: string, page: number): string {
  try {
    const u = new URL(rawUrl);
    if (page <= 1) {
      u.searchParams.delete("Page");
      u.searchParams.delete("page");
      return u.toString();
    }
    u.searchParams.set("Page", String(page));
    return u.toString();
  } catch {
    return rawUrl;
  }
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
  const specText = [
    tags["Fuqia"],
    tags["Fuqia motorike"],
    tags["Motorri"],
    tags["Motori"],
    tags["Kubikazha"],
    description,
    title,
    pageText.slice(0, 3000),
  ].join(" ");
  const powerHp = extractPowerHp(specText);
  const engineCapacity = extractEngineCapacity(specText);

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
    engineCapacity: Number.isFinite(engineCapacity) ? engineCapacity : undefined,
    powerHp: Number.isFinite(powerHp) ? powerHp : undefined,
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

    const maxPages = Math.max(
      1,
      Math.min(Number(config.maxPages ?? 50) || 50, 200),
    );

    for (const startUrl of ctx.listUrls) {
      ctx.log("info", `MerrJep crawl start: ${startUrl}`);
      let consecutiveEmpty = 0;
      for (let page = 1; page <= maxPages; page++) {
        if (links.size >= ctx.maxPerRun) {
          ctx.log(
            "info",
            `MerrJep reached maxPerRun=${ctx.maxPerRun}, stopping pagination`,
          );
          break;
        }
        const pageUrl = withPageParam(startUrl, page);
        try {
          const before = links.size;
          ctx.log("info", `MerrJep page ${page}: ${pageUrl}`);
          const html = await fetchHtml(pageUrl, userAgent);
          for (const link of collectListLinks(html, origin)) links.add(link);
          const added = links.size - before;
          ctx.log(
            "info",
            `MerrJep page ${page}: +${added} new (total ${links.size})`,
          );
          if (added === 0) {
            consecutiveEmpty++;
            if (consecutiveEmpty >= 2) {
              ctx.log(
                "info",
                `MerrJep no new links for 2 pages, stopping pagination`,
              );
              break;
            }
          } else {
            consecutiveEmpty = 0;
          }
        } catch (err) {
          ctx.log(
            "error",
            `MerrJep list failed ${pageUrl}: ${(err as Error).message}`,
          );
          break;
        }
        await sleep(ctx.requestDelayMs);
      }
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
