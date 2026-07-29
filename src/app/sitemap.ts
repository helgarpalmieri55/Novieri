import type { MetadataRoute } from "next";
import { routing, type AppPathname } from "@/i18n/routing";
import { getPathname } from "@/i18n/navigation";
import { site } from "@/config/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const pathnames = Object.keys(routing.pathnames) as AppPathname[];

  return pathnames.map((href) => {
    const languages: Record<string, string> = {};
    for (const locale of routing.locales) {
      languages[locale] = site.url + getPathname({ locale, href });
    }
    return {
      url: site.url + getPathname({ locale: routing.defaultLocale, href }),
      lastModified: new Date(),
      changeFrequency: href === "/" ? "weekly" : "monthly",
      priority: href === "/" ? 1 : href.startsWith("/services") ? 0.8 : 0.6,
      alternates: { languages },
    };
  });
}
