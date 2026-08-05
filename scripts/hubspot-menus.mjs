/**
 * Lists the site's navigation menus and their ids.
 *
 * Read-only, deliberately. /content/api/v2/menus is not in HubSpot's published
 * API spec and is not documented; it answers, and it lists the six menus, but
 * its GET wraps the tree in one envelope shape and its PUT wants another, and
 * nothing says which. Two attempts at adding an item were refused by this
 * script's own guard before either reached HubSpot.
 *
 * Writing menu items is therefore left to Content > Navigation in HubSpot,
 * where it is a thirty-second job. Guessing at the write shape of an
 * undocumented endpoint risks replacing the live navigation with an empty one,
 * which is not a trade worth making to save those thirty seconds.
 *
 *   node scripts/hubspot-menus.mjs
 */
const TOKEN = process.env.HUBSPOT_PRIVATE_APP_TOKEN;

async function api(path, options = {}) {
  const res = await fetch(`https://api.hubapi.com${path}`, {
    ...options,
    headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json", ...options.headers },
  });
  const text = await res.text();
  let body = {};
  try {
    body = text ? JSON.parse(text) : {};
  } catch {
    body = { raw: text.slice(0, 300) };
  }
  return { ok: res.ok, status: res.status, body };
}

if (!TOKEN) {
  console.error("HUBSPOT_PRIVATE_APP_TOKEN is not set.");
  process.exit(1);
}

const listed = await api("/content/api/v2/menus?limit=50");
if (!listed.ok) {
  console.log(`GET /content/api/v2/menus -> ${listed.status}`);
  console.log(JSON.stringify(listed.body).slice(0, 400));
  console.log("\nNo menus API. The menus are edited in HubSpot: Content > Navigation.");
  process.exit(0);
}

const menus = listed.body.objects || listed.body.results || [];
for (const m of menus) {
  const top = (m.children || []).map((c) => c.label).join(" · ");
  console.log(`${m.id}  ${m.name}\n   ${top}`);
}

console.log("\nItems are added in HubSpot: Content > Navigation.");
