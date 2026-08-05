/**
 * Builds the company profile Sylvi answers from, and writes it next to the
 * serverless function so the deploy carries it.
 *
 * Today the source is messages/*.json — the same strings the Next.js site
 * renders, which is why Sylvi has never been able to contradict the site.
 * When the copy moves into editable HubSpot pages, only this file changes:
 * read the published page content instead, and everything downstream still
 * works. That is the whole reason the profile is generated rather than
 * hand-written.
 *
 * Run: node scripts/build-company-profile.mjs
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";

const ROOT = process.cwd();
const OUT = join(ROOT, "hubspot/functions-src/lib/company-profile.json");

const es = JSON.parse(readFileSync(join(ROOT, "messages/es.json"), "utf8"));
const en = JSON.parse(readFileSync(join(ROOT, "messages/en.json"), "utf8"));

const services = (m, label) =>
  `${label}:\n` + Object.values(m.pillars).map((p) => `- ${p.name}: ${p.tagline}`).join("\n");

/**
 * The six products with a page on the site, and the path to each. Sylvi was
 * naming these in conversation with nowhere to send anyone; now she can link.
 * The other three in messages/*.json — the IT suite, the monitoring service
 * and Matter Flow — are real and she may still discuss them, but they have no
 * page, so she is told not to invent a URL for them.
 */
const SOLUTION_PATHS = {
  aiAssistant: { es: "/soluciones/asistente-virtual-ia", en: "/solutions/ai-virtual-assistant" },
  whatsapp: { es: "/soluciones/asistente-ia-whatsapp", en: "/solutions/whatsapp-ai-assistant" },
  visitorIntel: { es: "/soluciones/inteligencia-de-visitantes", en: "/solutions/visitor-intelligence" },
  sentinel: { es: "/soluciones/gestion-de-vulnerabilidades", en: "/solutions/vulnerability-management" },
  ventia: { es: "/soluciones/ventia", en: "/solutions/ventia" },
  webDev: { es: "/soluciones/sitios-web-con-ia", en: "/solutions/ai-websites" },
};

const solutions = (m, label, lang) =>
  `${label}:\n` +
  Object.entries(m.solutions.items)
    .map(([key, s]) => {
      const features = s.features.map((f) => f.title).join("; ");
      const path = SOLUTION_PATHS[key]?.[lang];
      const where = path ? `\n  Página/Page: ${path}` : "\n  (sin página propia / no page of its own — describe it, do not link)";
      return `- ${s.name}: ${s.tagline}${where}\n  ${s.hero.promise}\n  Capacidades/Features: ${features}`;
    })
    .join("\n");

const contactEmail = process.env.CONTACT_EMAIL ?? "sales@novieri.com";
/** The founders' public HubSpot meetings link, same one the contact page embeds. */
const meetingsUrl = "https://meetings.hubspot.com/helgar-palmieri";
const how = Object.values(es.home.how.steps).map((s, i) => `${i + 1}. ${s.title}: ${s.body}`);

const text = [
  "## Quién es Novieri / Who Novieri is",
  es.meta.home.description,
  en.meta.home.description,
  es.about.hero.intro,
  es.about.story.body,
  en.about.location.body,
  "",
  "## Fundadores / Founders",
  `- ${es.about.founders.helgar.name} — ${es.about.founders.helgar.role}: ${es.about.founders.helgar.bio}`,
  `- ${es.about.founders.partner.name} — ${es.about.founders.partner.role}: ${es.about.founders.partner.bio}`,
  "",
  services(es, "## Servicios (ES)"),
  services(en, "## Services (EN)"),
  "",
  solutions(es, "## Soluciones propias / Products (ES)", "es"),
  "",
  solutions(en, "## Solutions / Products (EN)", "en"),
  "",
  "## Cómo trabajamos / How we work",
  how.join("\n"),
  "",
  "## Datos de contacto / Contact",
  `- Email: ${contactEmail}`,
  "- Ubicación: Barranquilla, Colombia (GMT-5, mismo huso horario que la costa este de EE. UU.)",
  "- Atiende Colombia localmente y Estados Unidos de forma remota (nearshore), en español e inglés.",
  // The routes are HubSpot's, not the old Next.js export's — Sylvi was sending
  // people to /en/contact, which does not exist here.
  "- Página de contacto / contact page: /contacto (ES) · /contact (EN).",
  "- Índice de productos / products index: /soluciones (ES) · /solutions (EN).",
  "- Cuando menciones un producto que tiene página, enlaza la ruta que aparece arriba. Si no tiene página, descríbelo y ofrece la llamada — nunca inventes una URL.",
  "- Agenda directa de 30 minutos con los fundadores / direct 30-minute booking:",
  `  ${meetingsUrl}`,
  "- Cuando alguien pida agendar una llamada, dale ese enlace directamente: es una agenda pública, se reserva sin intermediarios. No digas que la reserva la hace una persona.",
  "- When someone asks to schedule a call, give them that link. It is a public booking page — they choose a slot themselves, no one has to arrange it.",
  "",
  "## Hechos clave / Key facts",
  "- El CTO ha liderado IT y sistemas de IA para operaciones de más de 1.000 personas, incluyendo cumplimiento PCI DSS y un programa SOC 2 de punta a punta.",
  "- Stack que opera: Microsoft 365, FortiGate, AWS, Python, React, Odoo, HubSpot, Power BI.",
  "- No se publican precios; cada propuesta se conversa (paquetes con alcance definido).",
].join("\n");

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, JSON.stringify({ text }, null, 2) + "\n");
console.log(`build-company-profile: ${text.length} characters -> ${OUT.slice(ROOT.length + 1)}`);
