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

/** Matches src/config/site.ts. Both are empty until the company is registered. */
const VARS = { company: "Novieri", nit: "", email: "sales@novieri.com" };

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
const OTHER = {
  privacy: [["cookies", "Cookie policy"], ["terms", "Terms of use"]],
  cookies: [["privacy", "Privacy policy"], ["terms", "Terms of use"]],
  terms: [["privacy", "Privacy policy"], ["cookies", "Cookie policy"]],
};

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
        other_docs: OTHER[doc].map(([key, label]) => ({
          doc_label: label,
          doc_link: { url: { type: "CONTENT", href: `/${LEGAL_SLUGS[key]}` } },
        })),
        questions_title: c.questionsTitle,
        questions_body: interpolate(c.questionsBody),
        questions_email: VARS.email,
      },
    },
  };
}

/** slug -> the widgets to write. Only fixed-layout templates belong here. */
const PAGES = {
  [LEGAL_SLUGS.privacy]: legalWidgets("privacy"),
  [LEGAL_SLUGS.cookies]: legalWidgets("cookies"),
  [LEGAL_SLUGS.terms]: legalWidgets("terms"),
  contact: {
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

if (!TOKEN) {
  console.error("HUBSPOT_PRIVATE_APP_TOKEN is not set.");
  process.exit(1);
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
