/**
 * Reads what the portal holds — forms, and a page's stored module content.
 *
 * Both exist because guessing at either was expensive: the form module's
 * field shape and the generated `main-module-N` names are not things to
 * invent. Neither of these writes anything.
 *
 * Wiring the contact form used to live here and does not any more. A PATCH of
 * a page's `widgets` replaces the map rather than merging into it, so two
 * scripts writing the same page erase each other — this one blanked the
 * contact hero, and the next fill blanked the form. fill-hubspot-pages.mjs
 * owns every page's widgets now, the form included.
 *
 *   node scripts/hubspot-forms.mjs --list
 *   node scripts/hubspot-forms.mjs --widgets=contact
 */
const TOKEN = process.env.HUBSPOT_PRIVATE_APP_TOKEN;
const args = process.argv.slice(2);
const widgetsOf = args.find((a) => a.startsWith("--widgets="))?.slice("--widgets=".length);

async function api(path, options = {}) {
  const res = await fetch(`https://api.hubapi.com${path}`, {
    ...options,
    headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json", ...options.headers },
  });
  const text = await res.text();
  const body = text ? JSON.parse(text) : {};
  if (!res.ok) throw new Error(`${res.status} ${body.message || res.statusText}`);
  return body;
}

if (!TOKEN) {
  console.error("HUBSPOT_PRIVATE_APP_TOKEN is not set.");
  process.exit(1);
}

if (widgetsOf !== undefined) {
  const pages = await api(`/cms/v3/pages/site-pages?${new URLSearchParams({ limit: "100" })}`);
  const page = (pages.results || []).find((p) => p.slug === widgetsOf);
  if (!page) {
    console.error(`no page with slug "${widgetsOf}"`);
    process.exit(1);
  }
  const full = await api(`/cms/v3/pages/site-pages/${page.id}`);
  console.log(`# ${full.name} (id ${full.id}, slug "${full.slug}")`);
  console.log(JSON.stringify(full.widgets, null, 1));
  process.exit(0);
}

const forms = await api(`/marketing/v3/forms?${new URLSearchParams({ limit: "100" })}`);
for (const f of forms.results || []) console.log(`${f.id}  ${f.formType}  ${f.name}`);
