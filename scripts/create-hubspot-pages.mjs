/**
 * Creates the site's pages in HubSpot from the theme's templates.
 *
 * Templates are not pages: the theme can be fully deployed while every link
 * in the nav still 404s, because a page has to exist for each route. Doing
 * that by hand is twelve trips through the page editor, twice over once the
 * Spanish variants are added.
 *
 * Runs in GitHub Actions so the token stays in repo secrets. It needs a
 * private app access token with the `content` scope — the personal access key
 * the deploy uses is for the CLI and will not authenticate this API.
 *
 *   node scripts/create-hubspot-pages.mjs --dry-run     # print the plan
 *   node scripts/create-hubspot-pages.mjs               # create as drafts
 *   node scripts/create-hubspot-pages.mjs --only=about  # one page, to prove it
 *
 * Pages are created as DRAFTS and never overwritten: a slug that already
 * exists is skipped, so re-running is safe and will not clobber edits made in
 * HubSpot. Publishing stays a human decision in the page editor.
 */
const TOKEN = process.env.HUBSPOT_PRIVATE_APP_TOKEN;
const DOMAIN = process.env.HUBSPOT_SITE_DOMAIN || "www.novieri.com";
const THEME = "@projects/Novieri website/novieri_theme/templates";

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const only = (args.find((a) => a.startsWith("--only=")) || "").split("=")[1];
const verify = (args.find((a) => a.startsWith("--verify=")) || "").split("=")[1];
const dump = args.find((a) => a.startsWith("--dump="))?.slice("--dump=".length);

/**
 * Slugs come from src/i18n/pathnames.json, so they match what the React site
 * published and any link already pointing at novieri.com keeps working.
 * The home page is deliberately absent: it exists, and its empty slug is what
 * makes it the homepage — not something to risk to a script.
 */
const PAGES = [
  { key: "services", template: "service", slug: "services",
    name: "Services",
    htmlTitle: "Services — Novieri",
    metaDescription: "AI & automation, managed IT, cybersecurity & compliance, and custom software. Four pillars, one enterprise standard." },
  { key: "ai", template: "service", slug: "services/ai-automation",
    name: "AI & automation",
    htmlTitle: "AI & automation — Novieri",
    metaDescription: "Agents, chatbots, and process automation with an honest assessment of where AI actually pays off in your operation." },
  { key: "managed-it", template: "service", slug: "services/managed-it",
    name: "Managed IT",
    htmlTitle: "Managed IT — Novieri",
    metaDescription: "Helpdesk, Microsoft 365, networking, firewall, and backups run by senior engineers. Your IT department, without having to build one." },
  { key: "security", template: "service", slug: "services/cybersecurity-compliance",
    name: "Cybersecurity & compliance",
    htmlTitle: "Cybersecurity & compliance — Novieri",
    metaDescription: "Hardening, vulnerability management, and SOC 2 / PCI DSS readiness. Real security, with evidence." },
  { key: "software", template: "service", slug: "services/custom-software",
    name: "Custom software",
    htmlTitle: "Custom software — Novieri",
    metaDescription: "Web apps, APIs, and integrations in React, FastAPI, and Node. Software that fits your operation, not the other way around." },
  { key: "about", template: "about", slug: "about",
    name: "About",
    htmlTitle: "About — Novieri",
    metaDescription: "Novieri is the fusion of two surnames: a family-run firm with enterprise standards, serving the US and Colombia from Barranquilla." },
  { key: "contact", template: "contact", slug: "contact",
    name: "Contact",
    htmlTitle: "Contact — Novieri",
    metaDescription: "Tell us about your case or book a call directly with the founders. Barranquilla, Colombia — working US Eastern hours." },
  { key: "diagnostic", template: "diagnostic", slug: "self-diagnosis",
    name: "Self-diagnosis",
    htmlTitle: "Technology self-diagnosis — Novieri",
    metaDescription: "Ten questions about how your operation runs today. You get a report with your level, the risks we see, and what we would do first." },
  { key: "privacy", template: "legal", slug: "legal/privacy-policy",
    name: "Privacy policy",
    htmlTitle: "Privacy policy — Novieri",
    metaDescription: "How Novieri collects, uses, and protects personal data, under Colombian Law 1581 of 2012." },
  { key: "cookies", template: "legal", slug: "legal/cookie-policy",
    name: "Cookie policy",
    htmlTitle: "Cookie policy — Novieri",
    metaDescription: "The cookies novieri.com uses, what each one is for, and how to change your choice." },
  { key: "terms", template: "legal", slug: "legal/terms-of-use",
    name: "Terms of use",
    htmlTitle: "Terms of use — Novieri",
    metaDescription: "The terms under which novieri.com may be used." },
];

async function api(path, options = {}) {
  const res = await fetch(`https://api.hubapi.com${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
  const text = await res.text();
  let body;
  try {
    body = text ? JSON.parse(text) : {};
  } catch {
    body = { raw: text.slice(0, 400) };
  }
  if (!res.ok) {
    const err = new Error(`${res.status} ${body.message || body.raw || res.statusText}`);
    err.status = res.status;
    err.body = body;
    throw err;
  }
  return body;
}

const plan = PAGES.filter((p) => !only || p.key === only);

if (dryRun) {
  console.log(`Would create ${plan.length} page(s) on ${DOMAIN}:\n`);
  for (const p of plan) {
    console.log(`  ${p.name}`);
    console.log(`    slug     ${p.slug}`);
    console.log(`    template ${THEME}/${p.template}.hubl.html`);
  }
  process.exit(0);
}

if (!TOKEN) {
  console.error("HUBSPOT_PRIVATE_APP_TOKEN is not set — a private app token with the `content` scope is required.");
  process.exit(1);
}

/** Finds a page by slug or name. The home page's slug is the empty string. */
async function findPage(needle) {
  const res = await api(`/cms/v3/pages/site-pages?${new URLSearchParams({ limit: "100" })}`);
  const pages = res.results || [];
  return (
    pages.find((p) => p.slug === needle) ||
    pages.find((p) => (p.name || "").toLowerCase() === needle.toLowerCase()) ||
    pages.find((p) => p.id === needle)
  );
}

/**
 * Prints a page's layoutSections verbatim.
 *
 * The API will not build drag-and-drop content from a template on its own, so
 * it has to be sent explicitly — and the only trustworthy description of the
 * shape HubSpot expects is a page HubSpot itself built. This reads that off
 * the home page rather than guessing from the docs.
 */
if (dump !== undefined) {
  const found = await findPage(dump);
  if (!found) {
    console.error(`no page matching "${dump}"`);
    process.exit(1);
  }
  const full = await api(`/cms/v3/pages/site-pages/${found.id}`);
  console.log(`# ${full.name} (id ${full.id}, slug "${full.slug}")`);
  console.log(`# template ${full.templatePath}`);
  console.log(JSON.stringify(full.layoutSections, null, 1));
  process.exit(0);
}

/**
 * Reports what a created page actually contains. A page can be created
 * successfully and still be empty: the API accepts a drag-and-drop template
 * without necessarily materialising its modules, and "201 Created" says
 * nothing about that. This looks.
 */
if (verify) {
  const q = new URLSearchParams({ limit: "100" });
  const res = await api(`/cms/v3/pages/site-pages?${q}`);
  const page = (res.results || []).find((p) => p.slug === verify || p.slug === `${verify}/`);
  if (!page) {
    console.error(`no page with slug "${verify}"`);
    process.exit(1);
  }
  const full = await api(`/cms/v3/pages/site-pages/${page.id}`);
  const sections = full.layoutSections || {};
  const names = [];
  const walk = (node) => {
    if (!node || typeof node !== "object") return;
    if (node.type === "module" || node.moduleId || node.module_id) {
      names.push(node.name || node.moduleId || node.module_id);
    }
    for (const child of Object.values(node.cells || node.rows || node.params || {})) walk(child);
    for (const key of ["cells", "rows", "widgets"]) {
      if (node[key]) for (const child of Object.values(node[key])) walk(child);
    }
  };
  for (const section of Object.values(sections)) walk(section);

  console.log(`page      ${full.name} (id ${full.id})`);
  console.log(`slug      ${full.slug}`);
  console.log(`template  ${full.templatePath}`);
  console.log(`state     ${full.currentState || full.state}`);
  console.log(`sections  ${Object.keys(sections).length}`);
  console.log(`widgets   ${Object.keys(full.widgets || {}).length}`);
  console.log(`modules   ${names.length}${names.length ? " — " + names.join(", ") : ""}`);
  if (!names.length && !Object.keys(full.widgets || {}).length) {
    console.log("\nEMPTY — the template's modules did not come through. The page needs");
    console.log("layoutSections supplied explicitly, or to be created in the editor.");
  }
  process.exit(0);
}

// One call, so an existing page is skipped rather than duplicated.
const existing = new Set();
for (let after = undefined, page = 0; page < 10; page += 1) {
  const q = new URLSearchParams({ limit: "100", ...(after ? { after } : {}) });
  const res = await api(`/cms/v3/pages/site-pages?${q}`);
  for (const p of res.results || []) existing.add(p.slug);
  after = res.paging?.next?.after;
  if (!after) break;
}
console.log(`${existing.size} page(s) already in the portal\n`);

let created = 0;
let skipped = 0;
for (const p of plan) {
  if (existing.has(p.slug)) {
    console.log(`skip    ${p.slug} — already exists`);
    skipped += 1;
    continue;
  }
  try {
    const made = await api("/cms/v3/pages/site-pages", {
      method: "POST",
      body: JSON.stringify({
        name: p.name,
        templatePath: `${THEME}/${p.template}.hubl.html`,
        slug: p.slug,
        htmlTitle: p.htmlTitle,
        metaDescription: p.metaDescription,
        domain: DOMAIN,
        state: "DRAFT",
      }),
    });
    console.log(`create  ${p.slug} — id ${made.id}`);
    created += 1;
  } catch (e) {
    console.error(`FAILED  ${p.slug} — ${e.message}`);
    if (e.body?.errors) console.error(`        ${JSON.stringify(e.body.errors).slice(0, 300)}`);
    process.exitCode = 1;
  }
}

console.log(`\n${created} created, ${skipped} skipped.`);
if (created) {
  console.log("All are DRAFTS. Review each in HubSpot, then publish — and check that the");
  console.log("template's modules came through, because a drag-and-drop page created");
  console.log("through the API does not always inherit them.");
}
