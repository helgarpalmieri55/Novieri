/**
 * Fetches every @font-face URL the built stylesheet asks for.
 *
 * The six brand faces 404'd in production and nobody noticed, because the
 * fallback stack — system-ui, then the platform default — is close enough that
 * no page looks broken. It looks like a different brand on every operating
 * system, which is worse than looking broken and much harder to spot. A design
 * critique found it; a build never would have, because the CSS was valid and
 * the files were uploaded. Only the URL joining them was wrong.
 *
 * So this checks the one thing neither the build nor the upload can: that the
 * address in the stylesheet returns a font at the domain that serves the site.
 *
 *   node scripts/check-font-urls.mjs [--domain www.novieri.com]
 *
 * Reads the URLs out of the built theme rather than a list kept here, so a new
 * face is covered the moment it is added and a removed one stops being checked.
 * Exits non-zero on any non-200 or any response that is not a font, which is
 * what makes it usable as a deploy gate.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const CSS = `${ROOT}/hubspot/src/theme/novieri/css/theme.css`;
const domain =
  (process.argv.find((a) => a.startsWith("--domain=")) || "").split("=")[1] ||
  process.env.HUBSPOT_SITE_DOMAIN ||
  "www.novieri.com";

let css;
try {
  css = readFileSync(CSS, "utf8");
} catch {
  console.error(`No built stylesheet at ${CSS} — run \`npm run build:hubspot\` first.`);
  process.exit(1);
}

// Only absolute paths are checkable against a domain. A relative one is the
// bug this exists to catch, so it is a failure rather than something to skip.
const urls = [...css.matchAll(/@font-face\s*\{[^}]*?url\(\s*["']?([^"')]+)["']?\s*\)/gs)].map(
  (m) => m[1],
);
if (!urls.length) {
  console.error("Found no @font-face URLs in the built stylesheet. That is itself suspicious.");
  process.exit(1);
}

const relative = urls.filter((u) => !u.startsWith("/") && !/^https?:/.test(u));
if (relative.length) {
  console.error("These @font-face URLs are relative, so they resolve against whatever path");
  console.error("HubSpot happens to serve the stylesheet from — which is not where the fonts are:");
  for (const u of relative) console.error(`  ${u}`);
  process.exit(1);
}

let bad = 0;
for (const u of [...new Set(urls)]) {
  const href = /^https?:/.test(u) ? u : `https://${domain}${u}`;
  let line;
  try {
    const res = await fetch(href, { redirect: "follow" });
    const type = res.headers.get("content-type") || "";
    const ok = res.ok && /font|octet-stream/i.test(type);
    if (!ok) bad += 1;
    line = `${ok ? "ok   " : "FAIL "} ${res.status} ${type.split(";")[0] || "(no type)"}  ${u}`;
  } catch (err) {
    bad += 1;
    line = `FAIL  ${String(err.message).slice(0, 60)}  ${u}`;
  }
  console.log(line);
}

if (bad) {
  console.error(`\n${bad} font URL(s) do not serve a font from ${domain}.`);
  console.error("Every visitor is reading the site in their own OS default face.");
  process.exit(1);
}
console.log(`\nAll ${new Set(urls).size} font URL(s) serve a font from ${domain}.`);
