"use client";

import { useEffect, useRef } from "react";
import { site } from "@/config/site";

const LOADER = "https://static.hsappstatic.net/MeetingsEmbedCode/static-1/MeetingsEmbedCode.js";

/**
 * HubSpot Meetings inline embed — the site's primary conversion.
 *
 * Booking through HubSpot rather than a separate scheduler means the meeting
 * creates or matches the contact, lands on their timeline, and can move the
 * lifecycle stage, instead of holding booking data in a second system.
 *
 * Renders nothing while `meetingsLink` is unset; the contact page shows its
 * email fallback in that case. The provider's own cookies are disclosed in
 * the cookie policy under third-party functional cookies — the visitor is
 * actively choosing to book, so the embed is not gated behind the banner.
 */
export default function MeetingsEmbed() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!site.meetingsLink || !ref.current) return;
    if (document.querySelector(`script[src="${LOADER}"]`)) return;
    const s = document.createElement("script");
    s.src = LOADER;
    s.async = true;
    document.body.appendChild(s);
  }, []);

  if (!site.meetingsLink) return null;

  const src = site.meetingsLink.includes("?")
    ? `${site.meetingsLink}&embed=true`
    : `${site.meetingsLink}?embed=true`;

  return (
    <div
      ref={ref}
      className="meetings-iframe-container min-h-[620px] w-full"
      data-src={src}
    />
  );
}
