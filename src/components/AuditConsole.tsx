"use client";

import { useEffect, useState } from "react";

export type AuditCopy = {
  barTitle: string;
  badge: string;
  readiness: string;
  evidence: string;
  controls: string[];
  status: { ok: string; progress: string; todo: string };
  feed: string[];
};

type State = "ok" | "progress" | "todo";

/**
 * A readiness review filling in: controls move from planned to remediating
 * to passing, the readiness bar climbs, and evidence accumulates — the same
 * arc a real SOC 2 / PCI DSS preparation follows, compressed. Frame data
 * lives here; every string comes from the message catalog.
 */
const FRAMES: { controls: State[]; readiness: number; evidence: number }[] = [
  { controls: ["ok", "ok", "progress", "todo", "todo", "todo"], readiness: 52, evidence: 11 },
  { controls: ["ok", "ok", "ok", "progress", "todo", "todo"], readiness: 64, evidence: 15 },
  { controls: ["ok", "ok", "ok", "ok", "progress", "todo"], readiness: 78, evidence: 19 },
  { controls: ["ok", "ok", "ok", "ok", "ok", "progress"], readiness: 89, evidence: 22 },
  { controls: ["ok", "ok", "ok", "ok", "ok", "ok"], readiness: 100, evidence: 24 },
];

const STYLE: Record<State, { color: string; glyph: string }> = {
  ok: { color: "#7ee787", glyph: "✓" },
  progress: { color: "#c9a878", glyph: "◐" },
  todo: { color: "#6d6580", glyph: "○" },
};

export default function AuditConsole({ copy }: { copy: AuditCopy }) {
  const [i, setI] = useState(FRAMES.length - 1);
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    setAnimate(true);
    setI(0);
    const id = setInterval(() => setI((n) => (n + 1) % FRAMES.length), 2000);
    return () => clearInterval(id);
  }, []);

  // Without motion, show the finished review: every control passing.
  const frame = animate ? FRAMES[i] : FRAMES[FRAMES.length - 1];
  const feedLine = copy.feed[animate ? i % copy.feed.length : copy.feed.length - 1];

  return (
    <div className="relative">
      <div
        aria-hidden
        className="absolute -inset-px rounded-[17px] bg-gradient-to-br from-teal-bright via-plum-bright to-gold-bright"
      />
      <div className="relative overflow-hidden rounded-2xl bg-[#0d1117] font-mono text-caption text-[#c9d1d9]">
        <div className="flex items-center gap-2 border-b border-[#21262d] px-4 py-3">
          <span aria-hidden className="h-[11px] w-[11px] rounded-full bg-[#21262d]" />
          <span aria-hidden className="h-[11px] w-[11px] rounded-full bg-[#21262d]" />
          <span aria-hidden className="h-[11px] w-[11px] rounded-full bg-[#21262d]" />
          <span className="ml-2 text-micro tracking-[0.05em] text-on-dark-faint">{copy.barTitle}</span>
          <span className="ml-auto rounded-full border border-[#3a3145] px-2.5 py-0.5 text-micro tracking-[0.08em] text-gold-bright">
            {copy.badge}
          </span>
        </div>

        {/* Readiness */}
        <div className="border-b border-[#21262d] px-5 py-4">
          <div className="mb-2 flex items-baseline justify-between text-micro tracking-[0.05em]">
            <span className="text-on-dark-faint">{copy.readiness}</span>
            <span className="font-display text-h3 font-medium tabular-nums text-[#7ee787]">
              {frame.readiness}%
            </span>
          </div>
          <span aria-hidden className="block h-1.5 w-full overflow-hidden rounded-full bg-[#21262d]">
            <span
              className="block h-full rounded-full bg-gradient-to-r from-teal-bright to-[#7ee787] transition-[width] duration-1000 ease-out"
              style={{ width: `${frame.readiness}%` }}
            />
          </span>
        </div>

        {/* Controls */}
        <ul className="grid gap-3 px-5 py-4" aria-live="off">
          {copy.controls.map((label, n) => {
            const st = frame.controls[n];
            return (
              <li
                key={label}
                className="flex items-center justify-between gap-4 border-b border-[#21262d] pb-3 last:border-0 last:pb-0"
              >
                <span className="flex items-center gap-3">
                  <span
                    aria-hidden
                    className="w-3 transition-colors duration-500"
                    style={{ color: STYLE[st].color }}
                  >
                    {STYLE[st].glyph}
                  </span>
                  <span className="text-caption">{label}</span>
                </span>
                <span
                  className="text-micro tracking-[0.06em] transition-colors duration-500"
                  style={{ color: STYLE[st].color }}
                >
                  {copy.status[st]}
                </span>
              </li>
            );
          })}
        </ul>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-1 border-t border-[#21262d] px-5 py-3 text-micro text-on-dark-faint">
          <span>
            <span aria-hidden className="mr-2 text-[#7ee787]">
              →
            </span>
            {feedLine}
          </span>
          <span className="ml-auto tabular-nums">
            {frame.evidence} {copy.evidence}
          </span>
        </div>
      </div>
    </div>
  );
}
