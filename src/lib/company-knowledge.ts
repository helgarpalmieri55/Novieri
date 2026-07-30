import es from "../../messages/es.json";
import en from "../../messages/en.json";
import { site } from "@/config/site";

type Catalog = typeof es;

function servicesBlock(m: Catalog, label: string): string {
  const pillars = Object.entries(m.pillars)
    .map(([, p]) => `- ${p.name}: ${p.tagline}`)
    .join("\n");
  return `${label}:\n${pillars}`;
}

function solutionsBlock(m: Catalog, label: string): string {
  const items = Object.entries(m.solutions.items)
    .map(([, s]) => {
      const features = s.features.map((f) => f.title).join("; ");
      return `- ${s.name}: ${s.tagline}\n  ${s.hero.promise}\n  Capacidades/Features: ${features}`;
    })
    .join("\n");
  return `${label}:\n${items}`;
}

/**
 * Deterministic company profile assembled from the site's own message
 * catalogs — the same source of truth the pages render. Static string at
 * module scope so the prompt prefix is byte-stable and cacheable.
 */
export const COMPANY_KNOWLEDGE = [
  "## Quién es Novieri / Who Novieri is",
  es.meta.home.description,
  en.meta.home.description,
  es.about.hero.intro,
  es.about.story.body,
  en.about.location.body,
  "",
  "## Fundadores / Founders",
  `- ${es.about.founders.helgar.name} — ${es.about.founders.helgar.role}: ${es.about.founders.helgar.bio}`,
  `- Cofundadora — ${es.about.founders.partner.role} (perfil comercial y de operaciones).`,
  "",
  servicesBlock(es, "## Servicios (ES)"),
  servicesBlock(en, "## Services (EN)"),
  "",
  solutionsBlock(es, "## Soluciones propias / Products (ES)"),
  "",
  solutionsBlock(en, "## Solutions / Products (EN)"),
  "",
  "## Cómo trabajamos / How we work",
  es.home.how.steps.map((s, i) => `${i + 1}. ${s.title}: ${s.body}`).join("\n"),
  "",
  "## Datos de contacto / Contact",
  `- Email: ${site.contactEmail}`,
  `- Ubicación: Barranquilla, Colombia (GMT-5, mismo huso horario que la costa este de EE. UU.)`,
  `- Atiende Colombia localmente y Estados Unidos de forma remota (nearshore), en español e inglés.`,
  `- La forma preferida de avanzar: agendar una llamada de 30 minutos desde la página de contacto (/es/contacto · /en/contact).`,
  "",
  "## Hechos clave / Key facts",
  "- El CTO ha liderado IT y sistemas de IA para una operación de más de 300 agentes, incluyendo un programa SOC 2 de punta a punta.",
  "- Stack que opera: Microsoft 365, FortiGate, AWS, Python, React, Odoo, HubSpot, Power BI.",
  "- No se publican precios; cada propuesta se conversa (paquetes con alcance definido).",
].join("\n");
