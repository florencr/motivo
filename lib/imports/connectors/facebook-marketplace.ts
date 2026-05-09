import * as cheerio from "cheerio";
import {
  guessMakeModelFromTitle,
  mapFuel,
  mapTransmission,
  parseKm,
  parsePriceMajor,
  parseYear,
} from "@/lib/imports/parsers";
import type { Connector, ConnectorContext, NormalizedListing } from "@/lib/imports/types";

/**
 * Facebook Marketplace — fetch individual listing pages and parse whatever HTML/JSON
 * Facebook serves (often incomplete; login walls are common).
 *
 * Configure `listUrls` (admin textarea, one URL per line) with full marketplace links like:
 * `https://www.facebook.com/marketplace/item/1234567890/`
 *
 * Optional `config`:
 * - `detailUrls`: extra URLs (same format)
 * - `cookie`: full `Cookie` header from a logged-in browser (sensitive; may violate FB ToS)
 * - `preferMbasic`: default true — fetch via `mbasic.facebook.com` which is sometimes simpler HTML
 * - `fallbackYear`: used only when no year can be parsed from the page (otherwise listing is skipped)
 */
export type FacebookMarketplaceConfig = {
  userAgent?: string;
  detailUrls?: string[];
  cookie?: string;
  preferMbasic?: boolean;
  fallbackYear?: number;
};

const DEFAULT_USER_AGENT =
  "MotivoBot/1.0 (+https://motivo.autos) - Facebook Marketplace import";

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

function safeHeaderValue(value: string): string {
  return value.replace(/[^\x20-\x7e]/g, "-");
}

function cleanText(value: string | undefined | null): string {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim();
}

function extractListingId(url: string): string | null {
  const m = url.match(/\/marketplace\/item\/(\d{5,20})\b/i);
  return m ? m[1] : null;
}

function normalizeListingUrl(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  try {
    const u = new URL(trimmed);
    if (!/facebook\.com$/i.test(u.hostname.replace(/^www\./i, "facebook.com")) &&
        !/^(www\.)?facebook\.com$/i.test(u.hostname)) {
      return null;
    }
    if (!/\/marketplace\/item\/\d+/i.test(u.pathname)) return null;
    u.hash = "";
    const id = extractListingId(u.pathname + u.search);
    if (!id) return null;
    u.pathname = `/marketplace/item/${id}/`;
    u.search = "";
    return u.toString();
  } catch {
    return null;
  }
}

function toFetchUrl(canonical: string, preferMbasic: boolean): string {
  if (!preferMbasic) return canonical;
  try {
    const u = new URL(canonical);
    if (/facebook\.com$/i.test(u.hostname.replace(/^www\./i, ""))) {
      u.hostname = "mbasic.facebook.com";
      return u.toString();
    }
  } catch {
    /* ignore */
  }
  return canonical;
}

function metaContent($: cheerio.CheerioAPI, selector: string): string {
  return cleanText($(selector).attr("content"));
}

function looksLikeLoginWall(html: string): boolean {
  const sample = html.slice(0, 12000).toLowerCase();
  if (sample.includes('name="login"') && sample.includes("facebook")) return true;
  if (sample.includes("you must log in") || sample.includes("must log in to continue"))
    return true;
  if (/log\s+into\s+facebook/i.test(html.slice(0, 8000))) return true;
  return false;
}

function extractPriceFromSnippets(html: string): number {
  let best = Number.NaN;
  const consider = (raw: string) => {
    const n = parsePriceMajor(raw);
    if (Number.isFinite(n) && n >= 100 && n < 5000000) {
      if (!Number.isFinite(best) || n > best) best = n;
    }
  };

  for (const m of html.matchAll(/"formatted_price(?:_text)?"\s*:\s*"([^"]{1,48})"/gi)) {
    consider(m[1]);
  }
  for (const m of html.matchAll(
    /"amount(?:_with_offset_in_currency)?"\s*:\s*"(\d{2,12})"/gi,
  )) {
    consider(m[1]);
  }
  for (const m of html.matchAll(
    /"amount(?:_with_offset_in_currency)?"\s*:\s*(\d{2,12})\b/g,
  )) {
    consider(m[1]);
  }
  const euroTxt = html.match(/€\s*([\d][\d\s.,]{3,15})/);
  if (euroTxt) consider(euroTxt[1]);
  return best;
}

function extractImages(html: string, $: cheerio.CheerioAPI): string[] {
  const out = new Set<string>();
  const og = metaContent($, 'meta[property="og:image"]');
  if (og && /^https?:\/\//i.test(og)) out.add(og);

  for (const m of html.matchAll(/"uri"\s*:\s*"(https:\\\/\\\/scontent[^"]+)"/g)) {
    const u = m[1].replace(/\\\//g, "/");
    if (/\.(jpg|jpeg|png|webp)(\?|$)/i.test(u)) out.add(u);
  }

  $('img[src*="scontent"]').each((_, el) => {
    const src = $(el).attr("src");
    if (src && /^https?:\/\//i.test(src)) out.add(src);
  });

  return [...out].slice(0, 12);
}

function parseMileageFromBlob(text: string): number {
  const km = text.match(/(\d[\d\s.,]{2,12})\s*km\b/i);
  if (km) return parseKm(km[1]);
  const miles = text.match(/(\d[\d\s.,]{2,12})\s*mi(?:les)?\b/i);
  if (miles) return Math.round(parseKm(miles[1]) * 1.60934);
  return Number.NaN;
}

function parseDetail(
  html: string,
  canonicalUrl: string,
  config: FacebookMarketplaceConfig,
): NormalizedListing | null {
  if (looksLikeLoginWall(html)) {
    return null;
  }

  const $ = cheerio.load(html);
  const id = extractListingId(canonicalUrl);
  if (!id) return null;

  const ogTitle = metaContent($, 'meta[property="og:title"]');
  const title =
    cleanText(ogTitle) ||
    cleanText($("h1").first().text()) ||
    cleanText($("title").first().text());

  const ogDesc = metaContent($, 'meta[property="og:description"]');
  const description =
    cleanText(ogDesc) ||
    cleanText($("#m_story_nt_message, .story_body_container").first().text()) ||
    title;

  const blob = `${title}\n${description}\n${html.slice(0, 40000)}`;
  const price = extractPriceFromSnippets(blob);
  let year = parseYear(blob);
  if (!Number.isFinite(year) && typeof config.fallbackYear === "number") {
    year = config.fallbackYear;
  }

  let mileageKm = parseMileageFromBlob(blob);
  if (!Number.isFinite(mileageKm)) mileageKm = 0;

  const guess = guessMakeModelFromTitle(title || description);
  let makeName = guess.makeName;
  let modelName = guess.modelName;
  if (!makeName) makeName = "Unknown";
  if (!modelName) modelName = cleanText(title).slice(0, 120) || `Marketplace ${id}`;

  return {
    externalId: `facebook-marketplace:${id}`,
    sourceUrl: canonicalUrl,
    title: title || `Marketplace #${id}`,
    makeName,
    modelName,
    price,
    year,
    mileageKm,
    fuelType: mapFuel(blob),
    transmission: mapTransmission(blob),
    description: description || title,
    imageUrls: extractImages(html, $),
  };
}

async function fetchHtml(
  url: string,
  userAgent: string,
  cookie: string | undefined,
): Promise<string> {
  const headers: Record<string, string> = {
    "User-Agent": safeHeaderValue(userAgent),
    Accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9,sq;q=0.8",
  };
  if (cookie?.trim()) {
    headers.Cookie = cookie.trim();
  }

  const res = await fetch(url, { headers, redirect: "follow" });
  if (!res.ok) throw new Error(`GET ${url} → ${res.status}`);
  return res.text();
}

export const facebookMarketplaceConnector: Connector = {
  key: "facebook_marketplace",
  label: "Facebook Marketplace (per-item URLs)",
  async *fetch(ctx: ConnectorContext) {
    const cfg = (ctx.config ?? {}) as FacebookMarketplaceConfig;
    const userAgent = cfg.userAgent || DEFAULT_USER_AGENT;
    const preferMbasic = cfg.preferMbasic !== false;

    const links = new Set<string>();
    for (const raw of ctx.listUrls) {
      const n = normalizeListingUrl(raw);
      if (n) links.add(n);
      else ctx.log("warn", `Facebook Marketplace: skipped non-item URL: ${raw}`);
    }
    for (const raw of cfg.detailUrls ?? []) {
      const n = normalizeListingUrl(raw);
      if (n) links.add(n);
    }

    if (links.size === 0) {
      ctx.log(
        "warn",
        "Facebook Marketplace: no valid /marketplace/item/<id>/ URLs in listUrls or config.detailUrls",
      );
      return;
    }

    const urls = [...links].slice(0, ctx.maxPerRun);
    ctx.log("info", `Facebook Marketplace: fetching ${urls.length} listing page(s)`);

    for (const canonical of urls) {
      const fetchUrl = toFetchUrl(canonical, preferMbasic);
      try {
        const html = await fetchHtml(fetchUrl, userAgent, cfg.cookie);
        const record = parseDetail(html, canonical, cfg);
        if (!record) {
          ctx.log(
            "error",
            `Facebook Marketplace: blocked or unparsable (try cookie / check URL): ${canonical}`,
          );
        } else if (!Number.isFinite(record.price) || record.price <= 0) {
          ctx.log("warn", `Facebook Marketplace: could not read price: ${canonical}`);
        } else if (
          !Number.isFinite(record.year) ||
          record.year < 1950 ||
          record.year > new Date().getFullYear() + 1
        ) {
          ctx.log(
            "warn",
            `Facebook Marketplace: could not read year (set config.fallbackYear): ${canonical}`,
          );
        } else {
          yield record;
        }
      } catch (err) {
        ctx.log(
          "error",
          `Facebook Marketplace: fetch failed ${canonical}: ${(err as Error).message}`,
        );
      }
      await sleep(ctx.requestDelayMs);
    }
  },
};
