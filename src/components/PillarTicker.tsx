"use client";

import { useEffect, useState } from "react";

/** Animated eyebrow: cycles through the four pillars in their accent colors. */
export default function PillarTicker({ items }: { items: { name: string; cls: string }[] }) {
  const [i, setI] = useState(0);
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    setAnimate(true);
    const id = setInterval(() => setI((v) => (v + 1) % items.length), 2400);
    return () => clearInterval(id);
  }, [items.length]);

  return (
    <span className="eyebrow">
      <span key={animate ? i : "static"} className={`ticker-word lowercase ${items[i].cls}`}>
        {items[i].name}
      </span>
    </span>
  );
}
