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

type NjoftimeConfig = {
  userAgent?: string;
  /** Optional hand-picked thread URLs for testing. */
  detailUrls?: string[];
  /** Hard upper bound for pagination crawl per list URL (also stops on empty pages). */
  maxPages?: number;
};

const DEFAULT_USER_AGENT =
  "MotivoBot/1.0 (+contact@motivo.example) - admin-managed Njoftime import";

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

function safeHeaderValue(value: string): string {
  return value.replace(/[^\x20-\x7e]/g, "-");
}

async function fetchHtml(url: string, userAgent: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      "User-Agent": safeHeaderValue(userAgent),
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

function normalizeMake(value: string): string {
  const v = cleanText(value);
  if (/^vw$/i.test(v)) return "Volkswagen";
  if (/^volts?wagen$/i.test(v)) return "Volkswagen";
  if (/^mercedes$/i.test(v)) return "Mercedes-Benz";
  if (/^benz$/i.test(v)) return "Mercedes-Benz";
  if (/^range\s+rover$/i.test(v)) return "Land Rover";
  return v;
}

function parseMileageFromText(text: string): number {
  const t = cleanText(text);

  // "240.000 km" or "240,000 km" or "240 000 km"
  const km = t.match(/(\d[\d\s.,]{2,12})\s*km\b/i);
  if (km) {
    const digits = km[1].replace(/[^\d]/g, "");
    const n = Number.parseInt(digits, 10);
    if (Number.isFinite(n)) return n;
  }

  // Albanian "KM..........: 181000"
  const kmLabel = t.match(/\bKM\.*[:\s]+(\d[\d\s.,]{2,12})/i);
  if (kmLabel) {
    const digits = kmLabel[1].replace(/[^\d]/g, "");
    const n = Number.parseInt(digits, 10);
    if (Number.isFinite(n)) return n;
  }

  return Number.NaN;
}

function extractPrice(text: string): { price: number; currency: "EUR" | "ALL" } {
  const t = cleanText(text);

  // "Cmimi Euro 12000 €" / "Çmimi: 14.997 €"
  const cmimi = t.match(
    /(?:cmimi|çmimi)\s*(?:euro)?\s*[:\-]?\s*([\d][\d\s.,]*)\s*(€|euro|eur|lek|lek[ëe]|all)?/i,
  );
  if (cmimi && cmimi[1]) {
    const value = parsePriceMajor(cmimi[1]);
    if (Number.isFinite(value) && value > 0) {
      return {
        price: value,
        currency: cmimi[2] && /lek|all/i.test(cmimi[2]) ? "ALL" : "EUR",
      };
    }
  }

  // "12.345 €" (number then symbol)
  const eurAfter = t.match(/([\d][\d\s.,]{1,15})\s*€/);
  if (eurAfter) {
    return { price: parsePriceMajor(eurAfter[1]), currency: "EUR" };
  }

  // "€ 12.345"
  const eurBefore = t.match(/€\s*([\d][\d\s.,]{1,15})/);
  if (eurBefore) {
    return { price: parsePriceMajor(eurBefore[1]), currency: "EUR" };
  }

  // "12.345 euro" / "9.000 lek"
  const generic = t.match(
    /([\d][\d\s.,]{2,15})\s*(euro|eur|lek|lek[ëe]|all)\b/i,
  );
  if (generic) {
    return {
      price: parsePriceMajor(generic[1]),
      currency: /lek|all/i.test(generic[2]) ? "ALL" : "EUR",
    };
  }

  return { price: Number.NaN, currency: "EUR" };
}

function parseNumber(value: string | undefined): number {
  if (!value) return Number.NaN;
  const normalized = value.replace(/[^\d.,]/g, "").replace(",", ".");
  const n = Number.parseFloat(normalized);
  return Number.isFinite(n) ? n : Number.NaN;
}

function extractPowerHp(text: string): number {
  const t = cleanText(text);

  // Albanian "Fuqia KW..: 96" or "Fuqia KW 96"
  const kw = t.match(/Fuqi(?:a)?\s*KW\.*[:\s]+(\d{2,4}(?:[.,]\d+)?)/i);
  if (kw) {
    const value = parseNumber(kw[1]);
    if (Number.isFinite(value) && value > 0) return Math.round(value * 1.34102);
  }

  // Generic "150 hp" / "150 ks" / "110 kw"
  const generic = t.match(
    /(\d{2,4}(?:[.,]\d+)?)\s*(kw|kW|hp|ps|ks|kuaj)\b/i,
  );
  if (generic) {
    const value = parseNumber(generic[1]);
    const unit = generic[2].toLowerCase();
    if (Number.isFinite(value) && value > 0) {
      return unit === "kw" ? Math.round(value * 1.34102) : Math.round(value);
    }
  }

  return Number.NaN;
}

function extractEngineCapacity(text: string): number {
  const t = cleanText(text);

  // "1.6 TDI" / "2.0 Nafte" / "1.4 Benzine" — convert L to cc
  const liters = t.match(/\b(\d\.\d)\s*(?:tdi|tfsi|tsi|nafte|benzin[ëe]?|cdi|hdi|jtd|dci|crdi|petrol|diesel)\b/i);
  if (liters) {
    const value = parseNumber(liters[1]);
    if (Number.isFinite(value) && value > 0) return Math.round(value * 1000);
  }

  // "Motorr 350" / "Motor 2.0" — generic engine line
  const motor = t.match(/\bmotor(?:ri)?\s*[:\-]?\s*(\d\.\d|\d{3,5})\b/i);
  if (motor) {
    const raw = motor[1];
    if (raw.includes(".")) {
      const value = parseNumber(raw);
      if (Number.isFinite(value) && value > 0) return Math.round(value * 1000);
    } else {
      const n = Number.parseInt(raw, 10);
      if (Number.isFinite(n) && n >= 600 && n <= 8000) return n;
    }
  }

  // "1998 cc"
  const cc = t.match(/(\d{3,5})\s*(cc|cm3|ccm)\b/i);
  if (cc) {
    const n = Number.parseInt(cc[1], 10);
    if (Number.isFinite(n) && n >= 600 && n <= 8000) return n;
  }

  return Number.NaN;
}

function collectThreadLinks(html: string, origin: string): string[] {
  const $ = cheerio.load(html);
  const out = new Set<string>();

  $('a[href*="/threads/"]').each((_, el) => {
    const abs = absolutizeUrl(origin, $(el).attr("href"));
    if (!abs) return;
    if (!/^https?:\/\/[^/]*njoftime\.com\/threads\//i.test(abs)) return;
    // Strip query/fragments and keep canonical /threads/<slug>.<id>/
    const stripped = abs.split(/[?#]/)[0];
    // Skip post-permalinks like /threads/foo.123/post-456 or /page-2
    const canonical = stripped.replace(/\/(post-\d+|page-\d+|reply|unread|latest)\/?$/i, "/");
    out.add(canonical.endsWith("/") ? canonical : `${canonical}/`);
  });

  return [...out];
}

function withForumPage(rawUrl: string, page: number): string {
  try {
    const u = new URL(rawUrl);
    const cleanPath = u.pathname.replace(/\/page-\d+\/?$/i, "/");
    if (page <= 1) {
      u.pathname = cleanPath;
      return u.toString();
    }
    u.pathname = `${cleanPath.replace(/\/$/, "")}/page-${page}/`;
    return u.toString();
  } catch {
    return rawUrl;
  }
}

const MAKE_LABELS = [
  "Audi",
  "BMW",
  "Mercedes-Benz",
  "Mercedes",
  "Volkswagen",
  "VW",
  "Voltswagen",
  "Toyota",
  "Nissan",
  "Honda",
  "Hyundai",
  "Kia",
  "Mazda",
  "Mitsubishi",
  "Renault",
  "Peugeot",
  "Citroen",
  "Ford",
  "Fiat",
  "Alfa Romeo",
  "Opel",
  "Skoda",
  "Seat",
  "Volvo",
  "Land Rover",
  "Range Rover",
  "Jeep",
  "Jaguar",
  "Lexus",
  "Lamborghini",
  "Porsche",
  "Suzuki",
  "Subaru",
  "Smart",
  "smart",
  "Mini",
  "MINI",
  "Dacia",
  "Chevrolet",
  "Chrysler",
  "Dodge",
  "Cadillac",
  "Tesla",
  "Bentley",
  "Maserati",
  "Ferrari",
  "Lancia",
  "Daewoo",
  "Daihatsu",
  "Infiniti",
  "Acura",
  "Buick",
  "GMC",
  "Hummer",
  "Bugatti",
];

function extractStructuredFields(text: string): Record<string, string> {
  const fields: Record<string, string> = {};
  const t = cleanText(text);

  // "Marka <Make>"
  const makeMatch = t.match(
    new RegExp(`Marka\\s+(${MAKE_LABELS.map((m) => m.replace(/\s/g, "\\s+")).join("|")})\\b`, "i"),
  );
  if (makeMatch) fields.make = makeMatch[1];

  // "Tipi <type>"
  const tipi = t.match(/Tipi\s+([A-Za-zçëÇË\-|]+(?:\s+[A-Za-zçëÇË\-|]+)?)\s+Marka/i);
  if (tipi) fields.type = cleanText(tipi[1]);

  // "Viti <year>"
  const yearMatch = t.match(/Viti\s+((?:19|20)\d{2})/i);
  if (yearMatch) fields.year = yearMatch[1];

  // "Cmimi Euro 12000"
  const priceField = t.match(/Cmimi\s+Euro\s+([\d][\d\s.,]*)/i);
  if (priceField) fields.priceField = priceField[1];

  // "Karburanti: Diezel" or fallback inferences from title text below
  const fuel = t.match(/Karburanti\s*[:\-]?\s*([A-Za-zçëÇË]+)/i);
  if (fuel) fields.fuel = fuel[1];

  // "Ngjyra.....: e zeze"
  const color = t.match(/Ngjyra\.*\s*[:\-]?\s*([A-Za-zçëÇË\s]{2,30})/i);
  if (color) fields.color = cleanText(color[1]);

  // "Kamjo......: automatik"
  const cambio = t.match(/(?:Kamjo|Kambio)\.*\s*[:\-]?\s*([A-Za-zçëÇË]+)/i);
  if (cambio) fields.transmission = cambio[1];

  return fields;
}

function inferTitleFromAlbanian(title: string): string {
  // Strip common Albanian phrasing so guessMakeModelFromTitle has cleaner input.
  return title
    .replace(/^.*?\bshes\b/i, "")
    .replace(/^.*?\bshitet\b/i, "")
    .replace(/\bmakine\b/gi, " ")
    .replace(/\bsuv\b/gi, " ")
    .replace(/\bnafte\b/gi, " ")
    .replace(/\bbenzin[ëe]?\b/gi, " ")
    .replace(/\belektrike\b/gi, " ")
    .replace(/\bautomatik\b/gi, " ")
    .replace(/\bmanuale\b/gi, " ")
    .replace(/\bklima\b/gi, " ")
    .replace(/\bkondicioner\b/gi, " ")
    .replace(/\b\d[\d.,\s]*\s*km\b/gi, " ")
    .replace(/\b\d[\d.,\s]*\s*€\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractFirstPostText($: cheerio.CheerioAPI): string {
  const node = $(".message-body .bbWrapper").first();
  const text = node.length > 0 ? node.text() : $(".bbWrapper").first().text();
  return cleanText(text || $("body").text().slice(0, 4000));
}

function extractImages($: cheerio.CheerioAPI): string[] {
  const out = new Set<string>();

  for (const selector of ['meta[property="og:image"]', 'meta[name="twitter:image"]']) {
    const value = $(selector).attr("content");
    if (value && /^https?:\/\//i.test(value)) out.add(value);
  }

  $(".message-body img, .bbWrapper img, .bbImage").each((_, el) => {
    const src =
      $(el).attr("src") ||
      $(el).attr("data-src") ||
      $(el).attr("data-url") ||
      $(el).attr("data-original");
    if (src && /^https?:\/\//i.test(src)) out.add(src);
  });

  return [...out].slice(0, 12);
}

function parseDetail(html: string, url: string): NormalizedListing | null {
  const $ = cheerio.load(html);

  const titleRaw =
    cleanText($(".p-title-value").first().text()) ||
    cleanText($("h1").first().text()) ||
    cleanText(meta($, 'meta[property="og:title"]')) ||
    cleanText($("title").text());
  const title = titleRaw.replace(/\s*\|\s*njoftime\.com\s*$/i, "").trim();

  const description =
    extractFirstPostText($) ||
    meta($, 'meta[name="description"]') ||
    title;

  // The page text usually contains "Tirane Tipi makine Marka Volkswagen Viti 2008 Cmimi Euro ..."
  const pageText = cleanText($("body").text()).slice(0, 6000);
  const fields = extractStructuredFields(pageText);

  let makeName = normalizeMake(fields.make ?? "");
  let modelName = "";
  if (!makeName || !modelName) {
    const guess = guessMakeModelFromTitle(inferTitleFromAlbanian(title));
    if (!makeName) makeName = normalizeMake(guess.makeName);
    if (!modelName) modelName = guess.modelName;
  }

  const year = fields.year ? parseYear(fields.year) : parseYear(`${title} ${description}`);

  // Price: prefer structured "Cmimi Euro X", fallback to title/description.
  let priceInfo = { price: Number.NaN, currency: "EUR" as "EUR" | "ALL" };
  if (fields.priceField) {
    const v = parsePriceMajor(fields.priceField);
    if (Number.isFinite(v) && v > 0) priceInfo = { price: v, currency: "EUR" };
  }
  if (!Number.isFinite(priceInfo.price)) {
    const fromTitle = extractPrice(title);
    if (Number.isFinite(fromTitle.price)) priceInfo = fromTitle;
  }
  if (!Number.isFinite(priceInfo.price)) {
    priceInfo = extractPrice(description);
  }

  const mileageKm = parseMileageFromText(`${title} ${description}`);
  const fuelType = mapFuel(
    `${fields.fuel ?? ""} ${title} ${description}`.trim() || "petrol",
  );
  const transmission = mapTransmission(
    `${fields.transmission ?? ""} ${title} ${description}`.trim() || "manual",
  );
  const powerHp = extractPowerHp(`${title} ${description}`);
  const engineCapacity = extractEngineCapacity(`${title} ${description}`);

  // City: take token before "Tipi" in the structured row, fall back to first comma in title.
  let city: string | null = null;
  const cityMatch = pageText.match(/^([A-Za-zçëÇË\-\s]{2,40})\s+(?:Tipi|Marka|Nr\.)/);
  if (cityMatch) city = cleanText(cityMatch[1]);
  if (!city) {
    const titleCity = title.split(",")[0];
    if (titleCity && titleCity.length < 40) city = cleanText(titleCity);
  }

  if (!title || !makeName || !modelName) return null;

  return {
    externalId: url,
    sourceUrl: url,
    title,
    makeName,
    modelName,
    price: priceInfo.price,
    currency: priceInfo.currency,
    year,
    mileageKm,
    fuelType,
    transmission,
    engineCapacity: Number.isFinite(engineCapacity) ? engineCapacity : undefined,
    powerHp: Number.isFinite(powerHp) ? powerHp : undefined,
    city,
    description,
    imageUrls: extractImages($),
  };
}

export const njoftimeConnector: Connector = {
  key: "njoftime",
  label: "Njoftime.com vehicles",
  async *fetch(ctx: ConnectorContext) {
    const config = (ctx.config ?? {}) as NjoftimeConfig;
    const userAgent = config.userAgent || DEFAULT_USER_AGENT;
    const origin = ctx.baseUrl || "https://www.njoftime.com";
    const links = new Set<string>();

    const maxPages = Math.max(
      1,
      Math.min(Number(config.maxPages ?? 50) || 50, 200),
    );

    for (const startUrl of ctx.listUrls) {
      ctx.log("info", `Njoftime crawl start: ${startUrl}`);
      let consecutiveEmpty = 0;
      for (let page = 1; page <= maxPages; page++) {
        if (links.size >= ctx.maxPerRun) {
          ctx.log(
            "info",
            `Njoftime reached maxPerRun=${ctx.maxPerRun}, stopping pagination`,
          );
          break;
        }
        const pageUrl = withForumPage(startUrl, page);
        try {
          const before = links.size;
          ctx.log("info", `Njoftime page ${page}: ${pageUrl}`);
          const html = await fetchHtml(pageUrl, userAgent);
          for (const link of collectThreadLinks(html, origin)) links.add(link);
          const added = links.size - before;
          ctx.log(
            "info",
            `Njoftime page ${page}: +${added} new (total ${links.size})`,
          );
          if (added === 0) {
            consecutiveEmpty++;
            if (consecutiveEmpty >= 2) {
              ctx.log(
                "info",
                `Njoftime no new links for 2 pages, stopping pagination`,
              );
              break;
            }
          } else {
            consecutiveEmpty = 0;
          }
        } catch (err) {
          ctx.log(
            "error",
            `Njoftime list failed ${pageUrl}: ${(err as Error).message}`,
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
          ctx.log("warn", `Njoftime parse skipped: ${url}`);
        }
      } catch (err) {
        ctx.log(
          "error",
          `Njoftime detail failed ${url}: ${(err as Error).message}`,
        );
      }
      await sleep(ctx.requestDelayMs);
    }
  },
};
