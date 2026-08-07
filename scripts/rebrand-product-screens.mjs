/**
 * Takes a product name off a screenshot the site is not allowed to say.
 *
 * The vulnerability platform's renders arrived carrying an internal codename in
 * the app's own header — two of them as a bare wordmark, one as the corrected
 * "NOVIERI <codename>". The site does not use that name anywhere, so publishing
 * them as sent would introduce it, and publishing them together would put two
 * different product names on one page.
 *
 * Re-exporting is the right fix and this is not a substitute for it. What this
 * does is narrower: it edits the chrome, never the data. Two primitives, and
 * both refuse to touch anything but flat UI background:
 *
 *   erase   paint a rectangle back to background, rebuilt row by row from the
 *           nearest clean pixel on each side rather than a flat fill, so the
 *           header's own gradient survives the patch
 *   stamp   lift the ink of a word from one render and set it into another,
 *           compositing on alpha derived from the donor's own contrast so only
 *           the glyphs travel and the destination keeps its own background
 *
 * stamp only holds up between renders at the same text scale, which is why the
 * measurements below are asserted rather than assumed: the run fails loudly if
 * a re-export moves the type, instead of quietly pasting a word at the wrong
 * size. Coordinates are pixels because these are three fixed files, not a
 * pipeline — a re-export means re-measuring, and the assertions will say so.
 *
 *   node scripts/rebrand-product-screens.mjs [--check]
 *
 * --check measures and reports without writing, which is the first thing to run
 * when a new export lands.
 */
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const DIR = resolve(dirname(fileURLToPath(import.meta.url)), "../hubspot/files/screens");
const check = process.argv.includes("--check");

// Every box is [left, top, right, bottom] in source pixels, right/bottom
// exclusive. The ink boxes are what the assertions check; the paint boxes are
// deliberately looser so antialiasing does not survive at the edges.
const PLAN = {
  donor: {
    file: "raw-findings.png",
    // "NOVIERI", the one instance of the company name already set in the app's
    // own header type. Everything else here is a copy of these glyphs.
    ink: [291, 61, 345, 69],
    lift: [289, 58, 347, 72],
  },
  edits: [
    {
      file: "raw-findings.png",
      erase: [
        // The codename, leaving "NOVIERI" and the descriptor under it.
        { box: [346, 56, 420, 73], expectInk: [351, 61, 414, 69] },
      ],
    },
    {
      file: "raw-dashboard.png",
      erase: [
        { box: [289, 68, 358, 83], expectInk: [293, 72, 354, 80] },
        // The account line. "novieri.demo" is eleven pixels wider than the
        // domain it would replace and this header has no eleven pixels to
        // give, so the line comes out rather than being stamped at a size that
        // would not match the type beside it. An icon and an avatar with no
        // address is an ordinary way for a console to render its header; a
        // half-scale email next to a full-scale one is not.
        { box: [1213, 64, 1315, 92], expectInk: [1219, 68, 1308, 87] },
      ],
      // Left edge and cap top of the erased wordmark, so the donor lands where
      // the codename was rather than where the donor happened to sit.
      stamp: { at: [293, 72] },
    },
    {
      file: "raw-scans.png",
      // The account here is analyst@acme.demo — a generic demo domain, and not
      // a name the site has to avoid. Only the wordmark is a problem.
      erase: [{ box: [286, 70, 356, 85], expectInk: [290, 74, 351, 82] }],
      stamp: { at: [290, 74] },
    },
  ],
};

const py = `
import json, sys
from PIL import Image

PLAN = json.loads(${JSON.stringify(JSON.stringify(PLAN))})
DIR = ${JSON.stringify(DIR)}
CHECK = ${check ? "True" : "False"}
BG = 235          # anything lighter than this is header, not type
INK = 140         # anything darker than this is a glyph
problems = []

def ink_box(im, box, thr=INK):
    """Tight bounds of the dark pixels inside box, or None if there are none."""
    l, t, r, b = box
    px = im.convert("L").load()
    pts = [(x, y) for y in range(t, b) for x in range(l, r) if px[x, y] < thr]
    if not pts:
        return None
    xs = [p[0] for p in pts]; ys = [p[1] for p in pts]
    return [min(xs), min(ys), max(xs) + 1, max(ys) + 1]

def expect(name, got, want, slack=2):
    """A re-export that moves the type must stop the run, not be pasted over."""
    if got is None:
        problems.append(f"{name}: found no text where some was expected at {want}")
        return False
    off = [abs(g - w) for g, w in zip(got, want)]
    if max(off) > slack:
        problems.append(f"{name}: text is at {got}, expected {want} (off by {off})")
        return False
    return True

def erase(im, box):
    """Rebuild a rectangle from the background on either side of it.

    A flat fill reads as a rectangle somebody drew; these headers carry a soft
    gradient, so each row is interpolated between the nearest genuinely-empty
    pixel to its left and to its right."""
    l, t, r, b = box
    px = im.load()
    g = im.convert("L").load()
    w = im.size[0]
    for y in range(t, b):
        lx = l - 1
        while lx > 0 and g[lx, y] < BG:
            lx -= 1
        rx = r
        while rx < w - 1 and g[rx, y] < BG:
            rx += 1
        cl, cr = px[lx, y], px[rx, y]
        span = rx - lx
        for x in range(l, r):
            f = (x - lx) / span
            px[x, y] = tuple(round(a + (c - a) * f) for a, c in zip(cl, cr))

def stamp(im, patch, at, ink_origin):
    """Set the donor's glyphs into im, keeping im's own background.

    Alpha comes from the donor's contrast: fully opaque where the donor is at
    its darkest, transparent where it is at its background. So what transfers
    is the shape of the letters and their antialiasing, not the donor's paper.

    "at" is where the destination's own ink began; "ink_origin" is where the
    donor's ink sits inside the patch. Aligning those two rather than the patch
    corners is what puts the word on the old word's baseline and left edge."""
    pg = patch.convert("L").load()
    pp = patch.load()
    pw, ph = patch.size
    dark = min(pg[x, y] for y in range(ph) for x in range(pw))
    light = max(pg[x, y] for y in range(ph) for x in range(pw))
    px = im.load()
    dx = at[0] - ink_origin[0]
    dy = at[1] - ink_origin[1]
    for y in range(ph):
        for x in range(pw):
            a = (light - pg[x, y]) / (light - dark)
            if a <= 0.02:
                continue
            a = min(1.0, a)
            tx, ty = x + dx, y + dy
            px[tx, ty] = tuple(
                round(d + (s - d) * a) for d, s in zip(px[tx, ty], pp[x, y])
            )

# --- measure first, write only if every measurement holds -------------------
d = PLAN["donor"]
donor_im = Image.open(f"{DIR}/{d['file']}").convert("RGB")
got = ink_box(donor_im, d["lift"])
expect(f"donor {d['file']}", got, d["ink"])
print(f"donor  {d['file']:20s} NOVIERI ink at {got} (expected {d['ink']})")

for e in PLAN["edits"]:
    im = Image.open(f"{DIR}/{e['file']}").convert("RGB")
    for spot in e["erase"]:
        got = ink_box(im, spot["box"])
        expect(f"{e['file']} {spot['box']}", got, spot["expectInk"])
        print(f"erase  {e['file']:20s} ink at {got} (expected {spot['expectInk']})")

if problems:
    print()
    for p in problems:
        print("STOP:", p)
    print("\\nNothing was written. Re-measure against the new export before running again.")
    sys.exit(1)

if CHECK:
    print("\\nEvery measurement holds. Run without --check to write.")
    sys.exit(0)

# --- write ------------------------------------------------------------------
# The donor is lifted from the file on disk before any edit runs, so the order
# of the edits below cannot matter.
patch = donor_im.crop(d["lift"])
# Where the donor's ink starts inside the cropped patch.
patch_offset = [d["ink"][0] - d["lift"][0], d["ink"][1] - d["lift"][1]]

for e in PLAN["edits"]:
    path = f"{DIR}/{e['file']}"
    im = Image.open(path).convert("RGB")
    for spot in e["erase"]:
        erase(im, spot["box"])
    if "stamp" in e:
        stamp(im, patch, e["stamp"]["at"], patch_offset)
    im.save(path, optimize=True)
    print(f"wrote  {e['file']}")
`;

if (!existsSync(`${DIR}/${PLAN.donor.file}`)) {
  console.error(`No such file: ${DIR}/${PLAN.donor.file}`);
  process.exit(1);
}
try {
  console.log(execFileSync("python3", ["-c", py], { encoding: "utf8" }).trimEnd());
} catch (err) {
  console.log(err.stdout?.trimEnd() ?? "");
  process.exit(1);
}
