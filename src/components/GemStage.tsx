"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { asset } from "@/config/site";

const PARTICLE_COLORS = ["#264e59", "#4f3461", "#a8875c", "#b0aabd"];
const MARK = "/brand/novieri-isotipo-color.svg";

/**
 * "La gema viva": the real logo mark is the centerpiece — no redrawn
 * approximation. A light sweep travels across its facets (a gradient masked
 * by the mark itself), jewel-toned halos breathe behind it, mono ring text
 * rotates around it, and a particle field drifts inward. The mark follows the
 * mouse. Everything decorative stops under prefers-reduced-motion.
 */
export default function GemStage({
  ringText,
  showMark = true,
}: {
  ringText: string;
  /** The hero hands this to false once the video lens takes the centre. */
  showMark?: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gemRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const canvas = canvasRef.current;
    const gem = gemRef.current;
    if (!canvas || !gem) return;

    const cx = canvas.getContext("2d");
    if (!cx) return;

    let W = 0;
    let H = 0;
    let raf = 0;
    const dpr = Math.min(devicePixelRatio, 2);

    const size = () => {
      W = canvas.width = canvas.offsetWidth * dpr;
      H = canvas.height = canvas.offsetHeight * dpr;
    };
    size();
    const ro = new ResizeObserver(size);
    ro.observe(canvas);

    const parts = Array.from({ length: 70 }, (_, i) => ({
      x: Math.random(),
      y: Math.random(),
      r: Math.random() * 1.7 + 0.5,
      v: Math.random() * 0.0018 + 0.0005,
      c: PARTICLE_COLORS[i % PARTICLE_COLORS.length],
      tw: Math.random() * Math.PI * 2,
    }));

    const draw = (t: number) => {
      cx.clearRect(0, 0, W, H);
      for (const p of parts) {
        const dx = 0.5 - p.x;
        const dy = 0.5 - p.y;
        p.x += dx * p.v;
        p.y += dy * p.v;
        if (Math.abs(dx) < 0.02 && Math.abs(dy) < 0.02) {
          p.x = Math.random();
          p.y = Math.random() < 0.5 ? 0.02 : 0.98;
        }
        cx.globalAlpha = 0.12 + 0.3 * Math.abs(Math.sin(t / 900 + p.tw));
        cx.fillStyle = p.c;
        cx.beginPath();
        cx.arc(p.x * W, p.y * H, p.r * dpr, 0, 7);
        cx.fill();
      }
      cx.globalAlpha = 1;
      if (!reduced) raf = requestAnimationFrame(draw);
    };
    draw(0);

    const onMove = (e: MouseEvent) => {
      const rx = (e.clientX / innerWidth - 0.5) * 16;
      const ry = (e.clientY / innerHeight - 0.5) * 12;
      gem.style.transform = `translate(${rx}px, ${ry}px)`;
    };
    if (!reduced) addEventListener("mousemove", onMove, { passive: true });

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      removeEventListener("mousemove", onMove);
    };
  }, []);

  return (
    <>
      <canvas ref={canvasRef} aria-hidden className="absolute inset-0 h-full w-full" />

      <div ref={gemRef} className="relative mx-auto w-full transition-transform duration-300 ease-out">
        {/* Breathing halos, in the mark's own gradient stops */}
        <div
          aria-hidden
          className="gem-halo absolute left-1/2 top-1/2 h-[86%] w-[86%] -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgba(79,52,97,0.10) 0%, rgba(38,78,89,0.07) 45%, transparent 70%)",
          }}
        />
        <div
          aria-hidden
          className="gem-halo absolute left-1/2 top-1/2 h-[62%] w-[62%] -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            ["--hd" as string]: "1.6s",
            background: "radial-gradient(circle, rgba(168,135,92,0.13) 0%, transparent 68%)",
          }}
        />

        {/* Rotating mono ring */}
        <svg
          aria-hidden
          viewBox="0 0 300 300"
          className="ring-text absolute -inset-[11%] h-[122%] w-[122%]"
          style={{ transformOrigin: "50% 50%" }}
        >
          <defs>
            <path id="ring-circ" d="M150 150 m -128 0 a 128 128 0 1 1 256 0 a 128 128 0 1 1 -256 0" />
          </defs>
          <text style={{ font: "400 8.2px var(--font-mono)", letterSpacing: "0.32em", fill: "#8a8296" }}>
            <textPath href="#ring-circ">{ringText}</textPath>
          </text>
        </svg>

        {/* The mark itself, plus a light sweep masked to its facets */}
        <div
          className={`gem-float relative mx-auto aspect-square w-[82%] transition-opacity duration-700 ${
            showMark ? "opacity-100" : "opacity-0"
          }`}
        >
          <Image
            src={asset(MARK)}
            alt=""
            fill
            priority
            sizes="(max-width: 1024px) 70vw, 34vw"
            className="select-none"
          />
          <div
            aria-hidden
            className="gem-sweep absolute inset-0"
            style={{
              maskImage: `url(${asset(MARK)})`,
              WebkitMaskImage: `url(${asset(MARK)})`,
              maskSize: "contain",
              WebkitMaskSize: "contain",
              maskRepeat: "no-repeat",
              WebkitMaskRepeat: "no-repeat",
              maskPosition: "center",
              WebkitMaskPosition: "center",
            }}
          />
        </div>
      </div>
    </>
  );
}
