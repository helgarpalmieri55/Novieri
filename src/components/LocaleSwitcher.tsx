"use client";

import { useLocale } from "next-intl";
import { usePathname } from "@/i18n/navigation";
import pathnames from "@/i18n/pathnames.json";
import { asset } from "@/config/site";

type Locale = "es" | "en";
const map = pathnames as Record<string, Record<Locale, string>>;

// Keyed by the template path *and* by each localized path, because
// usePathname gives the template one while prerendering and the localized one
// in the browser — and with `trailingSlash: true` either may end in a slash.
const index = new Map<string, Record<Locale, string>>();
for (const [key, entry] of Object.entries(map)) {
  index.set(key, entry);
  index.set(entry.es, entry);
  index.set(entry.en, entry);
}

/**
 * The target is built from the pathname map directly rather than through
 * next-intl's <Link locale=…>: in the static export that only swapped the
 * locale prefix and left the *template* path behind, so /es/autodiagnostico
 * linked to /en/diagnostic — a 404. Pages whose English slug happens to equal
 * the template key (all of /services) hid the bug.
 */
function localized(href: string, locale: Locale): string {
  const key = href.length > 1 ? href.replace(/\/+$/, "") : "/";
  const path = index.get(key)?.[locale] ?? "/";
  return asset(`/${locale}${path === "/" ? "" : path}/`);
}

export default function LocaleSwitcher({ label }: { label: string }) {
  const locale = useLocale();
  const pathname = usePathname();

  return (
    <nav aria-label={label} className="idx-mono flex items-center text-[0.8125rem] tracking-[0.06em]">
      {(["es", "en"] as const).map((l, i) => (
        <span key={l} className="flex items-center">
          {i > 0 && <span aria-hidden className="text-ink-faint">|</span>}
          {l === locale ? (
            <span aria-current="true" className="px-2 py-2.5 uppercase text-ink">
              {l}
            </span>
          ) : (
            <a
              href={localized(pathname, l)}
              hrefLang={l}
              className="px-2 py-2.5 uppercase text-ink-faint transition-colors hover:text-ink"
            >
              {l}
            </a>
          )}
        </span>
      ))}
    </nav>
  );
}
