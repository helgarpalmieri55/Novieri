/**
 * Puts the HubSpot forms where they belong.
 *
 * Two forms exist in the portal — "Website Contact" and "Website ·
 * Self-diagnosis" — and neither is wired to anything. The contact page places
 * @hubspot/form but has no form selected, so /contact renders no form at all;
 * the diagnostic's serverless function posts to whatever GUID is in the
 * HUBSPOT_FORM_DIAGNOSTIC project secret, which is not set.
 *
 * This matches them by name rather than by GUID, so nothing here has to be
 * kept in step by hand when a form is rebuilt.
 *
 *   node scripts/hubspot-forms.mjs --list          # names and GUIDs
 *   node scripts/hubspot-forms.mjs --widgets=contact
 *   node scripts/hubspot-forms.mjs                 # wire the contact pages
 */
import { readFileSync } from "node:fs";

const TOKEN = process.env.HUBSPOT_PRIVATE_APP_TOKEN;
const args = process.argv.slice(2);
const list = args.includes("--list");
const widgetsOf = args.find((a) => a.startsWith("--widgets="))?.slice("--widgets=".length);

/** The names as they read in Marketing > Forms. */
const CONTACT_FORM = "Website Contact";
const DIAGNOSTIC_FORM = "Website · Self-diagnosis";

/**
 * The contact page in both languages, each with the confirmation the visitor
 * sees in place of the form. The copy is the same line the old site showed on
 * a successful submit, from messages/*.json.
 */
const CONTACT_PAGES = [
  { slug: "contact", locale: "en" },
  { slug: "contacto", locale: "es" },
];

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

const pages = await api(`/cms/v3/pages/site-pages?${new URLSearchParams({ limit: "100" })}`);
const bySlug = new Map((pages.results || []).map((p) => [p.slug, p]));

if (widgetsOf !== undefined) {
  const page = bySlug.get(widgetsOf);
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
const byName = new Map((forms.results || []).map((f) => [f.name, f.id]));

if (list) {
  for (const f of forms.results || []) console.log(`${f.id}  ${f.formType}  ${f.name}`);
  process.exit(0);
}

const contactGuid = byName.get(CONTACT_FORM);
if (!contactGuid) {
  console.error(`no form named "${CONTACT_FORM}" — run --list to see what is there`);
  process.exit(1);
}

for (const { slug, locale } of CONTACT_PAGES) {
  const page = bySlug.get(slug);
  if (!page) {
    console.error(`skip   ${slug} — no such page`);
    process.exitCode = 1;
    continue;
  }
  // The shape is @hubspot/form's own: a `form` object holding form_id and how
  // to answer a submit. Inline rather than a redirect — there is no thank-you
  // page, and one would cost the visitor a page load to read one sentence.
  const message = JSON.parse(readFileSync(`messages/${locale}.json`, "utf8")).contact.form.success;
  try {
    await api(`/cms/v3/pages/site-pages/${page.id}`, {
      method: "PATCH",
      body: JSON.stringify({
        widgets: {
          contact_form: {
            body: {
              title: "",
              form: {
                form_id: contactGuid,
                response_type: "inline",
                message,
                redirect_id: null,
                redirect_url: null,
              },
            },
          },
        },
      }),
    });
    // A draft update does not reach the live page until it is published again.
    await api(`/cms/v3/pages/site-pages/${page.id}`, {
      method: "PATCH",
      body: JSON.stringify({ publishDate: new Date().toISOString(), state: "PUBLISHED" }),
    });
    console.log(`wired  ${slug} -> ${CONTACT_FORM} (${contactGuid})`);
  } catch (e) {
    console.error(`FAILED ${slug} — ${e.message}`);
    process.exitCode = 1;
  }
}

// The diagnostic's GUID cannot be set from here: it is a project secret, and
// secrets go in through the CLI. Print it so it can be copied over once.
const diagnosticGuid = byName.get(DIAGNOSTIC_FORM);
console.log(
  diagnosticGuid
    ? `\nHUBSPOT_FORM_DIAGNOSTIC = ${diagnosticGuid}   (hs secrets add HUBSPOT_FORM_DIAGNOSTIC)`
    : `\nno form named "${DIAGNOSTIC_FORM}" — the diagnostic has nowhere to submit`,
);
