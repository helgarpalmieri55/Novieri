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
import { readFileSync } from "node:fs";

const TOKEN = process.env.HUBSPOT_PRIVATE_APP_TOKEN;
const DOMAIN = process.env.HUBSPOT_SITE_DOMAIN || "www.novieri.com";
const THEME = "@projects/Novieri website/novieri_theme/templates";

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const only = (args.find((a) => a.startsWith("--only=")) || "").split("=")[1];
const verify = (args.find((a) => a.startsWith("--verify=")) || "").split("=")[1];
const dump = args.find((a) => a.startsWith("--dump="))?.slice("--dump=".length);
const publish = (args.find((a) => a.startsWith("--publish=")) || "").split("=")[1];
const variants = args.includes("--language-variants");
const retemplate = args.includes("--retemplate");
const renameProducts = args.includes("--rename-products");
const syncNames = args.includes("--sync-names");

/**
 * The Spanish slugs, from src/i18n/pathnames.json. The home page is "es"
 * rather than "" — only one page can hold the root, and that is English.
 */
const ES_SLUGS = {
  "": "es",
  services: "servicios",
  "services/ai-automation": "servicios/ia-y-automatizacion",
  "services/managed-it": "servicios/it-administrado",
  "services/cybersecurity-compliance": "servicios/ciberseguridad-y-cumplimiento",
  "services/custom-software": "servicios/desarrollo-a-medida",
  "services/it-consulting": "servicios/consultoria-it",
  about: "nosotros",
  contact: "contacto",
  "self-diagnosis": "autodiagnostico",
  "self-diagnosis/sample-report": "autodiagnostico/informe-de-ejemplo",
  pricing: "precios",
  industries: "industrias",
  "industries/bpo": "industrias/bpo",
  "industries/hospitality": "industrias/hoteleria",
  "industries/education": "industrias/educacion",
  // Colombian software, BPO and payment companies are asked for SOC 2 and PCI
  // DSS by the customers they sell to, so this one is a variant like the rest.
  // The Colombian-only industries (restaurantes, pymes) are not variants —
  // they are created directly, in Spanish.
  "industries/regulated": "industrias/pci-dss-soc-2",
  "case-studies": "casos-de-exito",
  "case-studies/restaurant-whatsapp-ai": "casos-de-exito/restaurante-whatsapp-ia",
  products: "productos",
  "products/ai-virtual-assistant": "productos/asistente-virtual-ia",
  "products/ai-website-chatbot": "productos/chatbot-web-ia",
  "products/whatsapp-ai-assistant": "productos/asistente-ia-whatsapp",
  "products/visitor-intelligence": "productos/inteligencia-de-visitantes",
  "products/vulnerability-management": "productos/gestion-de-vulnerabilidades",
  "products/ai-ecommerce": "productos/ecommerce-ia",
  "products/ai-websites": "productos/sitios-web-con-ia",
  "legal/privacy-policy": "legal/politica-de-privacidad",
  "legal/data-deletion": "legal/eliminacion-de-datos",
  "legal/terms-of-service": "legal/terminos-del-servicio",
  "legal/cookie-policy": "legal/politica-de-cookies",
  "legal/terms-of-use": "legal/terminos-de-uso",
};

/**
 * Slugs come from src/i18n/pathnames.json, so they match what the React site
 * published and any link already pointing at novieri.com keeps working.
 * The home page is deliberately absent: it exists, and its empty slug is what
 * makes it the homepage — not something to risk to a script.
 */
const PAGES = [
  // Not the service template: the index has a hero, its cards and a call to
  // action, and borrowing the service template meant a split-note, a package
  // table and an FAQ it had no copy for rendered their English defaults.
  { key: "services", template: "services-index", slug: "services",
    name: "Services",
    htmlTitle: "Services — Novieri",
    metaDescription: "AI & automation, managed IT, cybersecurity & compliance, custom software, and IT consulting. Five pillars, one enterprise standard." },
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
    metaDescription: "Web apps, APIs, and integrations in React, FastAPI, and Node, built around the way your operation already works." },
  { key: "it-consulting", template: "service", slug: "services/it-consulting",
    name: "IT consulting",
    htmlTitle: "IT consulting — Novieri",
    metaDescription: "Technology decisions made with someone who has had to live with them: what to buy, what to fix, what it really costs, and when the answer is to wait." },
  { key: "pricing", template: "pricing", slug: "pricing",
    name: "Pricing",
    htmlTitle: "Pricing — Novieri",
    metaDescription: "Published price anchors for managed IT, AI & automation, cybersecurity, custom software, and IT consulting. Honest starting points — the exact number comes with a proposal." },
  { key: "solutions", template: "solutions", slug: "products",
    name: "Products",
    htmlTitle: "Products — Novieri",
    metaDescription: "Products Novieri builds and operates: an AI receptionist, a WhatsApp assistant, vulnerability management, visitor intelligence, e-commerce, and websites with AI inside." },
  { key: "sol-receptionist", template: "solution", slug: "products/ai-virtual-assistant",
    name: "AI Virtual Receptionist",
    htmlTitle: "AI Virtual Receptionist — Novieri",
    metaDescription: "An AI receptionist that answers your sales line in a natural voice, captures the caller into your CRM, and books the meeting when nobody is in." },
  { key: "sol-sitechat", template: "solution", slug: "products/ai-website-chatbot",
    name: "Website AI Chatbot",
    htmlTitle: "Website AI Chatbot — Novieri",
    metaDescription: "An AI assistant for your website that answers from your own information, says that it is an AI, and hands real conversations to your team — the same one running on this page." },
  { key: "sol-whatsapp", template: "solution", slug: "products/whatsapp-ai-assistant",
    name: "WhatsApp AI Assistant",
    htmlTitle: "WhatsApp AI Assistant — Novieri",
    metaDescription: "A WhatsApp assistant for restaurants and hotels that genuinely converses, takes orders and reservations, and hands over to your team when it should." },
  { key: "sol-visitor", template: "solution", slug: "products/visitor-intelligence",
    name: "Website Visitor Intelligence",
    htmlTitle: "Website Visitor Intelligence — Novieri",
    metaDescription: "See which companies visit your website and get the ones worth calling in your inbox every morning, ranked against your best clients." },
  { key: "sol-sentinel", template: "solution", slug: "products/vulnerability-management",
    name: "Vulnerability Management",
    htmlTitle: "Vulnerability management — Novieri",
    metaDescription: "Find the weaknesses in your systems before someone else does, know which ones actually matter, and hold the evidence an auditor asks for." },
  { key: "sol-ventia", template: "solution", slug: "products/ai-ecommerce",
    name: "AI E-commerce",
    htmlTitle: "E-commerce with an AI sales agent — Novieri",
    metaDescription: "Novieri's e-commerce platform: complete online stores with an AI salesperson inside, and several brands on one foundation." },
  { key: "sol-websites", template: "solution", slug: "products/ai-websites",
    name: "AI-powered Websites",
    htmlTitle: "AI-powered websites — Novieri",
    metaDescription: "Commercial websites, bilingual and fast, with the AI we run in production working inside them." },
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
  // Meta's App Review checks this one for real: a WhatsApp app handling a
  // restaurant's customers has to show a working way to ask for deletion, and
  // pointing the field at facebook.com is a refusal.
  { key: "data-deletion", template: "legal", slug: "legal/data-deletion",
    name: "Data deletion",
    htmlTitle: "Deleting your personal data — Novieri",
    metaDescription: "How to ask Novieri to delete your personal data, what gets deleted, what the law requires us to keep, and how long we take." },
  // Not the same document as terms-of-use: that one governs browsing
  // novieri.com, this one governs delivering the services someone has bought.
  { key: "terms-of-service", template: "legal", slug: "legal/terms-of-service",
    name: "Service terms",
    htmlTitle: "Terms and conditions of service — Novieri",
    metaDescription: "The terms under which Novieri delivers its services and products: how a contract is formed, pricing and payment, AI limitations, WhatsApp and Meta, data protection, service levels and liability." },
  { key: "cookies", template: "legal", slug: "legal/cookie-policy",
    name: "Cookie policy",
    htmlTitle: "Cookie policy — Novieri",
    metaDescription: "The cookies novieri.com uses, what each one is for, and how to change your choice." },
  { key: "terms", template: "legal", slug: "legal/terms-of-use",
    name: "Terms of use",
    htmlTitle: "Terms of use — Novieri",
    metaDescription: "The terms under which novieri.com may be used." },
];

/**
 * The industries and insights pages carry their metadata with their copy in
 * content/, not here — one file per page, written once and read by both this
 * script and the fill. A missing file just means that page is not created
 * yet, which is how the section grows one approved page at a time.
 */
const readContent = (p) => {
  try {
    return JSON.parse(readFileSync(`content/${p}.json`, "utf8"));
  } catch {
    return null;
  }
};

for (const s of ["bpo", "hospitality", "education", "regulated"]) {
  const c = readContent(`industries/en-${s}`);
  if (c) PAGES.push({ key: `ind-${s}`, template: "industry", slug: `industries/${s}`,
    name: c.name, htmlTitle: c.htmlTitle, metaDescription: c.metaDescription });
}
// Colombia-only industries, born in Spanish: no English page exists to be a
// variant of, so they are created directly with their language declared.
for (const s of ["restaurantes", "pymes"]) {
  const c = readContent(`industries/es-${s}`);
  if (c) PAGES.push({ key: `ind-${s}`, template: "industry", slug: `industrias/${s}`,
    name: c.name, htmlTitle: c.htmlTitle, metaDescription: c.metaDescription, language: "es" });
}
{
  const ix = readContent("industries/en-index");
  if (ix) PAGES.push({ key: "industries", template: "hub-index", slug: "industries",
    name: "Industries", htmlTitle: ix.htmlTitle, metaDescription: ix.metaDescription });
  const cs = readContent("case-studies/index");
  if (cs) PAGES.push({ key: "case-studies", template: "hub-index", slug: "case-studies",
    name: "Case studies", htmlTitle: cs.en.htmlTitle, metaDescription: cs.en.metaDescription });
  const c1 = readContent("case-studies/restaurant-whatsapp");
  if (c1) PAGES.push({ key: "cs-restaurant", template: "case-study", slug: "case-studies/restaurant-whatsapp-ai",
    name: c1.en.name, htmlTitle: c1.en.htmlTitle, metaDescription: c1.en.metaDescription });
  const sr = readContent("diagnostic/sample-report");
  if (sr) PAGES.push({ key: "sample-report", template: "case-study", slug: "self-diagnosis/sample-report",
    name: sr.en.name, htmlTitle: sr.en.htmlTitle, metaDescription: sr.en.metaDescription });
}

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

/**
 * The home page, for --sync-names and nothing else.
 *
 * It stays out of PAGES because creation is where the risk is: the empty slug
 * is what makes a page the homepage, and no script should be able to hand it
 * to something else. Renaming carries none of that risk — it patches a page
 * that already exists, matched by slug — and the cost of leaving it out was
 * the site's most-linked URL shipping `<title>Home</title>` with an empty
 * description, while every inner page carried a written one.
 *
 * No `name`: the sync skips undefined fields, so this changes the two SEO
 * fields on the English page and touches nothing on the Spanish variant,
 * which already has a Spanish title of its own.
 */
const HOME = {
  key: "home",
  slug: "",
  htmlTitle: "Novieri — managed IT, AI automation and cybersecurity",
  metaDescription:
    "We run and secure your company's technology and build the AI that removes repetitive work. Founder-led delivery in English and Spanish, from Barranquilla.",
};

const plan = PAGES.filter((p) => !only || p.key === only);
const syncPlan = [HOME, ...PAGES].filter((p) => !only || p.key === only);

// --dry-run belongs to whichever mode asked for it; on its own it describes
// creation, and the modes below that honour it check the flag themselves.
if (dryRun && !syncNames) {
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
 * Creates the Spanish page for each English one.
 *
 * Through create-language-variant, not as fresh pages: that links the two into
 * a language group, which is what makes HubSpot's language switcher — the one
 * in our header — offer the right translated URL. Twelve unrelated Spanish
 * pages would render fine and switch nowhere.
 *
 * The variant is born as a copy of the English page. This gives it its Spanish
 * slug and metadata; fill-hubspot-pages.mjs --locale=es replaces the copy.
 * Home is included here — unlike creation, a variant cannot take the root slug
 * by accident.
 */
/**
 * The Spanish title and description for each English slug. Read lazily —
 * every mode but the two that need it can run without touching the file.
 */
function esMeta() {
  const es = JSON.parse(readFileSync("messages/es.json", "utf8"));
  const pick = (c) => (c ? { title: c.htmlTitle, description: c.metaDescription } : undefined);
  const csIx = readContent("case-studies/index");
  const cs1 = readContent("case-studies/restaurant-whatsapp");
  return {
    industries: pick(readContent("industries/es-index")),
    "industries/bpo": pick(readContent("industries/es-bpo")),
    "industries/hospitality": pick(readContent("industries/es-hoteleria")),
    "industries/education": pick(readContent("industries/es-educacion")),
    "industries/regulated": pick(readContent("industries/es-regulated")),
    "case-studies": pick(csIx?.es),
    "case-studies/restaurant-whatsapp-ai": pick(cs1?.es),
    "self-diagnosis/sample-report": pick(readContent("diagnostic/sample-report")?.es),
    "": es.meta.home,
    services: es.meta.services,
    "services/ai-automation": es.meta.ai,
    "services/managed-it": es.meta.managedIt,
    "services/cybersecurity-compliance": es.meta.security,
    "services/custom-software": es.meta.software,
    "services/it-consulting": es.meta.itConsulting,
    about: es.meta.about,
    contact: es.meta.contact,
    "self-diagnosis": es.meta.diagnostic,
    pricing: es.meta.pricing,
    products: es.meta.solutions,
    "products/ai-virtual-assistant": es.meta.sol_aiAssistant,
    "products/ai-website-chatbot": es.meta.sol_siteChat,
    "products/whatsapp-ai-assistant": es.meta.sol_whatsapp,
    "products/visitor-intelligence": es.meta.sol_visitorIntel,
    "products/vulnerability-management": es.meta.sol_sentinel,
    "products/ai-ecommerce": es.meta.sol_ventia,
    // The legal pages were the last ES titles still in English.
    "legal/privacy-policy": es.meta.legalPrivacy,
    "legal/data-deletion": es.meta.legalDataDeletion,
    "legal/terms-of-service": es.meta.legalTermsOfService,
    "legal/cookie-policy": es.meta.legalCookies,
    "legal/terms-of-use": es.meta.legalTerms,
    "products/ai-websites": es.meta.sol_webDev,
  };
}

if (variants) {
  const META = esMeta();
  const listed = await api(`/cms/v3/pages/site-pages?${new URLSearchParams({ limit: "100" })}`);
  const pages = listed.results || [];
  const bySlug = new Map(pages.map((p) => [p.slug, p]));
  const taken = new Set(pages.map((p) => p.slug));

  for (const [enSlug, esSlug] of Object.entries(ES_SLUGS)) {
    if (taken.has(esSlug)) {
      console.log(`skip    ${esSlug} — already exists`);
      continue;
    }
    const source = bySlug.get(enSlug);
    if (!source) {
      console.error(`skip    ${esSlug} — no English page at "${enSlug}"`);
      process.exitCode = 1;
      continue;
    }
    const meta = META[enSlug];
    try {
      // Path, spelling and body all come from HubSpot's own OpenAPI spec
      // (api.hubspot.com/public/api/spec), not from the prose docs, which
      // call this "create-language-variant" — a path that 404s.
      const variant = await api("/cms/v3/pages/site-pages/multi-language/create-language-variation", {
        method: "POST",
        body: JSON.stringify({
          id: source.id,
          language: "es",
          primaryLanguage: "en",
          usePublished: true,
        }),
      });
      await api(`/cms/v3/pages/site-pages/${variant.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          slug: esSlug,
          ...(meta ? { htmlTitle: meta.title, metaDescription: meta.description } : {}),
        }),
      });
      console.log(`variant ${esSlug} — id ${variant.id} (from ${enSlug || "home"})`);
    } catch (e) {
      console.error(`FAILED  ${esSlug} — ${e.message.slice(0, 200)}`);
      process.exitCode = 1;
    }
  }
  process.exit(process.exitCode || 0);
}

/**
 * Moves every page onto the template PAGES declares for it, English and
 * Spanish alike.
 *
 * Creation skips a slug that already exists, which is right — it must not
 * clobber edits — but it also means a page created against one template stays
 * there forever. The services index needed to move off the service template,
 * and the only alternative was deleting a published page and rebuilding it.
 *
 * Content is not touched here; run fill-hubspot-pages.mjs afterwards, because
 * the widget names are positional and a different template means different
 * sections behind the same main-module-N.
 */
if (retemplate) {
  const ES = esMeta();
  const wanted = new Map();
  for (const p of PAGES.filter((x) => !only || x.key === only)) {
    const path = `${THEME}/${p.template}.hubl.html`;
    wanted.set(p.slug, { path, title: p.htmlTitle, description: p.metaDescription });
    // The title and description follow the same way. They are only written at
    // creation, so a page whose copy has since changed — the services index
    // said "four pillars" long after there were five — keeps advertising the
    // old one to search engines with nothing in the fill script to correct it.
    const es = ES[p.slug];
    if (ES_SLUGS[p.slug]) {
      wanted.set(ES_SLUGS[p.slug], { path, title: es?.title, description: es?.description });
    }
  }
  const listed = await api(`/cms/v3/pages/site-pages?${new URLSearchParams({ limit: "100" })}`);
  for (const page of listed.results || []) {
    const want = wanted.get(page.slug);
    if (!want) continue;
    const patch = {};
    if (page.templatePath !== want.path) patch.templatePath = want.path;
    if (want.title && page.htmlTitle !== want.title) patch.htmlTitle = want.title;
    if (want.description && page.metaDescription !== want.description) {
      patch.metaDescription = want.description;
    }
    if (!Object.keys(patch).length) continue;
    await api(`/cms/v3/pages/site-pages/${page.id}`, { method: "PATCH", body: JSON.stringify(patch) });
    console.log(`sync    ${page.slug} — ${Object.keys(patch).join(", ")}`);
  }
  console.log("\nRe-fill and re-publish each page touched; a draft change does not reach the live page.");
  process.exit(0);
}

/**
 * Moves the product pages from /solutions and /soluciones to /products and
 * /productos, leaving a 301 behind each old path.
 *
 * One-time, run while the section is barely indexed — the only moment a URL
 * change is nearly free. The order matters: pages move first, redirects are
 * created after, so a redirect never fights a live page for the same path.
 * Re-running is safe: a page already moved is skipped, and a redirect that
 * already exists comes back 409 and is reported, not fatal.
 */
if (renameProducts) {
  const TAILS = [
    "", "ai-virtual-assistant", "whatsapp-ai-assistant", "visitor-intelligence",
    "vulnerability-management", "ventia", "ai-websites",
  ];
  const ES_TAILS = [
    "", "asistente-virtual-ia", "asistente-ia-whatsapp", "inteligencia-de-visitantes",
    "gestion-de-vulnerabilidades", "ventia", "sitios-web-con-ia",
  ];
  const moves = [
    ...TAILS.map((t) => [t ? `solutions/${t}` : "solutions", t ? `products/${t}` : "products"]),
    ...ES_TAILS.map((t) => [t ? `soluciones/${t}` : "soluciones", t ? `productos/${t}` : "productos"]),
    // Round two: the product formerly named Ventia goes by what it is. A page
    // already moved is skipped, so re-running the whole list stays safe.
    ["products/ventia", "products/ai-ecommerce"],
    ["productos/ventia", "productos/ecommerce-ia"],
  ];

  const listed = await api(`/cms/v3/pages/site-pages?${new URLSearchParams({ limit: "100" })}`);
  const bySlug = new Map((listed.results || []).map((p) => [p.slug, p]));

  for (const [from, to] of moves) {
    const page = bySlug.get(from);
    if (!page) {
      console.log(bySlug.has(to) ? `moved   ${to} — already there` : `skip    ${from} — no page at either path`);
      continue;
    }
    await api(`/cms/v3/pages/site-pages/${page.id}`, { method: "PATCH", body: JSON.stringify({ slug: to }) });
    // A draft slug is not a live slug until the page is pushed live again.
    await api(`/cms/v3/pages/site-pages/${page.id}`, {
      method: "PATCH",
      body: JSON.stringify({ publishDate: new Date().toISOString(), state: "PUBLISHED" }),
    });
    console.log(`move    /${from} -> /${to}`);
  }

  for (const [from, to] of moves) {
    try {
      await api("/cms/v3/url-redirects/", {
        method: "POST",
        body: JSON.stringify({
          routePrefix: `/${from}`,
          destination: `/${to}`,
          redirectStyle: 301,
          isOnlyAfterNotFound: false,
          isMatchFullUrl: false,
          isMatchQueryString: false,
          isPattern: false,
          isTrailingSlashOptional: true,
          isProtocolAgnostic: true,
        }),
      });
      console.log(`301     /${from} -> /${to}`);
    } catch (e) {
      console.log(`301?    /${from} — ${String(e.message).slice(0, 120)}`);
    }
  }

  console.log("\nNow re-run fill-content and es-fill so stored links point at the new paths,");
  console.log("and rename the two menu items in Content > Navigation.");
  process.exit(0);
}

/**
 * Brings each page's stored name, title and meta description back in line with
 * what PAGES says.
 *
 * All three are set once, when a page is created, and creation skips a slug
 * that already exists — so a page keeps whatever it was given on the day it was
 * made, no matter how many times this file changes afterwards. The fill script
 * does not touch them either: it writes modules, and these are page fields.
 *
 * All three are published text. The name goes into the Service and
 * BreadcrumbList JSON-LD via content.name; the title and description are what a
 * search result shows. The vulnerability page was still carrying a product
 * codename in its JSON-LD months after the site stopped saying it out loud, and
 * the custom-software page kept a tagline in its meta description for a release
 * after the tagline itself was rewritten. Same cause both times.
 *
 * Reconciling against PAGES rather than a list of known-bad values means the
 * next edit in this file propagates on its own. Spanish variants take the
 * English name, which is the convention every other page here already follows —
 * but not the English title or description, which would be wrong on a Spanish
 * page; those are left to the language variant that owns them.
 *
 * Read-only with --dry-run.
 */
if (syncNames) {
  const pages = [];
  for (let after; ; ) {
    const q = new URLSearchParams({ limit: "100", ...(after ? { after } : {}) });
    const res = await api(`/cms/v3/pages/site-pages?${q}`);
    pages.push(...(res.results || []));
    after = res.paging?.next?.after;
    if (!after) break;
  }
  const bySlug = new Map(pages.map((p) => [p.slug, p]));

  let changed = 0;
  for (const p of syncPlan) {
    const es = ES_SLUGS[p.slug];
    for (const slug of [p.slug, es].filter((s) => s !== undefined)) {
      const page = bySlug.get(slug);
      if (!page) {
        console.log(`skip    ${slug || "(home)"} — no such page`);
        continue;
      }
      // English wording on a Spanish page would be a worse bug than the one
      // this fixes, so a variant only gets the fields that are language-neutral.
      const want = slug === es
        ? { name: p.name }
        : { name: p.name, htmlTitle: p.htmlTitle, metaDescription: p.metaDescription };
      const patch = {};
      for (const [field, value] of Object.entries(want)) {
        if (value !== undefined && page[field] !== value) patch[field] = value;
      }
      if (!Object.keys(patch).length) continue;
      changed += 1;
      for (const [field, value] of Object.entries(patch)) {
        console.log(`${dryRun ? "would " : "set   "}  ${slug || "(home)"} ${field}: ${JSON.stringify(page[field])} -> ${JSON.stringify(value)}`);
      }
      if (dryRun) continue;
      await api(`/cms/v3/pages/site-pages/${page.id}`, { method: "PATCH", body: JSON.stringify(patch) });
      // None of it reaches the rendered page until it is pushed live again,
      // the same way a changed slug does not.
      await api(`/cms/v3/pages/site-pages/${page.id}`, {
        method: "PATCH",
        body: JSON.stringify({ publishDate: new Date().toISOString(), state: "PUBLISHED" }),
      });
    }
  }
  console.log(changed ? `\n${changed} page(s) ${dryRun ? "would change" : "changed"}.` : "\nEvery page already matches what this file declares.");
  process.exit(0);
}

/**
 * Publishes a page. `all` publishes every page this script manages.
 *
 * Deliberately separate from creation: a page going live deserves its own
 * decision, and the point of creating drafts is to look before that happens.
 */
if (publish) {
  const targets = publish === "all" ? PAGES.map((p) => p.slug) : [publish];
  for (const slug of targets) {
    const found = await findPage(slug);
    if (!found) {
      console.error(`skip    ${slug} — no such page`);
      continue;
    }
    await api(`/cms/v3/pages/site-pages/${found.id}`, {
      method: "PATCH",
      body: JSON.stringify({ publishDate: new Date().toISOString(), state: "PUBLISHED" }),
    });
    console.log(`publish ${slug || "(home)"} — id ${found.id}`);
  }
  process.exit(0);
}

/**
 * Reports a page's stored content.
 *
 * Read this carefully before trusting it: an untouched drag-and-drop page has
 * EMPTY layoutSections and still renders every module in its template, because
 * HubSpot only stores layoutSections once somebody edits the area in the page
 * editor. The home page proves it — ten modules on screen, `{}` from the API.
 *
 * So zero sections here is normal, not a failure. The only honest check that a
 * page has content is fetching its published URL.
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
    console.log("\nNo stored content — which is what an unedited drag-and-drop page");
    console.log("looks like. It still renders the template's modules. Confirm by");
    console.log("publishing it and fetching the URL; do not conclude anything here.");
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
        ...(p.language ? { language: p.language } : {}),
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
