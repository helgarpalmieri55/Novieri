/**
 * Shrinks the hero mark without changing a pixel of it.
 *
 * novieri-isotipo-color.svg is 123 KB — the heaviest asset on the home page by
 * a distance, heavier than every font, and it is on the critical path twice:
 * once as an <img fetchpriority="high"> and once as a CSS mask-image for the
 * sweep animation.
 *
 * The weight is not detail, it is bookkeeping. The file is a traced outline —
 * one path, 2,916 cubic segments, 17,542 coordinates — and every coordinate is
 * written absolutely, so a point three pixels along reads "180.31,281.19"
 * instead of "3.02,-0.07". Relative commands say the same shape in roughly
 * half the characters, and SVG has supported them since 1999.
 *
 *   node scripts/optimize-mark.mjs [--check]
 *
 * The rewrite is arithmetic, not approximation: same command count, same
 * curves, same two decimal places. scripts/verify-mark.mjs renders both files
 * in Chromium and compares them pixel by pixel, because "it should be
 * identical" is not the same sentence as "it is" — and the first version of
 * this script was not. Rounding each delta against the *exact* previous point
 * let the error compound down a 2,916-segment path, and 97 pixels moved. The
 * cursor below therefore tracks the position a renderer will actually be at
 * after reading the rounded numbers, so every point lands within half a
 * hundredth of its original and nothing accumulates.
 */
import { readFileSync, writeFileSync } from "node:fs";

const SRC = "hubspot/src/theme/novieri/images/novieri-isotipo-color.svg";
const check = process.argv.includes("--check");

const svg = readFileSync(SRC, "utf8");
const match = svg.match(/\sd="([^"]+)"/);
if (!match) throw new Error("no path data in the mark");

const round = (n) => {
  const r = Math.round(n * 100) / 100;
  // "3" beats "3.00", and "-0" is never worth two characters.
  const s = String(r);
  return s === "-0" ? "0" : s;
};

/** Absolute M/C/Z in, relative m/c/z out, current point tracked by hand. */
function toRelative(d) {
  const tokens = d.match(/[MCZmcz]|-?\d*\.?\d+/g) || [];
  const out = [];
  let i = 0;
  let x = 0;
  let y = 0;
  let startX = 0;
  let startY = 0;
  let command = "";

  while (i < tokens.length) {
    const token = tokens[i];
    if (/[MCZmcz]/.test(token)) {
      command = token;
      i += 1;
      if (command === "Z" || command === "z") {
        out.push("z");
        x = startX;
        y = startY;
      }
      continue;
    }
    if (command === "M") {
      const nx = Number(tokens[i]);
      const ny = Number(tokens[i + 1]);
      const dx = round(nx - x);
      const dy = round(ny - y);
      out.push(`m${dx},${dy}`);
      x = startX = x + Number(dx);
      y = startY = y + Number(dy);
      i += 2;
      // A second coordinate pair after M is an implicit lineto, which this
      // file does not use; if that ever changes, fail loudly.
      if (i < tokens.length && !/[MCZmcz]/.test(tokens[i])) {
        throw new Error("implicit lineto after M — not handled");
      }
      continue;
    }
    if (command === "C") {
      const n = tokens.slice(i, i + 6).map(Number);
      if (n.length < 6 || n.some(Number.isNaN)) throw new Error("short C segment");
      const d = [round(n[0] - x), round(n[1] - y), round(n[2] - x), round(n[3] - y), round(n[4] - x), round(n[5] - y)];
      out.push(`c${d[0]},${d[1]} ${d[2]},${d[3]} ${d[4]},${d[5]}`);
      // The cursor follows the rounded numbers, not the originals: that is
      // where the renderer will be, and measuring the next delta from
      // anywhere else is how error compounds.
      x += Number(d[4]);
      y += Number(d[5]);
      i += 6;
      continue;
    }
    throw new Error(`unhandled command "${command}"`);
  }
  // Commas between commands are redundant once each starts with a letter.
  return out.join("").replace(/\s+/g, " ").trim();
}

const before = match[1];
const after = toRelative(before);
const out = svg.replace(match[0], ` d="${after}"`);

const pct = (100 * (1 - out.length / svg.length)).toFixed(1);
console.log(`path   ${before.length} -> ${after.length} chars`);
console.log(`file   ${svg.length} -> ${out.length} bytes  (${pct}% smaller)`);

if (check) {
  console.log("--check: nothing written");
} else {
  writeFileSync(SRC, out);
  console.log(`wrote  ${SRC}`);
}
