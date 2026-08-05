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
 *   node scripts/hubspot-menus.mjs --add="Solutions::/solutions" --menu=<id>
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

const [label, url] = add.split("::");
const stub = menus.find((m) => String(m.id) === String(menuId));
if (!stub) {
  console.error(`no menu with id ${menuId} — pick one from the list above`);
  process.exit(1);
}

// The list response carries no children. Writing the stub back would replace
// the navigation with an empty one, so the full object is fetched first and
// the result is read back and counted rather than trusted.
//
// The two responses do not share a shape: the list returns menus flat, and a
// single menu nests its items under pages_tree.children. The guard below
// caught that on the first run rather than blanking the navigation.
const full = await api(`/content/api/v2/menus/${stub.id}`);
const tree = full.body.pages_tree;
if (!full.ok || !tree || !Array.isArray(tree.children)) {
  console.error(`could not read menu ${stub.id} in full — refusing to write`);
  console.error(JSON.stringify(full.body).slice(0, 300));
  process.exit(1);
}

const children = [...tree.children];
const before = children.length;
if (children.some((c) => c.label === label)) {
  console.log(`"${label}" is already in ${stub.name} — nothing to do`);
  process.exit(0);
}

// Next to Services rather than at the end: a product index belongs beside the
// service index, not after Contact.
const at = children.findIndex((c) => /^(services|servicios)$/i.test(c.label || ""));
const item = { label, url, type: "PAGE_LINK", children: [] };
children.splice(at >= 0 ? at + 1 : children.length, 0, item);

const saved = await api(`/content/api/v2/menus/${stub.id}`, {
  method: "PUT",
  body: JSON.stringify({ ...full.body, pages_tree: { ...tree, children } }),
});
if (!saved.ok) {
  console.error(`FAILED ${saved.status} ${JSON.stringify(saved.body).slice(0, 300)}`);
  process.exit(1);
}

const after = await api(`/content/api/v2/menus/${stub.id}`);
const now = after.body.pages_tree?.children || [];
console.log(`${stub.name}: ${before} items -> ${now.length}`);
console.log("  " + now.map((c) => c.label).join(" · "));
if (now.length !== before + 1) {
  console.error("item count is not what it should be — check the menu in HubSpot");
  process.exit(1);
}
