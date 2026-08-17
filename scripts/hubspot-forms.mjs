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
 *   node scripts/hubspot-forms.mjs                      # names and GUIDs
 *   node scripts/hubspot-forms.mjs --form="Website Contact"
 *   node scripts/hubspot-forms.mjs --widgets=contact
 */
import { execFileSync } from "node:child_process";

const TOKEN = process.env.HUBSPOT_PRIVATE_APP_TOKEN;
const args = process.argv.slice(2);
const widgetsOf = args.find((a) => a.startsWith("--widgets="))?.slice("--widgets=".length);
const formOf = args.find((a) => a.startsWith("--form="))?.slice("--form=".length);

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

/**
 * Field-by-field, which is the only comparison worth printing.
 *
 * Two copies of a page's `widgets` differ in one of two ways: a value changed,
 * or a repeater grew or shrank. Both come out here as a path — the widget's
 * slot name, then the field, then the row index — so a one-word edit inside a
 * forty-row price table reads as one line instead of two JSON dumps to eyeball.
 *
 * HubSpot's own bookkeeping is skipped: `deleted_at` is stamped on every
 * widget of a page whose editor session rebuilt the layout, and it says
 * nothing about the copy.
 */
const NOISE = new Set(["deleted_at", "id", "order", "type", "name", "child_css", "css", "styles"]);
const isObj = (v) => v && typeof v === "object" && !Array.isArray(v);
const scalar = (v) => (v === null || v === undefined ? "" : typeof v === "string" ? v : JSON.stringify(v));

function diff(a, b, path, out) {
  if (Array.isArray(a) || Array.isArray(b)) {
    const x = Array.isArray(a) ? a : [];
    const y = Array.isArray(b) ? b : [];
    for (let i = 0; i < Math.max(x.length, y.length); i++) diff(x[i], y[i], `${path}[${i}]`, out);
    return out;
  }
  if (isObj(a) || isObj(b)) {
    const keys = new Set([...Object.keys(a || {}), ...Object.keys(b || {})].filter((k) => !NOISE.has(k)));
    for (const k of keys) diff((a || {})[k], (b || {})[k], path ? `${path}.${k}` : k, out);
    return out;
  }
  if (scalar(a) !== scalar(b)) out.push([path, scalar(a), scalar(b)]);
  return out;
}

function report(label, a, b) {
  const rows = diff(a, b, "", []);
  if (!rows.length) {
    console.log(`# ${label}: identical`);
    return;
  }
  console.log(`# ${label}: ${rows.length} field${rows.length === 1 ? "" : "s"} differ`);
  for (const [path, was, now] of rows) {
    console.log(`  ${path}`);
    console.log(`    - ${was || "(empty)"}`);
    console.log(`    + ${now || "(empty)"}`);
  }
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
  console.log(`# updated ${full.updatedAt}  published ${full.publishDate}`);
  /**
   * The draft, separately.
   *
   * An edit made in HubSpot and not published lives in a buffer the page
   * object does not show: GET on the page returns what is live. Reading only
   * that and concluding "nothing changed" is how an edit sitting in the
   * editor gets reported as a caching problem. This asks for the buffer and
   * says what is in it that the live page does not have.
   */
  const draft = await api(`/cms/v3/pages/site-pages/${page.id}/draft`).catch((e) => {
    console.log(`# no draft available (${e.message})`);
    return null;
  });
  console.log(JSON.stringify(full.widgets, null, 1));
  if (draft) report("draft vs live", full.widgets, draft.widgets);
  /**
   * And what the repo would write, which is the comparison that decides
   * whether a fill is safe to run. The locale is not passed in: the fill
   * script keys its pages by the slug of the language it is filling, so the
   * English attempt failing on a Spanish slug is itself the answer.
   */
  const emit = (locale) => {
    try {
      const flags = [`--emit=${widgetsOf}`, ...(locale === "es" ? ["--locale=es"] : [])];
      return JSON.parse(execFileSync("node", ["scripts/fill-hubspot-pages.mjs", ...flags], { encoding: "utf8" }));
    } catch {
      return null;
    }
  };
  const repo = emit("en") || emit("es");
  if (!repo) console.log("# no page with this slug in messages/*.json — nothing to compare against");
  else report("repo vs live", full.widgets, repo);
  process.exit(0);
}

const forms = await api(`/marketing/v3/forms?${new URLSearchParams({ limit: "100" })}`);

if (formOf !== undefined) {
  const match = (forms.results || []).find((f) => f.name === formOf || f.id === formOf);
  if (!match) {
    console.error(`no form named "${formOf}"`);
    process.exit(1);
  }
  console.log(JSON.stringify(await api(`/marketing/v3/forms/${match.id}`), null, 1));
  process.exit(0);
}

for (const f of forms.results || []) console.log(`${f.id}  ${f.formType}  ${f.name}`);
