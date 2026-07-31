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
const OUT = join(ROOT, "hubspot/src/app/functions/lib/company-profile.json");

const es = JSON.parse(readFileSync(join(ROOT, "messages/es.json"), "utf8"));
const en = JSON.parse(readFileSync(join(ROOT, "messages/en.json"), "utf8"));

const services = (m, label) =>
  `${label}:\n` + Object.values(m.pillars).map((p) => `- ${p.name}: ${p.tagline}`).join("\n");

const solutions = (m, label) =>
  `${label}:\n` +
  Object.values(m.solutions.items)
    .map((s) => {
      const features = s.features.map((f) => f.title).join("; ");
      return `- ${s.name}: ${s.tagline}\n  ${s.hero.promise}\n  Capacidades/Features: ${features}`;
    })
    .join("\n");

const contactEmail = process.env.CONTACT_EMAIL ?? "sales@novieri.com";
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
  solutions(es, "## Soluciones propias / Products (ES)"),
  "",
  solutions(en, "## Solutions / Products (EN)"),
  "",
  "## Cómo trabajamos / How we work",
  how.join("\n"),
  "",
  "## Datos de contacto / Contact",
  `- Email: ${contactEmail}`,
  "- Ubicación: Barranquilla, Colombia (GMT-5, mismo huso horario que la costa este de EE. UU.)",
  "- Atiende Colombia localmente y Estados Unidos de forma remota (nearshore), en español e inglés.",
  "- La forma preferida de avanzar: agendar una llamada de 30 minutos desde la página de contacto (/es/contacto · /en/contact).",
  "",
  "## Hechos clave / Key facts",
  "- El CTO ha liderado IT y sistemas de IA para operaciones de más de 1.000 personas, incluyendo cumplimiento PCI DSS y un programa SOC 2 de punta a punta.",
  "- Stack que opera: Microsoft 365, FortiGate, AWS, Python, React, Odoo, HubSpot, Power BI.",
  "- No se publican precios; cada propuesta se conversa (paquetes con alcance definido).",
].join("\n");

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, JSON.stringify({ text }, null, 2) + "\n");
console.log(`build-company-profile: ${text.length} characters -> ${OUT.slice(ROOT.length + 1)}`);
