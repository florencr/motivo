import * as cheerio from "cheerio";
import {
  absolutizeUrl,
  guessMakeModelFromTitle,
  mapFuel,
  mapTransmission,
  parseKm,
  parsePriceMajor,
  parseYear,
} from "@/lib/imports/parsers";
import type { Connector, ConnectorContext, NormalizedListing } from "@/lib/imports/types";

/**
 * Configuration shape consumed by the generic connector. Stored on
 * `ImportSource.config` and tweaked per source from the admin UI.
 */
export type GenericConfig = {
  /** CSS selector for cards on a list page (optional). */
  cardSelector?: string;
  /** CSS selector for the link to a detail page. */
  linkSelector?: string;
  hrefAttr?: string;
  /** Selectors used on the detail page. Comma-separated lists are tried in order. */
  detail?: {
    title?: string;
    price?: string;
    year?: string;
    mileageKm?: string;
    fuel?: string;
    transmission?: string;
    description?: string;
    images?: string;
    imageSrcAttr?: string;
    makeName?: string;
    modelName?: string;
    city?: string;
  };
  userAgent?: string;
};

const DEFAULT_USER_AGENT =
  "MotivoBot/1.0 (+contact@motivo.example) — admin-managed import";

function sleep(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms));
}

async function fetchHtml(url: string, userAgent: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      "User-Agent": userAgent,
      Accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9,sq;q=0.8",
    },
    redirect: "follow",
  });
  if (!res.ok) throw new Error(`GET ${url} → ${res.status}`);
  return res.text();
}

function firstText($: cheerio.CheerioAPI, selectorList?: string): string {
  if (!selectorList) return "";
  for (const raw of selectorList.split(",")) {
    const sel = raw.trim();
    if (!sel) continue;
    const el = $(sel).first();
    const text = el.text().trim();
    if (text) return text;
  }
  return "";
}

function collectLinks(
  html: string,
  config: GenericConfig,
  pageOrigin: string,
): string[] {
  const $ = cheerio.load(html);
  const out = new Set<string>();
  const linkSelector = config.linkSelector || "a[href]";
  const hrefAttr = config.hrefAttr || "href";

  if (config.cardSelector) {
    $(config.cardSelector).each((_, card) => {
      const a = $(card).find(linkSelector).first();
      const abs = absolutizeUrl(pageOrigin, a.attr(hrefAttr));
      if (abs) out.add(abs);
    });
  } else {
    $(linkSelector).each((_, el) => {
      const abs = absolutizeUrl(pageOrigin, $(el).attr(hrefAttr));
      if (abs) out.add(abs);
    });
  }

  return [...out];
}

function parseDetail(
  html: string,
  url: string,
  config: GenericConfig,
  pageOrigin: string,
): NormalizedListing | null {
  const $ = cheerio.load(html);
  const det = config.detail ?? {};

  const title = firstText($, det.title || "h1");
  let makeName = det.makeName ? firstText($, det.makeName) : "";
  let modelName = det.modelName ? firstText($, det.modelName) : "";
  if (!makeName || !modelName) {
    const guess = guessMakeModelFromTitle(title);
    if (!makeName) makeName = guess.makeName;
    if (!modelName) modelName = guess.modelName;
  }

  const price = parsePriceMajor(firstText($, det.price));
  const year = parseYear(firstText($, det.year));
  const mileageKm = parseKm(firstText($, det.mileageKm));
  const fuelType = mapFuel(firstText($, det.fuel));
  const transmission = mapTransmission(firstText($, det.transmission));
  const description = firstText($, det.description) || title;
  const city = det.city ? firstText($, det.city) || null : null;

  const imageUrls: string[] = [];
  if (det.images) {
    const srcAttr = det.imageSrcAttr || "src";
    $(det.images).each((i, el) => {
      if (i >= 12) return false;
      const abs = absolutizeUrl(pageOrigin, $(el).attr(srcAttr));
      if (abs && /^https?:\/\//i.test(abs)) imageUrls.push(abs);
      return undefined;
    });
  }

  if (!title || !Number.isFinite(price) || !Number.isFinite(year)) {
    return null;
  }

  return {
    externalId: url,
    sourceUrl: url,
    title,
    makeName,
    modelName,
    price,
    year,
    mileageKm,
    fuelType,
    transmission,
    description,
    imageUrls,
    city,
  };
}

export const genericConnector: Connector = {
  key: "generic",
  label: "Generic Website",
  async *fetch(ctx: ConnectorContext) {
    const config = (ctx.config ?? {}) as GenericConfig;
    const userAgent = config.userAgent || DEFAULT_USER_AGENT;
    const baseOrigin = ctx.baseUrl || (ctx.listUrls[0] ? new URL(ctx.listUrls[0]).origin : "");

    const allLinks = new Set<string>();
    for (const listUrl of ctx.listUrls) {
      try {
        ctx.log("info", `list page: ${listUrl}`);
        const html = await fetchHtml(listUrl, userAgent);
        const origin = baseOrigin || new URL(listUrl).origin;
        for (const link of collectLinks(html, config, origin)) {
          allLinks.add(link);
        }
        ctx.log("info", `list page found ${allLinks.size} unique links so far`);
      } catch (err) {
        ctx.log(
          "error",
          `failed to load list page ${listUrl}: ${(err as Error).message}`,
        );
      }
      await sleep(ctx.requestDelayMs);
    }

    const links = [...allLinks].slice(0, ctx.maxPerRun);
    ctx.log("info", `fetching ${links.length} detail pages`);

    for (const url of links) {
      try {
        const html = await fetchHtml(url, userAgent);
        const origin = baseOrigin || new URL(url).origin;
        const record = parseDetail(html, url, config, origin);
        if (!record) {
          ctx.log("warn", `parse failed: ${url}`);
        } else {
          yield record;
        }
      } catch (err) {
        ctx.log("error", `detail page ${url} → ${(err as Error).message}`);
      }
      await sleep(ctx.requestDelayMs);
    }
  },
};
