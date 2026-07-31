import { getPathname } from "@/i18n/navigation";
import type { AppPathname } from "@/i18n/routing";
import { site } from "@/config/site";

/**
 * Absolute URL for a page, with the trailing slash the export actually
 * serves (`trailingSlash: true`). getPathname returns it without, and a
 * canonical or sitemap URL that redirects is a canonical no one trusts.
 */
export function pageUrl(locale: "es" | "en", href: AppPathname): string {
  const path = getPathname({ locale, href });
  return site.url + (path.endsWith("/") ? path : path + "/");
}
