"use client";

import { useEffect, useState } from "react";

export type SwarmCopy = {
  barTitle: string;
  badge: string;
  human: string;
  orchestrator: string;
  agents: string[];
  feed: string[];
  gate: string;
  stats: { files: string; tests: string; review: string };
};

/**
 * How we actually build: a person sets the goal, an orchestrator decomposes
 * it and delegates to specialised agents that work in parallel, and the
 * person keeps the approval gate before anything merges. Each frame lights
 * the agents working at that moment and the edges carrying their traffic.
 */
const FRAMES: { active: number[]; human: boolean; gate: boolean; files: number; tests: number }[] = [
  { active: [], human: true, gate: false, files: 0, tests: 0 },
  { active: [0], human: false, gate: false, files: 3, tests: 0 },
  { active: [1, 2], human: false, gate: false, files: 11, tests: 0 },
  { active: [1, 2, 3], human: false, gate: false, files: 18, tests: 46 },
  { active: [3, 4], human: false, gate: false, files: 21, tests: 84 },
  { active: [], human: true, gate: true, files: 21, tests: 84 },
];

/** Agent nodes sit on an arc under the orchestrator. */
const NODES = [
  { x: 40, y: 132 },
  { x: 116, y: 150 },
  { x: 196, y: 156 },
  { x: 276, y: 150 },
  { x: 352, y: 132 },
];
const HUB = { x: 196, y: 56 };

export default function AgentSwarm({ copy }: { copy: SwarmCopy }) {
  const [i, setI] = useState(FRAMES.length - 1);
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    setAnimate(true);
    setI(0);
    const id = setInterval(() => setI((n) => (n + 1) % FRAMES.length), 1900);
    return () => clearInterval(id);
  }, []);

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

        {/* The swarm */}
        <svg viewBox="0 0 392 196" className="w-full" role="img" aria-label={copy.barTitle}>
          {/* human → orchestrator */}
          <line
            x1={HUB.x}
            y1="18"
            x2={HUB.x}
            y2={HUB.y - 14}
            stroke={frame.human ? "#c9a878" : "#21262d"}
            strokeWidth="1.5"
            className={frame.human ? "edge-flow" : ""}
          />
          <text
            x={HUB.x}
            y="14"
            textAnchor="middle"
            style={{ font: "500 11px var(--font-mono)", fill: frame.human ? "#c9a878" : "#6d6580" }}
          >
            {copy.human}
          </text>

          {/* orchestrator → agents */}
          {NODES.map((n, idx) => {
            const on = frame.active.includes(idx);
            return (
              <line
                key={`e${idx}`}
                x1={HUB.x}
                y1={HUB.y + 14}
                x2={n.x}
                y2={n.y - 12}
                stroke={on ? "#79c0ff" : "#21262d"}
                strokeWidth="1.5"
                className={on ? "edge-flow" : ""}
              />
            );
          })}

          {/* orchestrator */}
          <circle cx={HUB.x} cy={HUB.y} r="15" fill="#1c1728" stroke="#8d63ad" strokeWidth="1.5" />
          <path
            d="M196 47 C197.2 53.5 200.5 56.8 207 58 C200.5 59.2 197.2 62.5 196 69 C194.8 62.5 191.5 59.2 185 58 C191.5 56.8 194.8 53.5 196 47 Z"
            fill="#c9a878"
          />
          <text
            x={HUB.x}
            y={HUB.y + 32}
            textAnchor="middle"
            style={{ font: "400 10.5px var(--font-mono)", fill: "#a49cb2" }}
          >
            {copy.orchestrator}
          </text>

          {/* agents */}
          {NODES.map((n, idx) => {
            const on = frame.active.includes(idx);
            return (
              <g key={`n${idx}`}>
                <circle
                  cx={n.x}
                  cy={n.y}
                  r="11"
                  fill={on ? "#132b3d" : "#161b22"}
                  stroke={on ? "#79c0ff" : "#2b2536"}
                  strokeWidth="1.5"
                  className={on ? "node-pulse" : ""}
                />
                <circle cx={n.x} cy={n.y} r="3.2" fill={on ? "#79c0ff" : "#3a3145"} />
                <text
                  x={n.x}
                  y={n.y + 26}
                  textAnchor="middle"
                  style={{
                    font: "400 9.5px var(--font-mono)",
                    fill: on ? "#79c0ff" : "#6d6580",
                    letterSpacing: "0.04em",
                  }}
                >
                  {copy.agents[idx]}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Approval gate + activity */}
        <div className="border-t border-[#21262d] px-4 py-3 text-micro" aria-live="off">
          <span className={frame.gate ? "text-gold-bright" : "text-on-dark-faint"}>
            <span aria-hidden className="mr-2">
              {frame.gate ? "◆" : "→"}
            </span>
            {frame.gate ? copy.gate : feedLine}
          </span>
        </div>

        <div className="flex flex-wrap gap-x-5 gap-y-1 border-t border-[#21262d] px-4 py-3 text-micro tracking-[0.05em] text-on-dark-faint">
          <span className="tabular-nums">
            {frame.files} {copy.stats.files}
          </span>
          <span className="tabular-nums">
            {frame.tests} {copy.stats.tests}
          </span>
          <span>{copy.stats.review}</span>
        </div>
      </div>
    </div>
  );
}
