/**
 * Post-build step for the static export.
 *
 * The app router exports pages under their internal route paths
 * (out/es/solutions/...), while every link, canonical, and sitemap entry uses
 * the localized pathnames from src/i18n/pathnames.json (/es/soluciones/...).
 * The rewrite middleware used to bridge the two at runtime; on static hosting
 * nothing does — so this script renames the exported directories to the
 * localized paths, copies the localized 404, and then verifies that every URL
 * in the sitemap resolves to a real index.html.
 *
 * Run from the repo root: node scripts/localize-export.mjs
 */
import { readFileSync, existsSync, renameSync, copyFileSync, readdirSync } from "node:fs";
import { join, dirname, basename } from "node:path";

const OUT = join(process.cwd(), "out");
const pathnames = JSON.parse(
  readFileSync(join(process.cwd(), "src/i18n/pathnames.json"), "utf8"),
);
const locales = ["es", "en"];

if (!existsSync(OUT)) {
  console.error("localize-export: out/ not found — run `next build` first");
  process.exit(1);
}

// 1. Rename route-path directories to localized paths, deepest first so each
//    step only changes the final path segment under a still-unrenamed parent.
let renamed = 0;
const keys = Object.keys(pathnames).sort(
  (a, b) => b.split("/").length - a.split("/").length,
);
for (const locale of locales) {
  for (const key of keys) {
    const localized = pathnames[key][locale];
    if (key === "/" || localized === key) continue;
    const from = join(OUT, locale, ...key.split("/").filter(Boolean));
    const to = join(dirname(from), basename(localized));
    if (existsSync(from) && from !== to) {
      renameSync(from, to);
      renamed++;
    }
  }
}

// 2. Localized 404 for static hosts (GitHub Pages + Apache ErrorDocument).
const notFoundEs = join(OUT, "es", "404", "index.html");
if (existsSync(notFoundEs)) {
  copyFileSync(notFoundEs, join(OUT, "404.html"));
} else {
  console.error("localize-export: es/404/index.html missing from export");
  process.exit(1);
}

// 3. Verify: every <loc> and xhtml:link href in the sitemap must resolve to a
//    physical index.html in the export (after stripping the origin).
const sitemapPath = join(OUT, "sitemap.xml");
if (!existsSync(sitemapPath)) {
  console.error("localize-export: sitemap.xml missing from export");
  process.exit(1);
}
const sitemap = readFileSync(sitemapPath, "utf8");
const urls = [...sitemap.matchAll(/(?:<loc>|href=")(https?:\/\/[^<"]+)/g)].map((m) => m[1]);
const missing = [];
for (const url of new Set(urls)) {
  const path = new URL(url).pathname.replace(/\/$/, "");
  const file =
    path === "" ? join(OUT, "index.html") : join(OUT, ...path.split("/").filter(Boolean), "index.html");
  if (!existsSync(file)) missing.push(`${url} -> ${file}`);
}
if (missing.length > 0) {
  console.error(`localize-export: ${missing.length} sitemap URL(s) have no file:`);
  for (const m of missing) console.error(`  ${m}`);
  process.exit(1);
}

// 4. Base path: every root-relative asset URL must carry it. next/image skips
//    the prefix when images.unoptimized is set, which silently 404s the logo
//    on GitHub Pages — this catches that class of bug at build time.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
if (basePath) {
  const html = readFileSync(join(OUT, "es", "index.html"), "utf8");
  const unprefixed = [...html.matchAll(/(?:src|href)="(\/[^"]*)"/g)]
    .map((m) => m[1])
    .filter((url) => !url.startsWith(`${basePath}/`) && !url.startsWith("//"));
  if (unprefixed.length > 0) {
    console.error(`localize-export: ${unprefixed.length} asset URL(s) missing base path "${basePath}":`);
    for (const url of new Set(unprefixed)) console.error(`  ${url}`);
    process.exit(1);
  }
}

// 5. Every internal page link in the export must resolve to a real page. The
//    language switcher used to emit the *template* path (/en/diagnostic
//    instead of /en/self-diagnosis) and nothing caught it, because the pages
//    whose English slug equals the template key hid the failures.
const pages = [];
(function walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) walk(path);
    else if (entry.name === "index.html") pages.push(path);
  }
})(OUT);

const broken = new Map();
for (const page of pages) {
  const html = readFileSync(page, "utf8");
  for (const [, href] of html.matchAll(/href="(\/[^"#?]*)"/g)) {
    const path = (basePath && href.startsWith(basePath) ? href.slice(basePath.length) : href)
      .replace(/\/$/, "");
    if (!/^\/(es|en)(\/|$)/.test(path)) continue; // assets, not pages
    const file = join(OUT, ...path.split("/").filter(Boolean), "index.html");
    if (!existsSync(file)) {
      broken.set(path, page.slice(OUT.length + 1));
    }
  }
}
if (broken.size > 0) {
  console.error(`localize-export: ${broken.size} internal link(s) point at no page:`);
  for (const [href, from] of broken) console.error(`  ${href}  (from ${from})`);
  process.exit(1);
}

// 6. Sanity: no English-named route directories left behind under /es.
const leftovers = ["services", "solutions", "about", "contact"].filter((d) =>
  readdirSync(join(OUT, "es")).includes(d),
);
if (leftovers.length > 0) {
  console.error(`localize-export: unexpected route dirs under /es: ${leftovers.join(", ")}`);
  process.exit(1);
}

console.log(
  `localize-export: renamed ${renamed} dirs, verified ${new Set(urls).size} sitemap URLs ` +
    `and the internal links on ${pages.length} pages, wrote 404.html`,
);
