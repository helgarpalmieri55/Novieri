"use client";

import { useEffect, useState } from "react";

export type RmmCopy = {
  barTitle: string;
  badge: string;
  stats: { online: string; patches: string; alerts: string };
  devices: { name: string; os: string }[];
  status: { ok: string; patch: string; reboot: string; alert: string; scan: string };
  feed: string[];
  footer: string;
};

type Status = "ok" | "patch" | "reboot" | "alert" | "scan";

/**
 * One scripted minute of a fleet under management: an alert appears, the
 * platform acts on it, patches roll out in a window, a device reboots and
 * comes back, and the fleet lands at zero pending. Frame data lives here;
 * every string comes from the message catalog.
 */
const FRAMES: { stats: [number, number, number]; devices: Status[]; cpu: number[] }[] = [
  { stats: [128, 12, 1], devices: ["ok", "ok", "alert", "ok", "ok"], cpu: [22, 34, 91, 18, 27] },
  { stats: [128, 12, 1], devices: ["ok", "patch", "alert", "ok", "scan"], cpu: [24, 58, 88, 21, 44] },
  { stats: [128, 8, 0], devices: ["ok", "patch", "ok", "ok", "scan"], cpu: [21, 62, 37, 19, 48] },
  { stats: [127, 5, 0], devices: ["ok", "reboot", "ok", "patch", "ok"], cpu: [23, 8, 29, 55, 26] },
  { stats: [128, 2, 0], devices: ["ok", "ok", "ok", "patch", "ok"], cpu: [20, 31, 25, 61, 24] },
  { stats: [128, 0, 0], devices: ["ok", "ok", "ok", "ok", "ok"], cpu: [19, 28, 24, 23, 22] },
];

const DOT: Record<Status, string> = {
  ok: "bg-[#7ee787]",
  patch: "bg-[#79c0ff]",
  reboot: "bg-gold-bright",
  alert: "bg-[#ff7b72]",
  scan: "bg-[#79c0ff]",
};

const PILL: Record<Status, string> = {
  ok: "text-[#7ee787]",
  patch: "text-[#79c0ff]",
  reboot: "text-gold-bright",
  alert: "text-[#ff7b72]",
  scan: "text-[#79c0ff]",
};

function Bar({ value, status }: { value: number; status: Status }) {
  const color = status === "alert" ? "bg-[#ff7b72]" : value > 70 ? "bg-gold-bright" : "bg-[#4f93a6]";
  return (
    <span aria-hidden className="block h-1.5 w-full overflow-hidden rounded-full bg-[#21262d]">
      <span
        className={`block h-full rounded-full transition-[width] duration-700 ease-out ${color}`}
        style={{ width: `${value}%` }}
      />
    </span>
  );
}

export default function RmmConsole({ copy }: { copy: RmmCopy }) {
  const [i, setI] = useState(FRAMES.length - 1);
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    setAnimate(true);
    setI(0);
    const id = setInterval(() => setI((n) => (n + 1) % FRAMES.length), 1900);
    return () => clearInterval(id);
  }, []);

  const frame = FRAMES[i];
  // Without motion, show the settled fleet: everything healthy, nothing pending.
  const shown = animate ? frame : FRAMES[FRAMES.length - 1];
  const feedLine = copy.feed[animate ? i % copy.feed.length : copy.feed.length - 1];

  const stats: { label: string; value: number; tone: string }[] = [
    { label: copy.stats.online, value: shown.stats[0], tone: "text-[#7ee787]" },
    { label: copy.stats.patches, value: shown.stats[1], tone: "text-[#79c0ff]" },
    { label: copy.stats.alerts, value: shown.stats[2], tone: shown.stats[2] > 0 ? "text-[#ff7b72]" : "text-on-dark-faint" },
  ];

  return (
    <div className="relative">
      <div
        aria-hidden
        className="absolute -inset-px rounded-[17px] bg-gradient-to-br from-teal-bright via-plum-bright to-gold-bright"
      />
      <div className="relative overflow-hidden rounded-2xl bg-[#0d1117] font-mono text-[13px] text-[#c9d1d9]">
        <div className="flex items-center gap-2 border-b border-[#21262d] px-4 py-3">
          <span aria-hidden className="h-[11px] w-[11px] rounded-full bg-[#21262d]" />
          <span aria-hidden className="h-[11px] w-[11px] rounded-full bg-[#21262d]" />
          <span aria-hidden className="h-[11px] w-[11px] rounded-full bg-[#21262d]" />
          <span className="ml-2 text-[12px] tracking-[0.05em] text-on-dark-faint">{copy.barTitle}</span>
          <span className="ml-auto rounded-full border border-[#3a3145] px-2.5 py-0.5 text-[10.5px] tracking-[0.08em] text-gold-bright">
            {copy.badge}
          </span>
        </div>

        {/* Fleet counters */}
        <div className="grid grid-cols-3 border-b border-[#21262d]">
          {stats.map((s) => (
            <div key={s.label} className="border-r border-[#21262d] px-4 py-3.5 last:border-r-0">
              <div className={`font-display text-[26px] font-medium leading-none tabular-nums ${s.tone}`}>
                {s.value}
              </div>
              <div className="mt-1.5 text-[11px] leading-tight tracking-[0.04em] text-on-dark-faint">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Devices */}
        <div className="px-4 py-3" aria-live="off">
          {copy.devices.map((d, n) => {
            const st = shown.devices[n];
            return (
              <div key={d.name} className="grid grid-cols-[1.4fr_0.8fr_1fr_auto] items-center gap-3 py-[7px]">
                <span className="flex items-center gap-2 truncate">
                  <span aria-hidden className={`h-2 w-2 flex-none rounded-full ${DOT[st]}`} />
                  <span className="truncate text-[12.5px]">{d.name}</span>
                </span>
                <span className="truncate text-[11.5px] text-on-dark-faint">{d.os}</span>
                <Bar value={shown.cpu[n]} status={st} />
                <span className={`w-[92px] text-right text-[11.5px] ${PILL[st]}`}>{copy.status[st]}</span>
              </div>
            );
          })}
        </div>

        {/* Activity line */}
        <div className="border-t border-[#21262d] px-4 py-3 text-[11.5px] text-on-dark-faint">
          <span aria-hidden className="mr-2 text-[#7ee787]">→</span>
          {feedLine}
        </div>
        <div className="border-t border-[#21262d] px-4 py-2.5 text-[11px] tracking-[0.05em] text-on-dark-faint">
          {copy.footer}
        </div>
      </div>
    </div>
  );
}
