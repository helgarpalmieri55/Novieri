/**
 * Single configuration point for everything that changes at launch.
 * TODO before launch (brief §9): fill every value marked TODO, or the
 * related UI stays hidden / falls back gracefully.
 */
export const site = {
  url: "https://novieri.com",
  name: "Novieri",

  contactEmail: process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "sales@novieri.com",

  // TODO: WhatsApp number in international format without "+", e.g. "573001234567".
  // The WhatsApp button/float stays hidden while this is empty.
  whatsappNumber: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "",

  // TODO: Cal.com link, e.g. "novieri/intro". The contact page shows an
  // email fallback while this is empty.
  calLink: process.env.NEXT_PUBLIC_CAL_LINK ?? "",

  // TODO: LinkedIn company URL. Footer icon stays hidden while empty.
  linkedinUrl: process.env.NEXT_PUBLIC_LINKEDIN_URL ?? "",

  // Founder profiles (each card's LinkedIn icon is hidden while empty).
  founders: {
    helgar: "https://www.linkedin.com/in/helgar-palmieri-82726b16a/",
    partner: "https://www.linkedin.com/in/sylvananova-272303/",
  },

  // Solutions section is hidden site-wide while this is false: no nav or
  // footer links, no sitemap entries, and the pages themselves are noindex.
  // The pages stay in the build — flip this to true to publish them.
  showSolutions: false,

  // TODO: legal identity for the footer line "© 2026 RAZON_SOCIAL · NIT ...".
  // While empty the footer shows "© 2026 Novieri" only.
  razonSocial: "",
  nit: "",

  // Analytics: set to your Plausible domain to enable the script (single
  // config point, brief §3). Leave empty to ship without analytics.
  plausibleDomain: process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN ?? "",

  // HubSpot tracking (build-time, because the site is a static export). It
  // sets the hubspotutk cookie that attributes form submissions to the
  // pages a visitor read, so it only loads after they accept cookies.
  // The backend has its own copy of the portal id in api/config.php.
  hubspotPortalId: process.env.NEXT_PUBLIC_HUBSPOT_PORTAL_ID ?? "",

  // Base URL of the PHP backend (contact form + chatbot). Defaults to the
  // same-origin /api that the GoDaddy deploy uploads. Point it at an absolute
  // URL (e.g. https://novieri.com/api) to make a preview deploy that has no
  // PHP — GitHub Pages — talk to the production backend.
  apiBase: process.env.NEXT_PUBLIC_API_BASE ?? "/api",
} as const;

/**
 * Prefixes a path in public/ with the deployment's base path.
 * next/image skips this when `images.unoptimized` is set, so any <Image>
 * pointing at public/ must go through here or it 404s under a base path
 * (e.g. GitHub Pages, where the site lives at /<repo-name>/).
 */
export function asset(path: string): string {
  return (process.env.NEXT_PUBLIC_BASE_PATH ?? "") + path;
}

export function whatsappHref(message: string): string {
  return `https://wa.me/${site.whatsappNumber}?text=${encodeURIComponent(message)}`;
}
