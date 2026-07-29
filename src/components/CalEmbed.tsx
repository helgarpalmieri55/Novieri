"use client";

import { useEffect, useRef } from "react";
import { site } from "@/config/site";

declare global {
  interface Window {
    Cal?: ((...args: unknown[]) => void) & { loaded?: boolean; ns?: Record<string, unknown>; q?: unknown[] };
  }
}

/** Cal.com inline embed. Renders nothing when [CAL_LINK] isn't configured (the page shows a fallback). */
export default function CalEmbed() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!site.calLink || !ref.current) return;
    // Official Cal.com embed snippet, minimally adapted
    (function (C: Window, A: string, L: string) {
      const p = function (a: { q: unknown[] }, ar: unknown) {
        a.q.push(ar);
      };
      const d = C.document;
      C.Cal =
        C.Cal ||
        function (...args: unknown[]) {
          const cal = C.Cal!;
          if (!cal.loaded) {
            cal.ns = {};
            cal.q = cal.q || [];
            const s = d.createElement("script");
            s.src = A;
            d.head.appendChild(s);
            cal.loaded = true;
          }
          if (args[0] === L) {
            const api = function (...apiArgs: unknown[]) {
              p(api as unknown as { q: unknown[] }, apiArgs);
            } as unknown as { q: unknown[] };
            const namespace = args[1] as string;
            api.q = api.q || [];
            if (typeof namespace === "string") {
              (cal.ns as Record<string, unknown>)[namespace] = api;
              p(api, args);
            }
            p(cal as unknown as { q: unknown[] }, ["initNamespace", namespace]);
            return;
          }
          p(cal as unknown as { q: unknown[] }, args);
        };
    })(window, "https://app.cal.com/embed/embed.js", "init");

    window.Cal?.("init", { origin: "https://cal.com" });
    window.Cal?.("inline", {
      elementOrSelector: ref.current,
      calLink: site.calLink,
      layout: "month_view",
    });
  }, []);

  if (!site.calLink) return null;
  return <div ref={ref} className="min-h-[540px] w-full overflow-hidden rounded-xl" />;
}
