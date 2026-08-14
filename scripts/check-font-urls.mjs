/**
 * Checks that the stylesheet the live site links to asks for fonts that exist.
 *
 * The six brand faces 404'd in production and nothing caught it, because the
 * CSS was valid and the files were uploaded — only the URL joining them was
 * wrong. HubSpot serves the built stylesheet from a versioned path,
 * /hubfs/raw_assets/<n>/public/..., and serves the raw fonts from the same
 * path *without* that segment, so a relative ../fonts/ resolved one directory
 * too deep and could never have worked. It took a design critique to notice,
 * because the fallback stack is close enough that no page looks broken; it
 * just looks like a different brand on every operating system.
 *
 *   node scripts/check-font-urls.mjs [--domain=www.novieri.com] [--local]
 *
 * It reads the live page, follows the stylesheet the page actually links to,
 * and fetches the URLs *that* file requests. Reading the local build instead
 * would repeat the original mistake in miniature — verifying an artifact
 * nobody is served. The first version of this script did exactly that and
 * passed while the site was still broken.
 *
 * The version segment moves on every deploy (76 -> 82 on the one that fixed
 * this), which is why the URLs must be absolute against the unversioned path
 * and why this resolves the stylesheet fresh rather than remembering it.
 *
 * --local checks the built file instead, for a pre-deploy sanity run. It says
 * so in its output, because a local pass proves less.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const arg = (n) => (process.argv.find((a) => a.startsWith(`--${n}=`)) || "").split("=")[1];
const domain = arg("domain") || process.env.HUBSPOT_SITE_DOMAIN || "www.novieri.com";
const local = process.argv.includes("--local");

const fail = (...msg) => {
  console.error(...msg);
  process.exit(1);
};

/** Every @font-face src URL in a stylesheet, in order, deduplicated. */
function fontUrls(css) {
  const faces = css.match(/@font-face\s*\{[^}]*\}/gs) || [];
  const urls = faces.flatMap((f) =>
    [...f.matchAll(/url\(\s*["']?([^"')]+?)["']?\s*\)/g)].map((m) => m[1]),
  );
  return [...new Set(urls)];
}

let css;
let source;

if (local) {
  const path = `${ROOT}/hubspot/src/theme/novieri/css/theme.css`;
  try {
    css = readFileSync(path, "utf8");
  } catch {
    fail(`No built stylesheet at ${path} — run \`npm run build:hubspot\` first.`);
  }
  source = `${path} (local build — proves the CSS is right, not that the site serves it)`;
} else {
  const page = await fetch(`https://${domain}/`).then((r) => r.text());
  // The theme stylesheet, as linked by the page. Not reconstructed from a
  // remembered path: the version segment in it changes on every deploy.
  const href = (page.match(/href="([^"]*novieri_theme[^"]*\.css[^"]*)"/) || [])[1];
  if (!href) fail(`Could not find the theme stylesheet linked from https://${domain}/`);
  const res = await fetch(href);
  if (!res.ok) fail(`The stylesheet the page links to returned ${res.status}: ${href}`);
  css = await res.text();
  source = href;
}

console.log(`stylesheet  ${source}`);

const urls = fontUrls(css);
if (!urls.length) fail("That stylesheet declares no @font-face URLs at all. That is itself wrong.");

// A relative URL is the shape of the original bug, so it fails on sight rather
// than being resolved and quietly passing against the wrong directory.
const relative = urls.filter((u) => !u.startsWith("/") && !/^https?:|^data:/.test(u));
if (relative.length) {
  console.error("\nThese @font-face URLs are relative, so they resolve against whatever path");
  console.error("HubSpot happens to serve the stylesheet from — which is not where the fonts are:");
  for (const u of relative) console.error(`  ${u}`);
  fail("");
}

let bad = 0;
for (const u of urls) {
  const href = /^https?:/.test(u) ? u : `https://${domain}${u}`;
  try {
    const res = await fetch(href, { redirect: "follow" });
    const type = (res.headers.get("content-type") || "").split(";")[0];
    const ok = res.ok && /font|octet-stream/i.test(type);
    if (!ok) bad += 1;
    console.log(`${ok ? "ok   " : "FAIL "} ${res.status} ${type || "(no type)"}  ${u}`);
  } catch (err) {
    bad += 1;
    console.log(`FAIL  ${String(err.message).slice(0, 60)}  ${u}`);
  }
}

if (bad) {
  console.error(`\n${bad} of ${urls.length} font URL(s) do not serve a font from ${domain}.`);
  fail("Every visitor is reading the site in their own OS default face.");
}
console.log(`\nAll ${urls.length} font URL(s) serve a font from ${domain}.`);
