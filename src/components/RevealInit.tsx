"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Scroll-reveal engine: elements with .reveal / .tick-grow get .in when they
 * enter the viewport. Content is never hidden without JS (html.js gates the
 * initial hidden state in CSS), and prefers-reduced-motion disables it all.
 */
export default function RevealInit() {
  const pathname = usePathname();

  useEffect(() => {
    document.documentElement.classList.add("js");

    const els = document.querySelectorAll(".reveal:not(.in), .tick-grow:not(.in)");
    if (els.length === 0) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      els.forEach((el) => el.classList.add("in"));
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.1 },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [pathname]);

  return null;
}
