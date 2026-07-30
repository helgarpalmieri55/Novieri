"use client";

import Script from "next/script";
import { useEffect, useState } from "react";
import { readConsent } from "./CookieBanner";
import { site } from "@/config/site";

/**
 * Loads analytics only after the visitor accepts non-essential cookies, and
 * reacts to the banner's decision in the same page view. Renders nothing when
 * no analytics domain is configured.
 */
export default function Analytics() {
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    setAllowed(readConsent() === "all");
    const onConsent = (e: Event) => {
      setAllowed((e as CustomEvent<string>).detail === "all");
    };
    addEventListener("novieri:consent", onConsent);
    return () => removeEventListener("novieri:consent", onConsent);
  }, []);

  if (!site.plausibleDomain || !allowed) return null;

  return (
    <Script
      defer
      data-domain={site.plausibleDomain}
      src="https://plausible.io/js/script.js"
      strategy="afterInteractive"
    />
  );
}
