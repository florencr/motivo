/**
 * Fetch make logos from Wikipedia and save them to public/uploads/make-logos/
 * Updates each make's logoUrl in the database.
 *
 * Usage:
 *   node scripts/fetch-make-logos.mjs            # only fetch missing/clearbit logos
 *   node scripts/fetch-make-logos.mjs --force    # refetch every make (overwrites)
 *   node scripts/fetch-make-logos.mjs --only "Toyota,BMW"
 */

import { existsSync, readFileSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve, join } from "node:path";
import { Client } from "pg";

const FORCE = process.argv.includes("--force");
const onlyArgIdx = process.argv.indexOf("--only");
const ONLY = onlyArgIdx >= 0
  ? process.argv[onlyArgIdx + 1]?.split(",").map((s) => s.trim().toLowerCase()) ?? []
  : [];

const USER_AGENT =
  "MotivoMakeLogoBot/1.0 (https://motivo.autos; admin@motivo.autos)";

const TITLE_OVERRIDES = {
  skoda: "Škoda Auto",
  volvo: "Volvo Cars",
  kawasaki: "Kawasaki motorcycles",
  man: "MAN Truck & Bus",
  beneteau: "Groupe Beneteau",
};

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
  for (const name of [".env", ".env.production", ".env.neon"]) {
    const p = resolve(root, name);
    if (!existsSync(p)) continue;
    Object.assign(merged, parseEnvFile(readFileSync(p, "utf8")));
  }
  return merged.DATABASE_URL?.trim() ?? "";
}

function slugify(name) {
  return String(name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function extFromUrl(url) {
  const lowered = url.toLowerCase();
  if (lowered.endsWith(".png")) return "png";
  if (lowered.endsWith(".webp")) return "webp";
  if (lowered.endsWith(".svg")) return "svg";
  if (lowered.endsWith(".jpg") || lowered.endsWith(".jpeg")) return "jpg";
  return "png";
}

async function wikiFetch(url) {
  const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res;
}

async function tryPageImages(title, makeName) {
  try {
    const url = `https://en.wikipedia.org/w/api.php?action=query&format=json&prop=pageimages&piprop=name&titles=${encodeURIComponent(title)}`;
    const res = await wikiFetch(url);
    const data = await res.json();
    const pages = data?.query?.pages ?? {};
    for (const pageId of Object.keys(pages)) {
      if (pageId === "-1") continue;
      const page = pages[pageId];
      const name = page?.pageimage;
      if (!name) continue;
      const lower = name.toLowerCase();
      const compactName = lower.replace(/[^a-z0-9]+/g, "");
      const lowerMake = (makeName ?? "").toLowerCase().replace(/[^a-z0-9]+/g, "");
      const looksLikeLogo =
        /logo|icon|symbol|wordmark|emblem|badge/.test(lower) ||
        (lowerMake && compactName.startsWith(lowerMake)) ||
        /\.svg$/i.test(name);
      if (!looksLikeLogo) continue;
      const fileUrl = await resolveCommonsFileUrl(`File:${name}`);
      if (fileUrl) return fileUrl;
    }
  } catch {
    /* ignore */
  }
  return null;
}

async function tryInfoboxLogo(title, makeName) {
  try {
    const url = `https://en.wikipedia.org/w/api.php?action=parse&format=json&prop=images&page=${encodeURIComponent(title)}`;
    const res = await wikiFetch(url);
    const data = await res.json();
    const images = Array.isArray(data?.parse?.images) ? data.parse.images : [];
    const candidates = images.filter((name) =>
      /\.(svg|png|jpe?g|webp)$/i.test(name),
    );
    if (candidates.length === 0) return null;

    const lowerMake = makeName.toLowerCase().replace(/[^a-z0-9]+/g, "");
    function scoreOf(name) {
      const lower = name.toLowerCase();
      let score = 0;
      const compactName = lower.replace(/[^a-z0-9]+/g, "");
      if (/logo/.test(lower)) score += 50;
      if (lowerMake && compactName.startsWith(lowerMake)) score += 25;
      if (/\.svg$/i.test(name)) score += 30;
      if (/icon|symbol|wordmark|emblem|badge/.test(lower)) score += 20;
      if (/(building|hq|headquarters|factory|plant|car|vehicle|model|family|founder|portrait|map|flag)/.test(lower))
        score -= 30;
      if (/\.jpe?g$/i.test(name)) score -= 5;
      return score;
    }

    const ranked = [...candidates]
      .map((name) => ({ name, score: scoreOf(name) }))
      .sort((a, b) => b.score - a.score);

    const top = ranked[0];
    if (!top || top.score < 10) return null;

    const fileUrl = await resolveCommonsFileUrl(`File:${top.name}`);
    return fileUrl;
  } catch {
    return null;
  }
}

async function resolveCommonsFileUrl(fileTitle) {
  try {
    const url = `https://en.wikipedia.org/w/api.php?action=query&format=json&prop=imageinfo&iiprop=url&iiurlwidth=400&titles=${encodeURIComponent(fileTitle)}`;
    const res = await wikiFetch(url);
    const data = await res.json();
    const pages = data?.query?.pages ?? {};
    for (const pageId of Object.keys(pages)) {
      const page = pages[pageId];
      const info = Array.isArray(page?.imageinfo) ? page.imageinfo[0] : null;
      const thumb = info?.thumburl ?? info?.url;
      if (thumb) return thumb;
    }
  } catch {
    /* ignore */
  }
  return null;
}

async function openSearchTitle(query) {
  try {
    const url = `https://en.wikipedia.org/w/api.php?action=opensearch&format=json&limit=1&search=${encodeURIComponent(query)}`;
    const res = await wikiFetch(url);
    const data = await res.json();
    return Array.isArray(data?.[1]) ? data[1][0] ?? null : null;
  } catch {
    return null;
  }
}

async function searchWikipediaTitle(makeName) {
  const override = TITLE_OVERRIDES[makeName.toLowerCase()];
  const candidates = [
    ...(override ? [override] : []),
    `${makeName} (automobile)`,
    `${makeName} Motor Company`,
    `${makeName} (brand)`,
    `${makeName} (marque)`,
    `${makeName} (manufacturer)`,
    makeName,
  ];

  for (const title of candidates) {
    const fromInfobox = await tryInfoboxLogo(title, makeName);
    if (fromInfobox) return fromInfobox;
  }

  for (const title of candidates) {
    const fromPageImages = await tryPageImages(title, makeName);
    if (fromPageImages) return fromPageImages;
  }

  for (const query of [
    `${makeName} car manufacturer`,
    `${makeName} automaker`,
    `${makeName} logo`,
    makeName,
  ]) {
    const title = await openSearchTitle(query);
    if (!title) continue;
    const fromInfobox = await tryInfoboxLogo(title, makeName);
    if (fromInfobox) return fromInfobox;
    const fromPageImages = await tryPageImages(title, makeName);
    if (fromPageImages) return fromPageImages;
  }

  return null;
}

async function fetchBuffer(url) {
  const res = await wikiFetch(url);
  const arrayBuf = await res.arrayBuffer();
  return Buffer.from(arrayBuf);
}

async function main() {
  const databaseUrl = loadDatabaseUrl();
  if (!databaseUrl) throw new Error("DATABASE_URL is missing");

  const client = new Client({ connectionString: databaseUrl });
  await client.connect();

  const targetDir = resolve(process.cwd(), "public", "uploads", "make-logos");
  await mkdir(targetDir, { recursive: true });

  const { rows: makes } = await client.query(
    `select id, name, "logoUrl" from "Make" order by name asc`,
  );

  console.log(`Found ${makes.length} makes`);

  let ok = 0;
  let skipped = 0;
  let failed = 0;

  for (const make of makes) {
    if (ONLY.length > 0 && !ONLY.includes(make.name.toLowerCase())) continue;

    const isClearbit = (make.logoUrl ?? "").includes("clearbit.com");
    const isLocal = (make.logoUrl ?? "").startsWith("/uploads/");
    if (!FORCE && make.logoUrl && !isClearbit && isLocal) {
      skipped++;
      continue;
    }

    try {
      const logoSrc = await searchWikipediaTitle(make.name);
      if (!logoSrc) {
        console.log(`  [miss] ${make.name}`);
        failed++;
        continue;
      }
      const buffer = await fetchBuffer(logoSrc);
      const ext = extFromUrl(logoSrc);
      const filename = `${slugify(make.name)}-${Date.now()}.${ext}`;
      await writeFile(join(targetDir, filename), buffer);
      const dbUrl = `/uploads/make-logos/${filename}`;
      await client.query(
        `update "Make" set "logoUrl" = $1, "updatedAt" = now() where id = $2`,
        [dbUrl, make.id],
      );
      console.log(`  [ok]   ${make.name} -> ${dbUrl}`);
      ok++;

      await new Promise((r) => setTimeout(r, 200));
    } catch (err) {
      console.log(`  [fail] ${make.name}: ${err?.message ?? err}`);
      failed++;
    }
  }

  await client.end();
  console.log(`\nDone. ok=${ok} skipped=${skipped} failed=${failed}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
