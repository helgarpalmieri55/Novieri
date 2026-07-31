"use client";

import { useEffect, useRef, useState } from "react";
import { asset, site } from "@/config/site";
import GemStage from "./GemStage";

/**
 * The hero visual. The animated logo mark is the base layer and always
 * renders — it needs no network and no codec. On a large screen, with motion
 * allowed, the video loads on top and fades in only once it can actually
 * play; if it stalls, errors, or the codec is missing, the mark simply stays.
 *
 * Phones never download it (the files are several MB), and `?hero=1` / `?hero=2`
 * switches clips at runtime so both can be compared on the deployed site.
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
    setClip(override === "1" || override === "2" ? `hero${override}` : site.heroVideo);
  }, []);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    // The element mounts with the source already set; if it is cached the
    // canplay event may have fired before this ran.
    if (v.readyState >= 3) setReady(true);
  }, [clip]);

  return (
    <div className="relative">
      <GemStage ringText={ringText} />

      {clip && (
        <video
          ref={videoRef}
          src={asset(`/hero/${clip}.mp4`)}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          aria-hidden
          tabIndex={-1}
          onCanPlay={() => setReady(true)}
          onError={() => setReady(false)}
          className={`pointer-events-none absolute inset-0 h-full w-full object-contain transition-opacity duration-700 ${
            ready ? "opacity-100" : "opacity-0"
          }`}
        />
      )}
    </div>
  );
}
