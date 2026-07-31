"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

const KEY = "novieri-consent";

export type Consent = "all" | "necessary";

/** Reads the stored choice. Returns null when the visitor hasn't decided. */
export function readConsent(): Consent | null {
  try {
    const v = localStorage.getItem(KEY);
    return v === "all" || v === "necessary" ? v : null;
  } catch {
    return null;
  }
}

/**
 * Cookie notice required for non-essential cookies under Ley 1581 de 2012 /
 * Decreto 1074 de 2015: consent must be prior, express, and informed, so
 * analytics stays off until the visitor accepts. The choice is kept in
 * localStorage (not a cookie) and broadcast so the analytics loader can react
 * without a page reload.
 */
export default function CookieBanner() {
  const t = useTranslations("cookies");

  useEffect(() => {
    // The footer link reopens the banner so a choice can be changed without
    // clearing site data, which is the only way it used to be possible.
    const reopen = () => document.documentElement.classList.add("needs-consent");
    addEventListener("novieri:cookie-settings", reopen);
    return () => removeEventListener("novieri:cookie-settings", reopen);
  }, []);

  function decide(choice: Consent) {
    try {
      localStorage.setItem(KEY, choice);
    } catch {
      // Private-browsing modes can reject writes; the banner still dismisses.
    }
    dispatchEvent(new CustomEvent("novieri:consent", { detail: choice }));
    document.documentElement.classList.remove("needs-consent");
  }

  // Always rendered; `html.needs-consent` (set before paint by the inline
  // script in the layout) decides whether it is displayed. Mounting it after
  // hydration made this panel the LCP element on mobile.
  return (
    <div
      role="dialog"
      aria-label={t("label")}
      className="cookie-banner fixed inset-x-3 bottom-3 z-50 mx-auto max-w-[46rem] rounded-2xl border border-line bg-white p-5 shadow-[0_8px_40px_rgba(22,18,29,0.16)] sm:inset-x-5 sm:bottom-5 sm:p-6"
    >
      <div aria-hidden className="seam mb-4 -mt-1 rounded-full" />
      <p className="font-display text-body font-semibold">{t("title")}</p>
      <p className="mt-2 max-w-[62ch] text-small leading-relaxed text-ink-muted">{t("body")}</p>
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button type="button" onClick={() => decide("all")} className="btn btn-primary px-5 py-2.5 text-small">
          {t("accept")}
        </button>
        <button
          type="button"
          onClick={() => decide("necessary")}
          className="btn btn-ghost-light px-5 py-2.5 text-small"
        >
          {t("reject")}
        </button>
        <Link href="/legal/cookies" className="link-accent ml-auto text-small">
          {t("more")}
        </Link>
      </div>
    </div>
  );
}
