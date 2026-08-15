/**
 * Cuts the tab icons from the logo mark.
 *
 * The site declared no icon at all — no rel="icon", no apple-touch-icon — and
 * /favicon.ico returned 404, so every tab of novieri.com showed the browser's
 * blank page glyph. A company that sells technology had an anonymous tab.
 *
 *   node scripts/build-favicons.mjs [--check]
 *
 * The mark is white, on a plum tile, at every size — and that is the whole
 * decision here. The logo is built from thin outlines, which is right at
 * header scale and falls apart at tab scale: rendered at 16px, which is what
 * a browser actually draws, the colour mark reduces to a pale smudge that
 * disappears against a light tab bar. Both were generated and looked at.
 * Filling a brand-plum square with the white mark keeps a definite silhouette
 * and a colour nobody else in the tab strip is using, which is all a favicon
 * has to do.
 *
 * One treatment at all three sizes, so the tab, the iOS home screen and the
 * Android install prompt are recognisably the same thing. The tile is opaque
 * for a second reason too: iOS composites home-screen icons and renders
 * transparency as black.
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
const SRC = `${ROOT}/hubspot/src/theme/novieri/images/novieri-isotipo-blanco-256px.png`;
const OUT = `${ROOT}/hubspot/files/favicons`;
const check = process.argv.includes("--check");

const py = `
import os
from PIL import Image

SRC = ${JSON.stringify(SRC)}
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

# --color-plum, the same value the stylesheet uses.
PLUM = (79, 52, 97, 255)

# Tighter padding on the tab icon: at 16px every pixel of the mark counts, and
# the tile already provides the separation the padding would have.
plan = [
    ("novieri-favicon-32.png", 32, 0.08, PLUM),
    ("novieri-favicon-180.png", 180, 0.14, PLUM),
    ("novieri-favicon-512.png", 512, 0.14, PLUM),
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
