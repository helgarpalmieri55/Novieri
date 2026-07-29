"use client";

import { useEffect, useRef } from "react";

const PARTICLE_COLORS = ["#264e59", "#4f3461", "#a8875c", "#b0aabd"];

/**
 * "La gema viva", light edition: the logo's facet language in its true
 * jewel colors on white — facets draw themselves in, then breathe; the
 * gradient core pulses; mono ring text rotates; a subtle particle field
 * drifts toward it; the whole gem follows the mouse.
 */
export default function GemStage({ ringText }: { ringText: string }) {
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
        const dx = 0.62 - p.x;
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
      const rx = (e.clientX / innerWidth - 0.5) * 14;
      const ry = (e.clientY / innerHeight - 0.5) * 10;
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
        <svg
          aria-hidden
          viewBox="0 0 300 300"
          className="ring-text absolute -inset-[13%] h-[126%] w-[126%]"
          style={{ transformOrigin: "50% 50%" }}
        >
          <defs>
            <path id="ring-circ" d="M150 150 m -128 0 a 128 128 0 1 1 256 0 a 128 128 0 1 1 -256 0" />
          </defs>
          <text
            style={{
              font: "400 8.2px var(--font-mono)",
              letterSpacing: "0.32em",
              fill: "#8a8296",
            }}
          >
            <textPath href="#ring-circ">{ringText}</textPath>
          </text>
        </svg>
        <svg viewBox="0 0 420 420" fill="none" aria-hidden className="w-full">
          <defs>
            <linearGradient id="gem-g" x1="70" y1="70" x2="350" y2="350" gradientUnits="userSpaceOnUse">
              <stop offset="0" stopColor="#264e59" />
              <stop offset="0.5" stopColor="#4f3461" />
              <stop offset="1" stopColor="#a8875c" />
            </linearGradient>
          </defs>
          <g strokeWidth="1.5">
            <g className="gem-facet" style={{ ["--fd" as string]: "0s" }}>
              <rect
                className="gem-draw"
                style={{ ["--dd" as string]: "0.15s" }}
                x="70"
                y="70"
                width="170"
                height="170"
                rx="36"
                stroke="#264e59"
                transform="rotate(8 155 155)"
              />
            </g>
            <g className="gem-facet" style={{ ["--fd" as string]: "2.2s" }}>
              <rect
                className="gem-draw"
                style={{ ["--dd" as string]: "0.35s" }}
                x="180"
                y="70"
                width="170"
                height="170"
                rx="36"
                stroke="#4f3461"
                transform="rotate(-8 265 155)"
              />
            </g>
            <g className="gem-facet" style={{ ["--fd" as string]: "4.4s" }}>
              <rect
                className="gem-draw"
                style={{ ["--dd" as string]: "0.55s" }}
                x="70"
                y="180"
                width="170"
                height="170"
                rx="36"
                stroke="#4f3461"
                transform="rotate(-8 155 265)"
              />
            </g>
            <g className="gem-facet" style={{ ["--fd" as string]: "6.6s" }}>
              <rect
                className="gem-draw"
                style={{ ["--dd" as string]: "0.75s" }}
                x="180"
                y="180"
                width="170"
                height="170"
                rx="36"
                stroke="url(#gem-g)"
                strokeWidth="2"
                transform="rotate(8 265 265)"
              />
            </g>
            <path
              className="gem-draw"
              style={{ ["--dd" as string]: "1s" }}
              d="M60 350 L350 68"
              stroke="#a8875c"
              strokeOpacity="0.6"
            />
          </g>
          <g className="gem-core">
            <path
              d="M210 148 C218.5 188.5 229 199 270 210 C229 221 218.5 231.5 210 272 C201.5 231.5 191 221 150 210 C191 199 201.5 188.5 210 148 Z"
              fill="url(#gem-g)"
            />
          </g>
        </svg>
      </div>
    </>
  );
}
