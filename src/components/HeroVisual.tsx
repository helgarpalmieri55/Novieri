"use client";

import { useEffect, useRef, useState } from "react";
import { asset, site } from "@/config/site";
import GemStage from "./GemStage";

/**
 * The hero visual: one subject, never two.
 *
 * The animated logo mark is the floor — no network, no codec, always there.
 * When a clip is configured and can actually play, it takes the mark's place
 * as a lens: masked to a circle with a feathered edge (no letterbox, no hard
 * rectangle), rimmed by the brand gradient, lit from behind by a jewel glow,
 * and framed by the same rotating mono ring. The mark crossfades out as the
 * lens fades in, so the composition never shows both.
 *
 * Phones never request the file. Reduced motion keeps the mark.
 * `?hero=1` / `?hero=2` swaps clips at runtime for comparison.
 */
export default function HeroVisual({ ringText }: { ringText: string }) {
  const [clip, setClip] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!site.heroVideo) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!matchMedia("(min-width: 1024px)").matches) return;

    const override = new URLSearchParams(location.search).get("hero");
    setClip(override === "1" || override === "2" ? `hero${override}.mp4` : site.heroVideo);
  }, []);

  useEffect(() => {
    const v = videoRef.current;
    if (v && v.readyState >= 3) setReady(true);
  }, [clip]);

  const fade = `transition-opacity duration-1000 ${ready ? "opacity-100" : "opacity-0"}`;

  return (
    <div className="relative">
      <GemStage ringText={ringText} showMark={!ready} />

      {clip && (
        <>
          {/* Jewel light behind the lens, so the dark circle sits on the white
              canvas instead of being punched into it */}
          <div aria-hidden className={`hero-lens-glow ${fade}`} />

          <video
            ref={videoRef}
            src={asset(`/hero/${clip}`)}
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            aria-hidden
            tabIndex={-1}
            onCanPlay={() => setReady(true)}
            onError={() => setReady(false)}
            style={{ ["--hero-lens-focus" as string]: site.heroVideoFocus }}
            className={`hero-lens ${fade}`}
          />

          {/* Gradient rim, counter-rotating against the mono ring */}
          <div aria-hidden className={`hero-lens-rim ${fade}`} />
        </>
      )}
    </div>
  );
}
