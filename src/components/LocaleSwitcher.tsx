"use client";

import { useLocale } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";

export default function LocaleSwitcher({ label }: { label: string }) {
  const locale = useLocale();
  const pathname = usePathname();

  return (
    <nav aria-label={label} className="idx-mono flex items-center text-[0.8125rem] tracking-[0.06em]">
      {(["es", "en"] as const).map((l, i) => (
        <span key={l} className="flex items-center">
          {i > 0 && <span aria-hidden className="text-on-dark-faint">|</span>}
          {l === locale ? (
            <span aria-current="true" className="px-2 py-2.5 uppercase text-on-dark">
              {l}
            </span>
          ) : (
            <Link
              href={pathname}
              locale={l}
              className="px-2 py-2.5 uppercase text-on-dark-faint transition-colors hover:text-on-dark"
            >
              {l}
            </Link>
          )}
        </span>
      ))}
    </nav>
  );
}
