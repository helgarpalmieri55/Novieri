import { site } from "@/config/site";

/**
 * reCAPTCHA v3 — invisible, score-based. The script is loaded on the first
 * interaction with a form rather than on every page view: it gives Google a
 * behavioural window to score, without putting a third-party script on pages
 * that have no form at all.
 *
 * Everything here degrades to "no token" when no site key is configured, and
 * the backend skips verification when it has no secret — so the forms keep
 * working before and during setup.
 */
declare global {
  interface Window {
    grecaptcha?: {
      ready: (cb: () => void) => void;
      execute: (siteKey: string, opts: { action: string }) => Promise<string>;
    };
  }
}

let loader: Promise<void> | null = null;

export function loadRecaptcha(): Promise<void> {
  if (!site.recaptchaSiteKey) return Promise.resolve();
  if (loader) return loader;
  loader = new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `https://www.google.com/recaptcha/api.js?render=${site.recaptchaSiteKey}`;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("recaptcha"));
    document.head.appendChild(script);
  });
  return loader;
}

/** Returns a token, or undefined when reCAPTCHA is off or unreachable. */
export async function recaptchaToken(action: string): Promise<string | undefined> {
  if (!site.recaptchaSiteKey) return undefined;
  try {
    await loadRecaptcha();
    const grecaptcha = window.grecaptcha;
    if (!grecaptcha) return undefined;
    await new Promise<void>((r) => grecaptcha.ready(() => r()));
    return await grecaptcha.execute(site.recaptchaSiteKey, { action });
  } catch {
    // Never block a real submission on a third party being down. The backend
    // decides what to do with a missing token.
    return undefined;
  }
}
