import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import type { AppPathname } from "@/i18n/routing";
import { routing } from "@/i18n/routing";
import { site } from "@/config/site";
import { pageUrl } from "@/lib/urls";

type MetaKey =
  | "home"
  | "services"
  | "ai"
  | "managedIt"
  | "security"
  | "software"
  | "solutions"
  | "sol_aiAssistant"
  | "sol_whatsapp"
  | "sol_itSuite"
  | "sol_visitorIntel"
  | "sol_ventia"
  | "sol_matterFlow"
  | "sol_monitoring"
  | "sol_sentinel"
  | "sol_webDev"
  | "about"
  | "contact"
  | "legalPrivacy"
  | "legalCookies"
  | "legalTerms"
  | "diagnostic";

export async function pageMetadata(
  locale: string,
  key: MetaKey,
  pathname: AppPathname,
): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: "meta" });

  const languages: Record<string, string> = {};
  for (const l of routing.locales) {
    languages[l] = pageUrl(l, pathname);
  }
  languages["x-default"] = pageUrl("en", pathname);

  // Solutions pages stay in the build but out of search while unpublished.
  const hidden = !site.showSolutions && pathname.startsWith("/solutions");

  return {
    ...(hidden ? { robots: { index: false, follow: false } } : {}),
    title: t(`${key}.title`),
    description: t(`${key}.description`),
    alternates: {
      canonical: pageUrl(locale as "es" | "en", pathname),
      languages,
    },
    openGraph: {
      title: t(`${key}.title`),
      description: t(`${key}.description`),
      url: pageUrl(locale as "es" | "en", pathname),
      siteName: "Novieri",
      locale: locale === "es" ? "es_CO" : "en_US",
      type: "website",
      images: [{ url: `${site.url}/brand/og-image-1200x630-claro.png`, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
    },
  };
}

export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Novieri",
  url: site.url,
  logo: `${site.url}/brand/novieri-isotipo-color-512px.png`,
  email: site.contactEmail,
  address: {
    "@type": "PostalAddress",
    addressLocality: "Barranquilla",
    addressCountry: "CO",
  },
  sameAs: site.linkedinUrl ? [site.linkedinUrl] : [],
};
