/**
 * Fills each page's modules with its own copy.
 *
 * Creating the pages gave every one of them its template's defaults, which is
 * why all five service pages and all three legal pages render identically.
 * The copy that belongs on each is already written, in messages/*.json — this
 * moves it into HubSpot.
 *
 * Two storage shapes, because HubSpot has two:
 *
 * - Templates that place modules with named `{% module %}` tags (legal,
 *   contact, diagnostic) store per-page content in `widgets`, keyed by that
 *   name. Straightforward, and what this file does today.
 * - Drag-and-drop templates (service, about) store content in
 *   `layoutSections`, which HubSpot only materialises once a page has been
 *   edited in the editor. Until one has, there is no reference for the shape
 *   and nothing here can safely write it.
 *
 *   node scripts/fill-hubspot-pages.mjs --dry-run
 *   node scripts/fill-hubspot-pages.mjs --only=legal/privacy-policy
 *   node scripts/fill-hubspot-pages.mjs
 */
import { readFileSync } from "node:fs";

const TOKEN = process.env.HUBSPOT_PRIVATE_APP_TOKEN;
const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const only = (args.find((a) => a.startsWith("--only=")) || "").split("=")[1];
const locale = (args.find((a) => a.startsWith("--locale=")) || "").split("=")[1] || "en";

const t = JSON.parse(readFileSync(`messages/${locale}.json`, "utf8"));

/**
 * Every slug below is written in English and translated here, so the content
 * map stays readable and there is one place that knows the Spanish routes.
 * From src/i18n/pathnames.json.
 */
const ES_SLUGS = {
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
  "legal/cookie-policy": "legal/politica-de-cookies",
  "legal/terms-of-use": "legal/terminos-de-uso",
};
const slugFor = (en) => (locale === "es" ? ES_SLUGS[en] ?? en : en);

/** The NIT stays empty until registration completes; [[…]] blocks drop it cleanly. */
const VARS = { company: "Novieri SAS", nit: "", email: "sales@novieri.com" };
/**
 * The legal pages route data-subject requests to a dedicated address per
 * language — governance the review asked for, and a mailbox that now exists.
 * Everything commercial keeps sales@.
 */
const LEGAL_VARS = { ...VARS, email: locale === "es" ? "privacidad@novieri.com" : "privacy@novieri.com" };

/**
 * Founder portraits.
 *
 * They are committed with the theme, and the obvious URL for them is the one
 * the logo is served from — /hubfs/raw_assets/public/@projects/…/images/. Two
 * successful deploys later that path still returned 404 for the portraits
 * while the logo beside them returned 200, so the theme copies are not a URL
 * we can point page content at.
 *
 * The file manager is. These are uploaded there from the repo on every fill,
 * overwriting in place, so the repo stays the source of truth, the URL is
 * stable, and there is no file GUID to keep in step by hand.
 */
// The logo rides along for the Organization JSON-LD in base.hubl.html, which
// needs a URL that survives theme rebuilds.
const PHOTOS = { helgar: "helgar.jpg", sylvana: "sylvana.jpg", logo: "novieri-isotipo-color-256px.png" };

async function uploadPhoto(file) {
  const form = new FormData();
  const bytes = readFileSync(`hubspot/src/theme/novieri/images/${file}`);
  const type = file.endsWith(".png") ? "image/png" : "image/jpeg";
  form.set("file", new Blob([bytes], { type }), file);
  form.set("folderPath", "/novieri");
  form.set("fileName", file);
  form.set(
    "options",
    JSON.stringify({
      access: "PUBLIC_INDEXABLE",
      overwrite: true,
      duplicateValidationStrategy: "NONE",
      duplicateValidationScope: "EXACT_FOLDER",
    }),
  );
  // Not api(): that helper sets a JSON content type, and multipart needs the
  // boundary fetch generates for it.
  const res = await fetch("https://api.hubapi.com/files/v3/files", {
    method: "POST",
    headers: { Authorization: `Bearer ${TOKEN}` },
    body: form,
  });
  const body = await res.json();
  if (!res.ok) throw new Error(`upload ${file}: ${res.status} ${body.message || res.statusText}`);
  return body.url;
}

/**
 * Fills {company} / {nit} / {email}. A [[…]] block is dropped whole when a
 * placeholder inside it has no value, so the legal identification reads
 * correctly before the razón social and NIT exist — no dangling "NIT —".
 * Ported from LegalPageTemplate.tsx, where the same copy is rendered.
 */
function interpolate(text) {
  // Only legal copy interpolates, so {email} resolves to the language's
  // dedicated privacy address, not the sales inbox.
  const fill = (s) => s.replace(/\{(\w+)\}/g, (m, key) => LEGAL_VARS[key] ?? m);
  return fill(
    text.replace(/\[\[(.+?)\]\]/g, (_, inner) => {
      const keys = [...inner.matchAll(/\{(\w+)\}/g)].map((m) => m[1]);
      return keys.every((k) => (LEGAL_VARS[k] ?? "") !== "") ? inner : "";
    }),
  );
}

const escapeHtml = (s) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** A legal section is paragraphs, an optional list, then more paragraphs. */
function sectionHtml(section) {
  const parts = [];
  for (const p of section.p || []) parts.push(`<p>${escapeHtml(interpolate(p))}</p>`);
  if (section.ul?.length) {
    parts.push(`<ul>${section.ul.map((li) => `<li>${escapeHtml(interpolate(li))}</li>`).join("")}</ul>`);
  }
  for (const p of section.p2 || []) parts.push(`<p>${escapeHtml(interpolate(p))}</p>`);
  return parts.join("");
}

const LEGAL_SLUGS = {
  privacy: "legal/privacy-policy",
  cookies: "legal/cookie-policy",
  terms: "legal/terms-of-use",
};
/** Labels come from the footer namespace, which already has both languages. */
const OTHER = {
  privacy: ["cookies", "terms"],
  cookies: ["privacy", "terms"],
  terms: ["privacy", "cookies"],
};

/** The one string with no home in messages/*.json. */
const NEXT_STEP = { en: "next step", es: "siguiente paso" }[locale] || "next step";

function legalWidgets(doc) {
  const c = t.legal.common;
  return {
    legal_doc: {
      body: {
        eyebrow: c.eyebrow,
        title: t.legal[doc].title,
        lead: t.legal[doc].lead,
        updated_label: c.updated,
        updated_value: c.updatedValue,
        toc_label: c.toc,
        identity_title: c.identityTitle,
        identity_body: `<p>${escapeHtml(interpolate(c.identityBody))}</p>`,
        sections: t.legal[doc].sections.map((s) => ({
          heading: s.h,
          content: sectionHtml(s),
        })),
        other_label: c.otherDocs,
        other_docs: OTHER[doc].map((key) => ({
          doc_label: t.footer[key],
          doc_link: { url: { type: "CONTENT", href: `/${slugFor(LEGAL_SLUGS[key])}` } },
        })),
        questions_title: c.questionsTitle,
        questions_body: interpolate(c.questionsBody),
        questions_email: LEGAL_VARS.email,
      },
    },
  };
}

/**
 * Drag-and-drop modules have no name of our choosing — HubSpot generates
 * `main-module-N`, numbered from 2 in the order the template declares them.
 * The rendered pages confirm it: About carries main-module-2..6, a service
 * page main-module-2..7. So they are addressable as widgets after all, and
 * no page needs hand-editing first.
 *
 * These orders must match the templates. Change a template's module order and
 * change it here, or a page will fill its sections with each other's copy.
 */
const SERVICE_SLOTS = {
  hero: "main-module-2",      // page-hero
  what: "main-module-3",      // dot-list
  how: "main-module-4",       // split-note
  packages: "main-module-5",  // package-cards
  faq: "main-module-6",       // faq-list
  cta: "main-module-7",       // cta-band
};
/**
 * The published products, and where each one lives. Three of the nine written
 * in messages/*.json are deliberately absent: the IT suite, the monitoring
 * service and Matter Flow stay unpublished until they are wanted.
 */
const SOLUTIONS = [
  ["aiAssistant", "products/ai-virtual-assistant"],
  ["siteChat", "products/ai-website-chatbot"],
  ["whatsapp", "products/whatsapp-ai-assistant"],
  ["visitorIntel", "products/visitor-intelligence"],
  ["sentinel", "products/vulnerability-management"],
  ["ventia", "products/ai-ecommerce"],
  ["webDev", "products/ai-websites"],
];

/**
 * Products sold in Colombia and not offered to the US market. Their card on
 * the products index is tagged for that market and disappears everywhere
 * else; the matching menu link is tagged by the header module.
 */
const CO_ONLY = new Set(["whatsapp"]);

/** Mirrors solution.hubl.html. */
const SOLUTION_SLOTS = {
  hero: "main-module-2",     // page-hero
  what: "main-module-3",     // dot-list
  demo: "main-module-4",     // audio-demo (renders only when given items)
  built: "main-module-5",    // split-note
  powered: "main-module-6",  // founders-band
  cta: "main-module-7",      // cta-band
};

/** Mirrors solutions.hubl.html — and services-index.hubl.html, which is the
    same three modules in the same order. */
const SOLUTIONS_INDEX_SLOTS = {
  hero: "main-module-2",   // page-hero
  cards: "main-module-3",  // pillar-cards
  cta: "main-module-4",    // cta-band
};

const ABOUT_SLOTS = {
  hero: "main-module-2",      // page-hero
  story: "main-module-3",     // founders-band
  people: "main-module-4",    // people-cards
  location: "main-module-5",  // split-note
  cta: "main-module-6",       // cta-band
};

/** The four pillars, and where each one's "learn more" points. */
const SERVICES = [
  ["ai", "services/ai-automation"],
  ["managedIt", "services/managed-it"],
  ["security", "services/cybersecurity-compliance"],
  ["software", "services/custom-software"],
  ["itConsulting", "services/it-consulting"],
];

function serviceWidgets(ns) {
  const s = t[ns];
  const c = t.serviceCommon;
  return {
    [SERVICE_SLOTS.hero]: {
      body: {
        eyebrow: s.hero.eyebrow,
        title: s.hero.title,
        intro: s.hero.promise,
        button_text: t.common.bookCall,
        button_link: { url: { type: "CONTENT", href: `/${slugFor("contact")}` } },
        seam: true,
      },
    },
    [SERVICE_SLOTS.what]: {
      body: {
        title: c.whatTitle,
        intro: "",
        tone: "light",
        items: s.what.items.map((i) => ({ item_title: i.title, item_body: i.body })),
      },
    },
    [SERVICE_SLOTS.how]: {
      body: { title: c.howTitle, intro: s.how.caption, footnote: "", picture: { src: "", alt: "" } },
    },
    [SERVICE_SLOTS.packages]: {
      body: {
        title: c.packagesTitle,
        intro: c.packagesIntro,
        link_label: t.common.talkCase,
        link_target: { url: { type: "CONTENT", href: `/${slugFor("contact")}` } },
        tiers: s.packages.tiers.map((x) => ({ tier_name: x.name, tier_blurb: x.blurb })),
      },
    },
    [SERVICE_SLOTS.faq]: {
      body: {
        title: c.faqTitle,
        schema: true,
        items: s.faq.items.map((q) => ({ question: q.q, answer: q.a })),
      },
    },
    [SERVICE_SLOTS.cta]: {
      body: {
        eyebrow: NEXT_STEP,
        title: s.ctaTitle || c.ctaTitle,
        subtitle: c.ctaSubtitle,
        // Each service asks for its own next step — "assess your audit
        // readiness" converts a security reader that "book a call" loses.
        button_text: s.ctaButton || t.common.bookCall,
        button_link: { url: { type: "CONTENT", href: `/${slugFor("contact")}` } },
      },
    },
  };
}

/**
 * The services index: hero, a card per service, call to action.
 *
 * It used to borrow the service template and fill three of its seven slots,
 * which left a split-note, a package table and an FAQ showing their English
 * field defaults on both language versions. It has its own template now, with
 * only the sections it has copy for, so there is nothing left to fall back to.
 */
function servicesIndexWidgets() {
  const idx = t.servicesIndex;
  return {
    [SOLUTIONS_INDEX_SLOTS.hero]: {
      body: {
        eyebrow: idx.eyebrow,
        title: idx.title,
        intro: idx.intro,
        button_text: t.common.bookCall,
        button_link: { url: { type: "CONTENT", href: `/${slugFor("contact")}` } },
        seam: true,
      },
    },
    [SOLUTIONS_INDEX_SLOTS.cards]: {
      body: {
        // Empty: the hero directly above already says what this page is, and a
        // second heading between it and the cards only repeats it.
        eyebrow: "",
        title: "",
        link_label: t.common.learnMore,
        cards: SERVICES.map(([key, slug], n) => ({
          card_name: t.pillars[key].name,
          card_tagline: t.pillars[key].tagline,
          card_tags: (t.pillars[key].tags || []).join(", "),
          card_link: { url: { type: "CONTENT", href: `/${slugFor(slug)}` } },
          card_colour: ACCENTS[n % ACCENTS.length],
          card_region: CO_ONLY.has(key) ? "co" : "all",
        })),
      },
    },
    [SOLUTIONS_INDEX_SLOTS.cta]: {
      body: {
        eyebrow: NEXT_STEP,
        title: t.serviceCommon.ctaTitle,
        subtitle: t.serviceCommon.ctaSubtitle,
        button_text: t.common.bookCall,
        button_link: { url: { type: "CONTENT", href: `/${slugFor("contact")}` } },
      },
    },
  };
}

/** Mirrors pricing.hubl.html. */
const PRICING_SLOTS = {
  hero: "main-module-2",
  tables: ["main-module-3", "main-module-4", "main-module-5", "main-module-6", "main-module-7"],
  note: "main-module-8",
  faq: "main-module-9",
  cta: "main-module-10",
};

/**
 * The pricing page. The two languages carry different price lists on purpose —
 * USD for the US market on English, COP for Colombia on Spanish — so this
 * reads whatever messages/<locale>.json says and asks no questions. The
 * template has exactly five table slots and both files carry exactly five
 * groups; the guard below turns a drift into a loud failure instead of a
 * table quietly wearing another pillar's prices.
 */
function pricingWidgets() {
  const p = t.pricing;
  if (p.groups.length !== PRICING_SLOTS.tables.length) {
    throw new Error(`pricing: ${p.groups.length} groups for ${PRICING_SLOTS.tables.length} table slots`);
  }
  return {
    [PRICING_SLOTS.hero]: {
      body: {
        eyebrow: p.hero.eyebrow,
        title: p.hero.title,
        intro: p.hero.intro,
        button_text: t.common.bookCall,
        button_link: { url: { type: "CONTENT", href: `/${slugFor("contact")}` } },
        seam: true,
      },
    },
    ...Object.fromEntries(
      p.groups.map((g, n) => [
        PRICING_SLOTS.tables[n],
        {
          body: {
            title: g.name,
            blurb: g.blurb,
            rows: g.rows.map((r) => ({
              service: r.service,
              price_usd: r.price_usd,
              price_cop: r.price_cop,
              unit: r.unit,
              note: r.note,
            })),
            footnote: g.footnote,
          },
        },
      ]),
    ),
    [PRICING_SLOTS.note]: {
      body: { title: p.note.title, intro: p.note.intro, footnote: "", picture: { src: "", alt: "" } },
    },
    [PRICING_SLOTS.faq]: {
      body: {
        title: t.serviceCommon.faqTitle,
        schema: true,
        items: p.faq.items.map((q) => ({ question: q.q, answer: q.a })),
      },
    },
    [PRICING_SLOTS.cta]: {
      body: {
        eyebrow: NEXT_STEP,
        title: t.serviceCommon.ctaTitle,
        subtitle: t.serviceCommon.ctaSubtitle,
        button_text: t.common.bookCall,
        button_link: { url: { type: "CONTENT", href: `/${slugFor("contact")}` } },
      },
    },
  };
}

function solutionWidgets(key) {
  const p = t.solutions.items[key];
  const c = t.solutions.common;
  return {
    [SOLUTION_SLOTS.hero]: {
      body: {
        eyebrow: c.eyebrow,
        title: p.hero.title,
        intro: p.hero.promise,
        button_text: c.demoCta,
        button_link: { url: { type: "CONTENT", href: `/${slugFor("contact")}` } },
        seam: true,
      },
    },
    [SOLUTION_SLOTS.what]: {
      body: {
        title: c.featuresTitle,
        intro: "",
        tone: "light",
        items: p.features.map((f) => ({ item_title: f.title, item_body: f.body })),
      },
    },
    // Only products with a `demo` block get playable audio; for the rest the
    // module receives no items and renders nothing.
    [SOLUTION_SLOTS.demo]: {
      body: {
        eyebrow: p.demo?.eyebrow || "",
        title: p.demo?.title || "",
        intro: p.demo?.intro || "",
        items: (p.demo?.items || []).map((i) => ({
          item_label: i.label,
          item_file: i.file,
          item_transcript: i.transcript || "",
          item_transcript_label: i.transcriptLabel || "",
        })),
        footnote: p.demo?.footnote || "",
      },
    },
    // The engineering, kept below the part written for the buyer. The stack
    // rides in the footnote, which is where the module puts its small print.
    [SOLUTION_SLOTS.built]: {
      body: {
        title: p.built.title,
        intro: p.built.body,
        footnote: (p.stack || []).join(" ·· "),
        picture: { src: "", alt: "" },
      },
    },
    [SOLUTION_SLOTS.powered]: {
      body: {
        eyebrow: c.poweredBadge,
        word_a: "nov",
        word_b: "ieri",
        intro: c.poweredBody,
        cta_text: "",
      },
    },
    [SOLUTION_SLOTS.cta]: {
      body: {
        eyebrow: NEXT_STEP,
        title: c.ctaTitle,
        subtitle: c.ctaSubtitle,
        button_text: c.demoCta,
        button_link: { url: { type: "CONTENT", href: `/${slugFor("contact")}` } },
      },
    },
  };
}

function solutionsIndexWidgets() {
  const idx = t.solutions.index;
  const c = t.solutions.common;
  return {
    [SOLUTIONS_INDEX_SLOTS.hero]: {
      body: {
        eyebrow: idx.eyebrow,
        title: idx.title,
        intro: idx.intro,
        button_text: t.common.bookCall,
        button_link: { url: { type: "CONTENT", href: `/${slugFor("contact")}` } },
        seam: true,
      },
    },
    [SOLUTIONS_INDEX_SLOTS.cards]: {
      body: {
        eyebrow: "",
        title: "",
        link_label: c.seeSolution,
        cards: SOLUTIONS.map(([key, slug], n) => ({
          card_name: t.solutions.items[key].name,
          card_tagline: t.solutions.items[key].tagline,
          card_tags: (t.solutions.items[key].tags || []).join(", "),
          card_link: { url: { type: "CONTENT", href: `/${slugFor(slug)}` } },
          card_colour: ACCENTS[n % ACCENTS.length],
        })),
      },
    },
    [SOLUTIONS_INDEX_SLOTS.cta]: {
      body: {
        eyebrow: NEXT_STEP,
        title: c.ctaTitle,
        subtitle: c.ctaSubtitle,
        button_text: c.demoCta,
        button_link: { url: { type: "CONTENT", href: `/${slugFor("contact")}` } },
      },
    },
  };
}

function aboutWidgets() {
  const a = t.about;
  return {
    [ABOUT_SLOTS.hero]: {
      body: {
        eyebrow: a.hero.eyebrow,
        title: a.hero.title,
        intro: a.hero.intro,
        button_text: "",
        seam: true,
      },
    },
    [ABOUT_SLOTS.story]: {
      body: {
        // The copy's own title, not a hardcoded English one — "the story"
        // rendered above Spanish text on /nosotros for a month.
        eyebrow: a.story.title.toLowerCase(),
        word_a: "nov",
        word_b: "ieri",
        intro: a.story.body,
        cta_text: "",
      },
    },
    [ABOUT_SLOTS.people]: {
      body: {
        title: a.founders.title,
        linkedin_label: locale === "es" ? "Perfil de LinkedIn" : "LinkedIn profile",
        people: [
          {
            person_name: a.founders.helgar.name,
            person_role: a.founders.helgar.role,
            person_bio: a.founders.helgar.bio,
            person_initials: "HP",
            person_linkedin: "https://www.linkedin.com/in/helgar-palmieri-82726b16a/",
            person_photo: {
              src: photoUrls.helgar || "",
              alt: a.founders.helgar.photoAlt,
              width: 400,
              height: 400,
            },
          },
          {
            person_name: a.founders.partner.name,
            person_role: a.founders.partner.role,
            person_bio: a.founders.partner.bio,
            person_initials: "SN",
            person_linkedin: "https://www.linkedin.com/in/sylvananova-272303/",
            person_photo: {
              src: photoUrls.sylvana || "",
              alt: a.founders.partner.photoAlt,
              width: 400,
              height: 400,
            },
          },
        ],
      },
    },
    [ABOUT_SLOTS.location]: {
      body: {
        title: a.location.title,
        intro: a.location.body,
        footnote: locale === "es"
          ? "Barranquilla · Colombia · español e inglés · horario compatible con EE. UU."
          : "Barranquilla · Colombia · English & Spanish · US Eastern-compatible hours",
        picture: { src: "", alt: "" },
      },
    },
    [ABOUT_SLOTS.cta]: {
      body: {
        eyebrow: NEXT_STEP,
        title: a.cta.title,
        subtitle: a.cta.subtitle,
        button_text: t.common.bookCall,
        button_link: { url: { type: "CONTENT", href: `/${slugFor("contact")}` } },
      },
    },
  };
}

/**
 * Home, in template order. The Spanish home is a clone of the English one, so
 * without this it would render English from the field defaults.
 */
// The audit's §11 order: identity, trust bar, who-we-help, outcomes, proof,
// service model, demo, process, founders, diagnostic, close.
const HOME_SLOTS = {
  hero: "main-module-2",
  stats: "main-module-3",
  segments: "main-module-4",
  why: "main-module-5",
  quotes: "main-module-6",
  caseStudy: "main-module-7",
  pillars: "main-module-8",
  chat: "main-module-9",
  how: "main-module-10",
  founders: "main-module-11",
  diagnose: "main-module-12",
  cta: "main-module-13",
};
const ACCENTS = ["text-plum", "text-teal", "text-gold-deep", "text-ink-muted", "text-plum-bright"];

function homeWidgets() {
  const h = t.home;
  const chatRow = (e) => ({
    row_kind: e.kind || e.from,
    message: e.text || "",
    caption: e.label || "",
    duration: e.duration || "",
    sent_at: e.t || "",
  });
  return {
    [HOME_SLOTS.hero]: {
      body: {
        ticker: SERVICES.map(([key], i) => ({ word: t.pillars[key].name, colour: ACCENTS[i] })),
        title_a: h.hero.titleA,
        title_b: h.hero.titleB,
        subtitle: h.hero.subtitle,
        primary_text: t.common.bookCall,
        primary_link: { url: { type: "CONTENT", href: `/${slugFor("contact")}` } },
        secondary_text: t.nav.services,
        secondary_link: { url: { type: "CONTENT", href: `/${slugFor("services")}` } },
      },
    },
    [HOME_SLOTS.stats]: {
      body: {
        footnote: h.proof.disclosure || "",
        stats: h.proof.items.map((s, i) => ({
          value: s.value,
          stat_label: s.label,
          colour: ACCENTS[i % 3],
        })),
      },
    },
    [HOME_SLOTS.segments]: {
      body: {
        dark: true,
        eyebrow: h.segments.eyebrow,
        title: h.segments.title,
        intro: h.segments.intro || "",
        link_label: h.segments.linkLabel,
        cards: h.segments.cards.map((c, i) => ({
          card_name: c.title,
          card_tagline: c.body,
          card_colour: ACCENTS[i % ACCENTS.length],
          card_link: { url: { type: "CONTENT", href: c.href } },
          card_link_label: c.linkLabel || "",
        })),
      },
    },
    [HOME_SLOTS.caseStudy]: {
      body: {
        eyebrow: h.caseStudy.eyebrow,
        title: h.caseStudy.title,
        subtitle: h.caseStudy.subtitle,
        button_text: h.caseStudy.button,
        button_link: { url: { type: "CONTENT", href: h.caseStudy.href } },
      },
    },
    [HOME_SLOTS.pillars]: {
      body: {
        eyebrow: h.services.eyebrow,
        title: h.services.title,
        link_label: t.common.learnMore,
        cards: SERVICES.map(([key, slug], i) => ({
          card_name: t.pillars[key].name,
          card_tagline: t.pillars[key].tagline,
          card_tags: t.pillars[key].tags.join(", "),
          card_colour: ACCENTS[i],
          card_link: { url: { type: "CONTENT", href: `/${slugFor(slug)}` } },
        })),
      },
    },
    [HOME_SLOTS.diagnose]: {
      body: {
        eyebrow: h.diagnose.eyebrow,
        title: h.diagnose.title,
        intro: h.diagnose.body,
        button_text: h.diagnose.button,
        button_link: { url: { type: "CONTENT", href: `/${slugFor("self-diagnosis")}` } },
        note: h.diagnose.note,
      },
    },
    [HOME_SLOTS.chat]: {
      body: {
        eyebrow: h.liveChat.eyebrow,
        title: h.liveChat.title,
        intro: h.liveChat.body,
        cta_text: h.liveChat.ctaService,
        cta_link: { url: { type: "CONTENT", href: `/${slugFor("services/ai-automation")}` } },
        channel: "whatsapp",
        chat_name: h.liveChat.header.name,
        chat_status: h.liveChat.header.status,
        badge: h.liveChat.badge,
        entries: h.liveChat.entries.map(chatRow),
        input_hint: h.liveChat.inputHint,
        capabilities: h.liveChat.foot.map((c) => ({ capability: c })),
      },
    },
    [HOME_SLOTS.why]: {
      body: {
        stat_value: h.why.stat.value,
        stat_caption: h.why.stat.label,
        title: h.why.title,
        points: h.why.points.map((p) => ({ point_title: p.title, point_body: p.body })),
      },
    },
    [HOME_SLOTS.how]: {
      body: {
        title: h.how.title,
        eyebrow: h.how.eyebrow,
        steps: h.how.steps.map((s) => ({ step_title: s.title, step_body: s.body })),
      },
    },
    [HOME_SLOTS.founders]: {
      body: {
        eyebrow: h.founders.eyebrow,
        word_a: "nov",
        word_b: "ieri",
        intro: h.founders.body,
        cta_text: h.founders.link,
        cta_link: { url: { type: "CONTENT", href: `/${slugFor("about")}` } },
      },
    },
    [HOME_SLOTS.cta]: {
      body: {
        eyebrow: NEXT_STEP,
        title: h.cta.title,
        subtitle: h.cta.subtitle,
        button_text: h.cta.button,
        button_link: { url: { type: "CONTENT", href: `/${slugFor("contact")}` } },
      },
    },
  };
}

/** The quiz: ten questions and their weights, plus every label around them. */
function diagnosticWidgets() {
  const d = t.diagnostic;
  return {
    page_hero: {
      body: {
        eyebrow: t.diagnostic.eyebrow,
        title: t.diagnostic.title,
        intro: t.diagnostic.intro,
        // The audit's ask: show what the report looks like before asking
        // ten questions and an email for it.
        button_text: d.sampleLabel || "",
        button_link: { url: { type: "CONTENT", href: `/${slugFor("self-diagnosis/sample-report")}` } },
        seam: true,
      },
    },
    diagnostic_quiz: {
      body: {
        endpoint: "/hs/serverless/diagnose",
        questions: d.questions.map((q) => ({
          question_text: q.q,
          options: q.options.map((o) => ({ option_text: o.v, option_weight: o.w })),
        })),
        levels: ["initial", "developing", "solid", "advanced"].map((k) => ({ level_name: d.levels[k] })),
        progress_label: d.progress,
        back_label: d.back,
        next_label: d.next,
        finish_label: d.finish,
        preview_title: d.preview.title,
        preview_body: d.preview.body,
        gate_title: d.gate.title,
        gate_body: d.gate.body,
        gate_name: d.gate.name,
        gate_company: d.gate.company,
        gate_email: d.gate.email,
        gate_phone: d.gate.phone,
        gate_consent: d.gate.consent,
        gate_optin: d.gate.optIn,
        gate_privacy: d.gate.privacy,
        gate_privacy_link: { url: { type: "CONTENT", href: `/${slugFor(LEGAL_SLUGS.privacy)}` } },
        gate_submit: d.gate.submit,
        gate_sending: d.gate.sending,
        result_title: d.result.title,
        // These four rendered their English defaults on both languages until
        // the review caught them — the fill simply never mapped them.
        result_strengths: d.result.strengths,
        result_risks: d.result.risks,
        result_priorities: d.result.priorities,
        result_print: d.result.print,
        no_script: d.noScript,
        result_cta: d.result.cta,
        result_cta_link: { url: { type: "CONTENT", href: `/${slugFor("contact")}` } },
        result_emailed: d.result.emailed,
        result_again: d.result.again,
        error_required: d.errors.required,
        error_name: d.errors.name,
        error_email: d.errors.email,
        error_company: d.errors.company,
        error_consent: d.errors.consent,
        error_failed: d.errors.failed.replace("{email}", VARS.email),
      },
    },
  };
}

if (!dryRun && !TOKEN) {
  console.error("HUBSPOT_PRIVATE_APP_TOKEN is not set.");
  process.exit(1);
}

// Before the maps are built, because aboutWidgets() needs the URLs. Skipped on
// a dry run and when About is not in the plan, so the common case does not
// re-upload two files to look at one page's copy.
const photoUrls = {};
if (!dryRun && (!only || only === slugFor("about"))) {
  for (const [who, file] of Object.entries(PHOTOS)) {
    photoUrls[who] = await uploadPhoto(file);
    console.log(`photo ${file} -> ${photoUrls[who]}`);
  }
}

/**
 * The contact form, found by the name it carries in Marketing > Forms rather
 * than by GUID, so rebuilding the form does not leave a dead reference here.
 * One per language: a HubSpot form has a single language, and /contacto was
 * rendering English labels over Spanish page copy.
 */
const CONTACT_FORM = locale === "es" ? "Website Contact · ES" : "Website Contact";
let contactFormGuid = "";
if (!dryRun && (!only || only === slugFor("contact"))) {
  const forms = await api(`/marketing/v3/forms?${new URLSearchParams({ limit: "100" })}`);
  const match = (forms.results || []).find((f) => f.name === CONTACT_FORM);
  if (!match) throw new Error(`no form named "${CONTACT_FORM}" — hubspot-forms.mjs --list shows what is there`);
  contactFormGuid = match.id;
  console.log(`form   ${CONTACT_FORM} -> ${contactFormGuid}`);
}

/**
 * The industries and insights pages: copy lives in content/, one file per
 * page per language, written by whoever drafts it and read verbatim here.
 * Slot numbers mirror the module order each template declares.
 */
const readContent = (p) => {
  try {
    return JSON.parse(readFileSync(`content/${p}.json`, "utf8"));
  } catch {
    return null;
  }
};

const heroOf = (c) => ({
  body: { eyebrow: c.hero.eyebrow, title: c.hero.title, intro: c.hero.intro, button_text: "", seam: true },
});
const ctaOf = (c, href) => ({
  body: {
    eyebrow: "",
    title: c.cta.title,
    subtitle: c.cta.subtitle,
    button_text: c.cta.buttonText,
    button_link: { url: { type: "CONTENT", href: href || `/${slugFor("contact")}` } },
  },
});
const cardsOf = (cards, linkLabel) => ({
  body: {
    eyebrow: "",
    title: "",
    cards: cards.map((k) => ({
      card_name: k.title,
      card_tagline: k.body,
      card_link: { url: { type: "CONTENT", href: k.href } },
      card_link_label: k.linkLabel || "",
    })),
    link_label: linkLabel,
  },
});

// industry template: hero, pains, help, note, faq, cta.
function industryWidgets(c) {
  return {
    "main-module-2": heroOf(c),
    "main-module-3": {
      body: {
        title: c.pains.title,
        intro: "",
        items: c.pains.items.map((i) => ({ item_title: i.title, item_body: i.body })),
      },
    },
    "main-module-4": {
      body: {
        eyebrow: c.help.eyebrow,
        title: c.help.title,
        cards: c.help.cards.map((k) => ({
          card_name: k.title,
          card_tagline: k.body,
          card_link: { url: { type: "CONTENT", href: k.href } },
          card_link_label: k.linkLabel || "",
        })),
        link_label: c.help.cards[0]?.linkLabel || "",
      },
    },
    "main-module-5": { body: { title: c.note.title, intro: c.note.body, footnote: "" } },
    "main-module-6": {
      body: {
        title: c.faq.title,
        items: c.faq.items.map((i) => ({ question: i.q, answer: i.a })),
        schema: true,
      },
    },
    "main-module-7": ctaOf(c),
  };
}

// hub-index template: hero, cards, cta.
function hubIndexWidgets(c) {
  return {
    "main-module-2": heroOf(c),
    "main-module-3": cardsOf(c.cards, c.cards[0]?.linkLabel || ""),
    "main-module-4": ctaOf(c),
  };
}

// case-study template: hero, stats, challenge, solution, results, cta.
// The sample diagnostic report borrows the same shape — a report and a case
// study are both "situation, action, prioritized outcome" — with its CTA
// pointed at the diagnostic instead of the contact page.
function caseStudyWidgets(c, ctaHref) {
  return {
    "main-module-2": heroOf(c),
    "main-module-3": { body: { stats: c.stats.map((s) => ({ value: s.value, stat_label: s.label })) } },
    "main-module-4": { body: { eyebrow: "", title: c.challenge.title, content: c.challenge.body } },
    "main-module-5": { body: { eyebrow: "", title: c.solution.title, content: c.solution.body } },
    "main-module-6": {
      body: {
        title: c.results.title,
        intro: "",
        items: c.results.items.map((i) => ({ item_title: i.title, item_body: i.body })),
      },
    },
    "main-module-7": ctaOf(c, ctaHref),
  };
}

/** slug -> widgets, for whichever content files exist in this checkout. */
function contentPages() {
  const out = {};
  if (locale === "es") {
    for (const [file, slug] of [
      ["industries/es-bpo", "industrias/bpo"],
      ["industries/es-hoteleria", "industrias/hoteleria"],
      ["industries/es-educacion", "industrias/educacion"],
      ["industries/es-restaurantes", "industrias/restaurantes"],
      ["industries/es-pymes", "industrias/pymes"],
    ]) {
      const c = readContent(file);
      if (c) out[slug] = industryWidgets(c);
    }
    const ix = readContent("industries/es-index");
    if (ix) out["industrias"] = hubIndexWidgets(ix);
    const cx = readContent("case-studies/index");
    if (cx) out["casos-de-exito"] = hubIndexWidgets(cx.es);
    const c1 = readContent("case-studies/restaurant-whatsapp");
    if (c1) out["casos-de-exito/restaurante-whatsapp-ia"] = caseStudyWidgets(c1.es);
    const sr = readContent("diagnostic/sample-report");
    if (sr) out["autodiagnostico/informe-de-ejemplo"] = caseStudyWidgets(sr.es, "/autodiagnostico");
  } else {
    for (const s of ["bpo", "hospitality", "education", "regulated"]) {
      const c = readContent(`industries/en-${s}`);
      if (c) out[`industries/${s}`] = industryWidgets(c);
    }
    const ix = readContent("industries/en-index");
    if (ix) out["industries"] = hubIndexWidgets(ix);
    const cx = readContent("case-studies/index");
    if (cx) out["case-studies"] = hubIndexWidgets(cx.en);
    const c1 = readContent("case-studies/restaurant-whatsapp");
    if (c1) out["case-studies/restaurant-whatsapp-ai"] = caseStudyWidgets(c1.en);
    const sr = readContent("diagnostic/sample-report");
    if (sr) out["self-diagnosis/sample-report"] = caseStudyWidgets(sr.en, "/self-diagnosis");
  }
  return out;
}

/** slug -> the widgets to write. */
const PAGES = {
  ...contentPages(),
  [locale === "es" ? "es" : ""]: homeWidgets(),
  [slugFor("self-diagnosis")]: diagnosticWidgets(),
  [slugFor("services")]: servicesIndexWidgets(),
  [slugFor("pricing")]: pricingWidgets(),
  ...Object.fromEntries(SERVICES.map(([ns, slug]) => [slugFor(slug), serviceWidgets(ns)])),
  [slugFor("products")]: solutionsIndexWidgets(),
  ...Object.fromEntries(SOLUTIONS.map(([key, slug]) => [slugFor(slug), solutionWidgets(key)])),
  [slugFor("about")]: aboutWidgets(),
  [slugFor(LEGAL_SLUGS.privacy)]: legalWidgets("privacy"),
  [slugFor(LEGAL_SLUGS.cookies)]: legalWidgets("cookies"),
  [slugFor(LEGAL_SLUGS.terms)]: legalWidgets("terms"),
  [slugFor("contact")]: {
    // The form belongs in this map, not in a script of its own. A PATCH of
    // `widgets` replaces the map rather than merging into it, so whichever
    // script wrote last erased the other's work: wiring the form blanked the
    // hero, and the next fill blanked the form.
    contact_form: {
      body: {
        title: "",
        form: {
          form_id: contactFormGuid,
          response_type: "inline",
          message: t.contact.form.success,
          redirect_id: null,
          redirect_url: null,
        },
      },
    },
    page_hero: {
      body: {
        eyebrow: t.contact.hero.eyebrow,
        title: t.contact.hero.title,
        intro: t.contact.hero.intro,
        button_text: "",
        seam: true,
      },
    },
    contact_details: {
      body: {
        whatsapp_label: t.contact.aside.whatsappLabel,
        whatsapp_url: "",
        email_label: t.contact.aside.emailLabel,
        email_address: VARS.email,
        location: t.contact.aside.location,
      },
    },
    meeting_card: {
      body: {
        title: t.contact.booking.title,
        intro: t.contact.booking.body,
        button_text: t.contact.booking.button,
        meetings_url: "https://meetings.hubspot.com/helgar-palmieri",
        fallback: t.contact.booking.fallback.replace("{email}", VARS.email),
      },
    },
  },
};

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

const plan = Object.entries(PAGES).filter(([slug]) => !only || slug === only);

if (dryRun) {
  for (const [slug, widgets] of plan) {
    console.log(`${slug}`);
    for (const [name, w] of Object.entries(widgets)) {
      const fields = Object.keys(w.body);
      console.log(`  ${name}: ${fields.length} fields — ${fields.slice(0, 6).join(", ")}${fields.length > 6 ? " …" : ""}`);
      if (w.body.sections) console.log(`    sections: ${w.body.sections.length}`);
    }
  }
  process.exit(0);
}

const listed = await api(`/cms/v3/pages/site-pages?${new URLSearchParams({ limit: "100" })}`);
const bySlug = new Map((listed.results || []).map((p) => [p.slug, p]));

for (const [slug, widgets] of plan) {
  const page = bySlug.get(slug);
  if (!page) {
    console.error(`skip   ${slug} — no such page`);
    process.exitCode = 1;
    continue;
  }
  try {
    await api(`/cms/v3/pages/site-pages/${page.id}`, {
      method: "PATCH",
      body: JSON.stringify({ widgets }),
    });
    // A draft update does not reach the live page until it is published again.
    await api(`/cms/v3/pages/site-pages/${page.id}`, {
      method: "PATCH",
      body: JSON.stringify({ publishDate: new Date().toISOString(), state: "PUBLISHED" }),
    });
    console.log(`filled ${slug} — ${Object.keys(widgets).join(", ")}`);
  } catch (e) {
    console.error(`FAILED ${slug} — ${e.message}`);
    process.exitCode = 1;
  }
}
