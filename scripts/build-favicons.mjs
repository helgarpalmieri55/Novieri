/**
 * Cuts the tab icons from the logo mark.
 *
 * The site declared no icon at all — no rel="icon", no apple-touch-icon — and
 * /favicon.ico returned 404, so every tab of novieri.com showed the browser's
 * blank page glyph. A company that sells technology had an anonymous tab.
 *
 *   node scripts/build-favicons.mjs [--check]
 *
 * The colour mark on white, at every size, matching the favicon already set in
 * the HubSpot brand kit. That is a deliberate choice with a known cost, and
 * the cost is worth writing down so nobody re-litigates it by accident.
 *
 * The logo is built from thin outlines. That is right at header scale and hard
 * at tab scale: rendered at 16px, which is what a browser actually draws, the
 * strokes thin out and the mark reads as a pale smudge on a light tab bar. A
 * white mark on a solid plum tile was generated and compared side by side, and
 * it is unambiguously more legible at that size. Brand consistency won — one
 * favicon, matching the brand kit, rather than a tab that disagrees with the
 * panel every other HubSpot surface reads from.
 *
 * To go back, change TREATMENT below to "plum" and re-run. Both are one line.
 *
 * One treatment at all three sizes, so the tab, the iOS home screen and the
 * Android install prompt are recognisably the same thing. The background is
 * opaque rather than transparent for a second reason: iOS composites
 * home-screen icons and renders transparency as black.
 *
 * The source is 256x261 — taller than it is wide — so every size fits the mark
 * inside a square canvas rather than stretching it to fill one.
 *
 * Output goes to hubspot/files/favicons, which the deploy uploads to the File
 * Manager. Not the theme: theme image URLs have 404'd here before while the
 * File Manager copies beside them served fine, and a tab icon is not worth
 * finding that out again in production.
 */
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
/** "colour" matches the brand kit; "plum" is the more legible alternative. */
const TREATMENT = "colour";
const MARKS = { colour: "novieri-isotipo-color-256px.png", plum: "novieri-isotipo-blanco-256px.png" };
const SRC = `${ROOT}/hubspot/src/theme/novieri/images/${MARKS[TREATMENT]}`;
const OUT = `${ROOT}/hubspot/files/favicons`;
const check = process.argv.includes("--check");

const py = `
import os
from PIL import Image

SRC = ${JSON.stringify(SRC)}
TREATMENT = ${JSON.stringify(TREATMENT)}
OUT = ${JSON.stringify(OUT)}
CHECK = ${check ? "True" : "False"}

os.makedirs(OUT, exist_ok=True)
mark = Image.open(SRC).convert("RGBA")

def square(size, pad_ratio, background):
    """The mark centred in a square, scaled to fit with room around it."""
    inner = round(size * (1 - 2 * pad_ratio))
    w, h = mark.size
    scale = inner / max(w, h)
    fitted = mark.resize((max(1, round(w * scale)), max(1, round(h * scale))), Image.LANCZOS)
    canvas = Image.new("RGBA", (size, size), background)
    canvas.alpha_composite(fitted, ((size - fitted.width) // 2, (size - fitted.height) // 2))
    return canvas

WHITE = (255, 255, 255, 255)
# --color-plum, the same value the stylesheet uses.
PLUM = (79, 52, 97, 255)
BG = WHITE if TREATMENT == "colour" else PLUM

# The tab icon gets almost no padding. On the colour treatment the strokes are
# already fighting for legibility at 16px, so every pixel of the mark is one it
# needs; the larger sizes can afford the breathing room an app icon expects.
plan = [
    ("novieri-favicon-32.png", 32, 0.03, BG),
    ("novieri-favicon-180.png", 180, 0.12, BG),
    ("novieri-favicon-512.png", 512, 0.12, BG),
]

for name, size, pad, bg in plan:
    img = square(size, pad, bg)
    path = os.path.join(OUT, name)
    if not CHECK:
        img.save(path, "PNG", optimize=True)
    written = os.path.getsize(path) if os.path.exists(path) else 0
    print(f"{'would write' if CHECK else 'wrote'}  {name:<26} {size}x{size:<4} {written:>6} bytes")
`;

console.log(execFileSync("python3", ["-c", py], { encoding: "utf8" }).trimEnd());
