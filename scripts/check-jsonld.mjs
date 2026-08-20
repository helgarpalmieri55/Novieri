/**
 * Does every application/ld+json block actually parse?
 *
 * It did not. Measured on the live site: two of the four blocks on every blog
 * post, and two of the blocks on every service and product page, were invalid
 * JSON — so every Article, Service and BreadcrumbList this site has ever
 * published was discarded by search engines without a word.
 *
 * Two causes, both invisible in review. HubL's `escapejson` escapes a value's
 * contents but does not put quotes around them, so `"name": {{ x|escapejson }}`
 * emits `"name": Insights`. And `content.name` renders wrapped in HubSpot's
 * own COS markup, so `"headline": {{ content.name|escapejson }}` emitted a
 * `<span>` where a string belonged.
 *
 * The markup was valid HTML and the page looked perfect either way, which is
 * exactly the class of defect that needs a machine to notice.
 *
 *   node scripts/check-jsonld.mjs [--domain=www.novieri.com] [--limit=0]
 */
const arg = (n, d) => (process.argv.find((a) => a.startsWith(`--${n}=`)) || "").split("=")[1] || d;
const domain = arg("domain", "www.novieri.com");
const limit = Number(arg("limit", "0"));

const sitemap = await (await fetch(`https://${domain}/sitemap.xml`)).text();
let urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
if (limit > 0) urls = urls.slice(0, limit);
if (!urls.length) {
  console.error("check-jsonld: sitemap returned no URLs");
  process.exit(1);
}

const failures = [];
let blocks = 0;
for (const url of urls) {
  let html;
  try {
    html = await (await fetch(`${url}?hsDebug=true`)).text();
  } catch (e) {
    failures.push(`${url}: fetch failed — ${e.message}`);
    continue;
  }
  const found = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
  for (const [i, m] of found.entries()) {
    blocks += 1;
    try {
      JSON.parse(m[1]);
    } catch (e) {
      const head = m[1].trim().replace(/\s+/g, " ").slice(0, 120);
      failures.push(`${url} block ${i}: ${e.message} — ${head}`);
    }
  }
}

if (failures.length) {
  console.error(`check-jsonld: ${failures.length} invalid block(s) across ${urls.length} pages`);
  for (const f of failures) console.error(`  ${f}`);
  process.exit(1);
}
console.log(`check-jsonld: OK — ${blocks} structured-data blocks parsed across ${urls.length} pages.`);
