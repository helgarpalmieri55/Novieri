"use client";

import { useTranslations } from "next-intl";

/**
 * Reopens the cookie banner. Consent has to be as easy to withdraw as it was
 * to give; without this the only way to change it was clearing site data.
 */
export default function CookieSettingsLink() {
  const t = useTranslations("cookies");

  return (
    <button
      type="button"
      onClick={() => dispatchEvent(new CustomEvent("novieri:cookie-settings"))}
      className="text-left text-ink-muted transition-colors hover:text-ink"
    >
      {t("settings")}
    </button>
  );
}
