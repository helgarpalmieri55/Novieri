/**
 * Crops product interface out of a marketing banner.
 *
 * The vulnerability platform's screens arrived as finished banners: each one
 * already carries its own headline and its own feature strip, and the product
 * page has both of those already. What the page actually needs is the
 * interface — the dashboard, the scan list, the findings table — so this cuts
 * the chrome away and leaves the screen.
 *
 * Percentages, not pixels: the banners are different sizes, and a fraction of
 * the frame survives a re-export where a pixel box does not.
 *
 *   node scripts/crop-product-screens.mjs source.png out-name 0,0.18,1,0.82
 *                                          ^        ^        ^
 *                                          input    basename left,top,right,bottom
 *
 * Output lands in hubspot/files/screens, which the deploy uploads.
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const [src, name, box] = process.argv.slice(2);
if (!src || !name || !box) {
  console.error("usage: node scripts/crop-product-screens.mjs <source.png> <out-name> <left,top,right,bottom as 0-1>");
  process.exit(1);
}
if (!existsSync(src)) {
  console.error(`No such file: ${src}`);
  process.exit(1);
}

const OUT = resolve(dirname(fileURLToPath(import.meta.url)), "../hubspot/files/screens");
mkdirSync(OUT, { recursive: true });

const [l, t, r, b] = box.split(",").map(Number);
if ([l, t, r, b].some((n) => !Number.isFinite(n) || n < 0 || n > 1) || l >= r || t >= b) {
  console.error("The box must be four fractions between 0 and 1, left<right and top<bottom.");
  process.exit(1);
}

// Pillow does the pixel work; keeping it out of the repo's dependencies since
// this runs by hand when new screens arrive.
const py = `
from PIL import Image
im = Image.open(${JSON.stringify(src)})
w, h = im.size
box = (int(w*${l}), int(h*${t}), int(w*${r}), int(h*${b}))
out = im.crop(box)
# A screenshot wider than 2400px buys nothing on a page that is 1200 at most.
if out.width > 2400:
    out = out.resize((2400, round(out.height * 2400 / out.width)), Image.LANCZOS)
out.save(${JSON.stringify(`${OUT}/${name}.png`)}, optimize=True)
print(f"{im.size} -> {out.size}")
`;
const result = execFileSync("python3", ["-c", py], { encoding: "utf8" });
console.log(`cropped ${name}: ${result.trim()}`);
