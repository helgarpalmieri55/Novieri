"use client";

import { useTranslations } from "next-intl";
import { site } from "@/config/site";

/**
 * Google requires this attribution whenever the reCAPTCHA badge is hidden,
 * which it is here — the badge would sit on top of the chat launcher.
 * Renders nothing while reCAPTCHA is not configured.
 */
export default function RecaptchaNotice() {
  const t = useTranslations("common");
  if (!site.recaptchaSiteKey) return null;

  const link = (href: string) =>
    function Anchor(chunks: React.ReactNode) {
      return (
        <a href={href} target="_blank" rel="noopener noreferrer" className="underline hover:text-ink">
          {chunks}
        </a>
      );
    };

  return (
    <p className="mt-3 max-w-[62ch] text-caption text-ink-faint">
      {t.rich("recaptchaNotice", {
        privacy: link("https://policies.google.com/privacy"),
        terms: link("https://policies.google.com/terms"),
      })}
    </p>
  );
}
