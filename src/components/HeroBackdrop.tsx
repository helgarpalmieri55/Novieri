"use client";

import { useEffect, useRef, useState } from "react";
import { asset, site } from "@/config/site";

/**
 * Full-bleed hero backdrop.
 *
 * The clip covers the whole hero section and is read *through* a white veil:
 * opaque on the left so the headline keeps its contrast on white, thinning
 * toward the right where the layout has room, and fading out at the bottom
 * into the proof strip. The dark footage becomes atmosphere behind the type
 * instead of a block competing with it.
 *
 * When it plays it takes over the hero: `html.hero-video-on` removes the
 * animated logo mark, so the two never stack. Phones never request the file,
 * reduced motion skips it, and any decode error hands the hero back to the
 * mark with nothing else to clean up.
 */
export default function HeroBackdrop() {
  const [clip, setClip] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!site.heroVideo) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!matchMedia("(min-width: 1024px)").matches) return;

    const n = new URLSearchParams(location.search).get("hero");
    setClip(n && /^[1-9]$/.test(n) ? `hero${n}.mp4` : site.heroVideo);
  }, []);

  useEffect(() => {
    const v = videoRef.current;
    if (v && v.readyState >= 3) setReady(true);
  }, [clip]);

  useEffect(() => {
    document.documentElement.classList.toggle("hero-video-on", ready);
    return () => document.documentElement.classList.remove("hero-video-on");
  }, [ready]);

  if (!clip) return null;

  return (
    <div
      aria-hidden
      className={`absolute inset-0 overflow-hidden transition-opacity duration-1000 ${
        ready ? "opacity-100" : "opacity-0"
      }`}
    >
      <video
        ref={videoRef}
        src={asset(`/hero/${clip}`)}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        tabIndex={-1}
        onCanPlay={() => setReady(true)}
        onError={() => setReady(false)}
        style={{ objectPosition: site.heroVideoFocus }}
        className="hero-bg"
      />
      <div className="hero-veil" />
    </div>
  );
}
