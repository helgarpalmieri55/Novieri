"use client";

import { useEffect, useRef, useState } from "react";

export type ConsoleLine = {
  t?: string;
  kind: "cmd" | "step" | "ok" | "done";
  text: string;
  hl?: string;
};

const PREFIX: Record<ConsoleLine["kind"], { glyph: string; cls: string }> = {
  cmd: { glyph: "", cls: "text-[#e6edf3]" },
  step: { glyph: "→ ", cls: "text-[#79c0ff]" },
  ok: { glyph: "✓ ", cls: "text-[#7ee787]" },
  done: { glyph: "", cls: "text-[#7ee787]" },
};

function Line({ line }: { line: ConsoleLine }) {
  const p = PREFIX[line.kind];
  return (
    <span className="block whitespace-pre-wrap">
      {line.t && <span className="text-on-dark-faint">{line.t}</span>}
      {p.glyph && <span className={p.cls}>{p.glyph}</span>}
      <span className={line.kind === "done" ? "text-[#7ee787]" : "text-[#c9d1d9]"}>{line.text}</span>
      {line.hl && <span className="text-gold-bright">{line.hl}</span>}
    </span>
  );
}

/**
 * "La consola": a live agent terminal — lines type in on a loop.
 * Reduced motion / no JS renders the full log statically.
 */
export default function AgentConsole({
  barTitle,
  badge,
  lines,
  foot,
}: {
  barTitle: string;
  badge: string;
  lines: ConsoleLine[];
  foot: { state: string; stateValue: string; uptime: string; saved: string };
}) {
  const [count, setCount] = useState(lines.length);
  const [animate, setAnimate] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    setAnimate(true);
    setCount(0);
    let i = 0;
    const step = () => {
      i += 1;
      setCount(i);
      if (i < lines.length) {
        timer.current = setTimeout(step, i === 1 ? 900 : 620);
      } else {
        timer.current = setTimeout(() => {
          i = 0;
          setCount(0);
          timer.current = setTimeout(step, 700);
        }, 6000);
      }
    };
    timer.current = setTimeout(step, 600);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [lines.length]);

  const visible = animate ? lines.slice(0, count) : lines;

  return (
    <div className="relative">
      <div
        aria-hidden
        className="absolute -inset-px rounded-[17px] bg-gradient-to-br from-teal-bright via-plum-bright to-gold-bright"
      />
      <div className="relative overflow-hidden rounded-2xl bg-[#0d1117] font-mono text-[13.5px] leading-[1.9] text-[#c9d1d9]">
        <div className="flex items-center gap-2 border-b border-[#21262d] px-4 py-3">
          <span aria-hidden className="h-[11px] w-[11px] rounded-full bg-[#21262d]" />
          <span aria-hidden className="h-[11px] w-[11px] rounded-full bg-[#21262d]" />
          <span aria-hidden className="h-[11px] w-[11px] rounded-full bg-[#21262d]" />
          <span className="ml-2 text-[12px] tracking-[0.05em] text-on-dark-faint">{barTitle}</span>
          <span className="ml-auto rounded-full border border-[#3a3145] px-2.5 py-0.5 text-[10.5px] tracking-[0.08em] text-gold-bright">
            {badge}
          </span>
        </div>
        <div className="min-h-[320px] px-5 py-5" aria-live="off">
          {visible.map((l, i) => (
            <Line key={i} line={l} />
          ))}
          {animate && count >= lines.length && (
            <span className="block">
              <span className="text-on-dark-faint">09:43:23  </span>
              <span className="cursor-blink inline-block h-[15px] w-2 translate-y-[2px] bg-[#c9d1d9]" />
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-x-5 gap-y-1 border-t border-[#21262d] px-5 py-3 text-[11.5px] tracking-[0.05em] text-on-dark-faint">
          <span>
            {foot.state} <span className="text-[#7ee787]">{foot.stateValue}</span>
          </span>
          <span>{foot.uptime}</span>
          <span>{foot.saved}</span>
        </div>
      </div>
    </div>
  );
}
