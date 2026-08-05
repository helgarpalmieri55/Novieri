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
  solutions: "soluciones",
  "solutions/ai-virtual-assistant": "soluciones/asistente-virtual-ia",
  "solutions/whatsapp-ai-assistant": "soluciones/asistente-ia-whatsapp",
  "solutions/visitor-intelligence": "soluciones/inteligencia-de-visitantes",
  "solutions/vulnerability-management": "soluciones/gestion-de-vulnerabilidades",
  "solutions/ventia": "soluciones/ventia",
  "solutions/ai-websites": "soluciones/sitios-web-con-ia",
  "legal/privacy-policy": "legal/politica-de-privacidad",
  "legal/cookie-policy": "legal/politica-de-cookies",
  "legal/terms-of-use": "legal/terminos-de-uso",
};
const slugFor = (en) => (locale === "es" ? ES_SLUGS[en] ?? en : en);

/** Matches src/config/site.ts. Both are empty until the company is registered. */
const VARS = { company: "Novieri", nit: "", email: "sales@novieri.com" };

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
const PHOTOS = { helgar: "helgar.jpg", sylvana: "sylvana.jpg" };

async function uploadPhoto(file) {
  const form = new FormData();
  const bytes = readFileSync(`hubspot/src/theme/novieri/images/${file}`);
  form.set("file", new Blob([bytes], { type: "image/jpeg" }), file);
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
  const fill = (s) => s.replace(/\{(\w+)\}/g, (m, key) => VARS[key] ?? m);
  return fill(
    text.replace(/\[\[(.+?)\]\]/g, (_, inner) => {
      const keys = [...inner.matchAll(/\{(\w+)\}/g)].map((m) => m[1]);
      return keys.every((k) => (VARS[k] ?? "") !== "") ? inner : "";
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
        questions_email: VARS.email,
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
  ["aiAssistant", "solutions/ai-virtual-assistant"],
  ["whatsapp", "solutions/whatsapp-ai-assistant"],
  ["visitorIntel", "solutions/visitor-intelligence"],
  ["sentinel", "solutions/vulnerability-management"],
  ["ventia", "solutions/ventia"],
  ["webDev", "solutions/ai-websites"],
];

/** Mirrors solution.hubl.html. */
const SOLUTION_SLOTS = {
  hero: "main-module-2",     // page-hero
  what: "main-module-3",     // dot-list
  built: "main-module-4",    // split-note
  powered: "main-module-5",  // founders-band
  cta: "main-module-6",      // cta-band
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
        title: c.ctaTitle,
        subtitle: c.ctaSubtitle,
        button_text: t.common.bookCall,
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
        eyebrow: "the story",
        word_a: "nov",
        word_b: "ieri",
        intro: a.story.body,
        cta_text: "",
      },
    },
    [ABOUT_SLOTS.people]: {
      body: {
        title: a.founders.title,
        linkedin_label: "LinkedIn profile",
        people: [
          {
            person_name: a.founders.helgar.name,
            person_role: a.founders.helgar.role,
            person_bio: a.founders.helgar.bio,
            person_initials: "HP",
            person_linkedin: "",
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
            person_linkedin: "",
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
        footnote: "barranquilla ·· gmt-5 ·· es / en",
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
const HOME_SLOTS = {
  hero: "main-module-2",
  stats: "main-module-3",
  pillars: "main-module-4",
  diagnose: "main-module-5",
  chat: "main-module-6",
  why: "main-module-7",
  quotes: "main-module-8",
  how: "main-module-9",
  founders: "main-module-10",
  cta: "main-module-11",
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
        stats: h.proof.items.map((s, i) => ({
          value: s.value,
          stat_label: s.label,
          colour: ACCENTS[i % 3],
        })),
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
        button_text: "",
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
        gate_privacy: d.gate.privacy,
        gate_privacy_link: { url: { type: "CONTENT", href: `/${slugFor(LEGAL_SLUGS.privacy)}` } },
        gate_submit: d.gate.submit,
        gate_sending: d.gate.sending,
        result_title: d.result.title,
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

/** slug -> the widgets to write. */
const PAGES = {
  [locale === "es" ? "es" : ""]: homeWidgets(),
  [slugFor("self-diagnosis")]: diagnosticWidgets(),
  [slugFor("services")]: servicesIndexWidgets(),
  ...Object.fromEntries(SERVICES.map(([ns, slug]) => [slugFor(slug), serviceWidgets(ns)])),
  [slugFor("solutions")]: solutionsIndexWidgets(),
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
