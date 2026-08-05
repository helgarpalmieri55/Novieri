/**
 * Reads the site's navigation menus, and adds a top-level item to them.
 *
 * There is no menus endpoint in HubSpot's published API spec — the only one
 * that has ever existed is /content/api/v2/menus, which is not listed and not
 * documented. So this probes first and says plainly what it found, rather than
 * assuming. If the endpoint is gone, the two menu items are a job for
 * Content > Navigation and this script's answer is how you know that.
 *
 *   node scripts/hubspot-menus.mjs                       # list
 *   node scripts/hubspot-menus.mjs --add="Solutions:/solutions" --menu=<id>
 */
const TOKEN = process.env.HUBSPOT_PRIVATE_APP_TOKEN;
const args = process.argv.slice(2);
const add = args.find((a) => a.startsWith("--add="))?.slice("--add=".length);
const menuId = args.find((a) => a.startsWith("--menu="))?.slice("--menu=".length);

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
  console.log("\nNo usable menus API. Add the item in HubSpot: Content > Navigation.");
  process.exit(0);
}

const menus = listed.body.objects || listed.body.results || [];
for (const m of menus) {
  const top = (m.children || []).map((c) => c.label).join(" · ");
  console.log(`${m.id}  ${m.name}\n   ${top}`);
}

if (!add) process.exit(0);

const [label, url] = add.split(":");
const menu = menus.find((m) => String(m.id) === String(menuId));
if (!menu) {
  console.error(`no menu with id ${menuId} — pick one from the list above`);
  process.exit(1);
}
// Appended rather than inserted: where it sits in the order is an editorial
// choice, and moving it in the UI is one drag.
const children = [...(menu.children || []), { label, url, type: "PAGE_LINK", children: [] }];
const saved = await api(`/content/api/v2/menus/${menu.id}`, {
  method: "PUT",
  body: JSON.stringify({ ...menu, children }),
});
console.log(saved.ok ? `added "${label}" to ${menu.name}` : `FAILED ${saved.status} ${JSON.stringify(saved.body).slice(0, 300)}`);
