/**
 * Single configuration point for everything that changes at launch.
 * TODO before launch (brief §9): fill every value marked TODO, or the
 * related UI stays hidden / falls back gracefully.
 */
export const site = {
  url: "https://novieri.com",
  name: "Novieri",

  // TODO: confirm final contact email.
  contactEmail: process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "hola@novieri.com",

  // TODO: WhatsApp number in international format without "+", e.g. "573001234567".
  // The WhatsApp button/float stays hidden while this is empty.
  whatsappNumber: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "",

  // TODO: Cal.com link, e.g. "novieri/intro". The contact page shows an
  // email fallback while this is empty.
  calLink: process.env.NEXT_PUBLIC_CAL_LINK ?? "",

  // TODO: LinkedIn company URL. Footer icon stays hidden while empty.
  linkedinUrl: process.env.NEXT_PUBLIC_LINKEDIN_URL ?? "",

  // TODO: legal identity for the footer line "© 2026 RAZON_SOCIAL · NIT ...".
  // While empty the footer shows "© 2026 Novieri" only.
  razonSocial: "",
  nit: "",

  // Analytics: set to your Plausible domain to enable the script (single
  // config point, brief §3). Leave empty to ship without analytics.
  plausibleDomain: process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN ?? "",
} as const;

export function whatsappHref(message: string): string {
  return `https://wa.me/${site.whatsappNumber}?text=${encodeURIComponent(message)}`;
}
