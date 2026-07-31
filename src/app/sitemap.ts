import type { MetadataRoute } from "next";
import { routing, type AppPathname } from "@/i18n/routing";
import { site } from "@/config/site";
import { pageUrl } from "@/lib/urls";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const pathnames = (Object.keys(routing.pathnames) as AppPathname[]).filter(
    (href) => site.showSolutions || !href.startsWith("/solutions"),
  );

  // Every language version gets its own entry, each carrying the full set of
  // alternates. Listing only the Spanish URL leaves the English half of the
  // site to be found by crawl alone.
  return pathnames.flatMap((href) => {
    const languages: Record<string, string> = {};
    for (const locale of routing.locales) {
      languages[locale] = pageUrl(locale, href);
    }
    return routing.locales.map((locale) => ({
      url: pageUrl(locale, href),
      lastModified: new Date(),
      changeFrequency: (href === "/" ? "weekly" : "monthly") as "weekly" | "monthly",
      priority: href === "/" ? 1 : href.startsWith("/services") ? 0.8 : 0.6,
      alternates: { languages },
    }));
  });
}
