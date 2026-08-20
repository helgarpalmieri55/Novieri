/**
 * Which pages is HubSpot still serving from an old snapshot?
 *
 * HubSpot pre-renders pages and serves the snapshot from its CDN. Publishing
 * refreshes it — usually. Blog listings have no publish action of their own,
 * so they refresh only when something else nudges them, and one of them did
 * not: /es/insights served a 7 August snapshot for thirteen days while a live
 * render of the same URL was correct. Every visitor in that window got a page
 * missing its x-default, missing every booking link, and carrying an h1 that
 * had been fixed a week earlier.
 *
 * Nothing catches that. The template is right, the deploy is green, the fix is
 * merged, and the site serves the old thing anyway. This is the check that
 * says so.
 *
 *   node scripts/check-prerender-age.mjs
 *   node scripts/check-prerender-age.mjs --max-age-days=3 --domain=www.novieri.com
 *
 * Exit 1 when any page's snapshot is older than the threshold.
 */
const args = process.argv.slice(2);
const flag = (n, d) => (args.find((a) => a.startsWith(`--${n}=`)) || "").split("=")[1] || d;

const domain = flag("domain", process.env.HUBSPOT_SITE_DOMAIN || "www.novieri.com");
const maxAgeDays = Number(flag("max-age-days", "7"));

/** The pages worth watching: both homes, both blog listings, the money pages. */
const PATHS = [
  "/", "/es",
  "/insights", "/es/insights",
  "/pricing", "/precios",
  "/services", "/servicios",
  "/products", "/productos",
  "/industries", "/industrias",
  "/contact", "/contacto",
  "/about", "/nosotros",
];

const now = Date.now();
const rows = [];

for (const path of PATHS) {
  const url = `https://${domain}${path}`;
  try {
    const res = await fetch(url, { method: "GET", redirect: "follow" });
    const stamp = res.headers.get("x-hs-prerendered") || res.headers.get("last-modified");
    const at = stamp ? Date.parse(stamp) : NaN;
    rows.push({
      path,
      status: res.status,
      at,
      days: Number.isNaN(at) ? null : (now - at) / 86400000,
      live: !stamp,
    });
  } catch (e) {
    rows.push({ path, status: 0, at: NaN, days: null, error: e.message });
  }
}

let stale = 0;
for (const r of rows.sort((a, b) => (b.days ?? -1) - (a.days ?? -1))) {
  if (r.error) {
    console.log(`ERR   ${r.path.padEnd(14)} ${r.error}`);
    stale++;
    continue;
  }
  // No snapshot header at all means it is rendered per request, which is fine.
  if (r.live) {
    console.log(`live  ${r.path.padEnd(14)} not pre-rendered`);
    continue;
  }
  const age = r.days.toFixed(1).padStart(5);
  const bad = r.days > maxAgeDays;
  if (bad) stale++;
  console.log(`${bad ? "STALE" : "ok   "} ${r.path.padEnd(14)} ${age} days  (${new Date(r.at).toISOString().slice(0, 10)})`);
}

if (stale) {
  console.log("");
  console.log(`${stale} page(s) older than ${maxAgeDays} days.`);
  console.log("A snapshot this old predates fixes that are already merged and deployed.");
  console.log("Republish the page in HubSpot, or for a blog listing, re-sync the posts:");
  console.log("  Create HubSpot pages workflow -> mode: blog-sync");
  process.exit(1);
}
console.log(`\nEvery snapshot is under ${maxAgeDays} days old.`);
