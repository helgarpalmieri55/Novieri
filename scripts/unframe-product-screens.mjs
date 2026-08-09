/**
 * Lifts the screen out of a device render.
 *
 * The platform screenshots arrived as photographs of a laptop on a desk. Shown
 * whole at the width of a page column, most of the picture is aluminium and
 * background and the interface — the thing the caption is talking about — ends
 * up too small to read. Cropping to a rectangle does not fix it either: the
 * laptops are shot at an angle, so the screen is a trapezoid and a square crop
 * either keeps bezel or eats content.
 *
 * So this finds the screen's four corners and un-warps that quadrilateral into
 * a rectangle. What comes out is the screenshot the render was made from, at
 * roughly its own resolution — no device, no desk, nothing invented.
 *
 *   node scripts/unframe-product-screens.mjs [--check]
 *
 * Sources live in hubspot/screens-src and are not uploaded; the rectangles land
 * in hubspot/files/screens, which the deploy puts in the File Manager. Run
 * rebrand-product-screens.mjs first when a render needs one — it measures
 * against the source, not against the output.
 *
 * --check prints the geometry it found without writing, which is worth reading
 * once per new render: the edges should be near-straight and the corners should
 * bracket the screen, and both are visible in the numbers.
 */
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = `${ROOT}/hubspot/screens-src`;
const OUT = `${ROOT}/hubspot/files/screens`;
const check = process.argv.includes("--check");

// Source name -> published name. The sources are called "raw" because that is
// what they are; nothing published should be.
const FILES = [
  ["raw-dashboard", "vuln-dashboard"],
  ["raw-scans", "vuln-scans"],
  ["raw-findings", "vuln-findings"],
  ["raw-dash-visitor", "visitor-overview"],
  ["raw-ai-visitor", "visitor-ai-analyst"],
  ["raw-reports-visitor", "visitor-daily-report"],
];

const py = `
import json, sys
from PIL import Image

FILES = json.loads(${JSON.stringify(JSON.stringify(FILES))})
SRC, OUT = ${JSON.stringify(SRC)}, ${JSON.stringify(OUT)}
CHECK = ${check ? "True" : "False"}

DARK, LIGHT = 70, 150   # bezel, and screen
RUN = 6                 # pixels that must agree before a transition is believed
MAX_SKEW = 60           # how far an edge may travel across the frame, in pixels

def first_bright_after_dark(read, path):
    """Walk a line of pixels and return where the screen starts.

    Every path here begins outside the laptop, so the order is always the same:
    light desk, dark bezel, then screen. Stopping at the first bright run after
    the first dark run means dark things *inside* the interface are already past
    the answer by the time they appear, which is what makes this survive an app
    with a black banner in the middle of it."""
    n = len(path)
    seen_dark = False
    i = 0
    while i < n - RUN:
        window = [read(p) for p in path[i:i + RUN]]
        if not seen_dark:
            if all(v < DARK for v in window):
                seen_dark = True
                i += RUN
                continue
        elif all(v > LIGHT for v in window):
            return path[i]
        i += 1
    return None

def keep(points, side):
    """Drop samples that landed on something inside the screen.

    Each edge is the outermost boundary in its own direction: the left edge is
    the leftmost, the bottom the lowest. A sample that came back well inside
    that is not a worse reading of the edge, it is a different object — the
    camera notch moulded into the top bezel, a dark panel the app draws at the
    frame's edge. MAX_SKEW is the width of the doubt: an edge may lean that far
    across the picture, so anything within it is still the edge, and anything
    beyond it is not."""
    if not points:
        return points
    vs = [v for _, v in points]
    if side == "min":
        limit = min(vs) + MAX_SKEW
        return [(t, v) for t, v in points if v <= limit]
    limit = max(vs) - MAX_SKEW
    return [(t, v) for t, v in points if v >= limit]

def fit(points):
    """Least squares line through (t, v) samples, returned as v = a*t + b."""
    n = len(points)
    mt = sum(t for t, _ in points) / n
    mv = sum(v for _, v in points) / n
    den = sum((t - mt) ** 2 for t, _ in points)
    a = sum((t - mt) * (v - mv) for t, v in points) / den if den else 0.0
    return a, mv - a * mt

def fit_robust(points, tol=2.5):
    """Fit, drop whatever misses, fit again.

    keep() removes samples that landed on a different object; this removes the
    ones that landed on the same object in the wrong place — chiefly the camera
    notch moulded into the top bezel, which is only a tenth of the width and
    only a dozen pixels deep, so it survives the first filter and still bends
    the line. Trimming stops before it can eat a real edge: two thirds of the
    samples have to survive, or the edge is reported as unreadable rather than
    quietly refitted to whatever was left."""
    pts = list(points)
    floor = max(8, int(len(points) * 0.66))
    while True:
        a, b = fit(pts)
        resid = sorted(((abs(v - (a * t + b)), (t, v)) for t, v in pts), reverse=True)
        worst = resid[0][0]
        if worst <= tol or len(pts) <= floor:
            return a, b, worst, len(pts)
        # One at a time, worst first. Dropping every sample above the tolerance
        # in one pass throws away the good ones too: while the outliers are
        # still in the fit they drag the line off the edge, and the honest
        # samples end up a hair outside the tolerance as well.
        pts = [p for _, p in resid[1:]]

def solve(m, rhs):
    """Gaussian elimination with partial pivoting. Eight unknowns, once per
    image — not worth a dependency."""
    n = len(rhs)
    a = [row[:] + [rhs[i]] for i, row in enumerate(m)]
    for c in range(n):
        p = max(range(c, n), key=lambda r: abs(a[r][c]))
        if abs(a[p][c]) < 1e-12:
            raise ValueError("degenerate quad — the edges do not intersect")
        a[c], a[p] = a[p], a[c]
        for r in range(n):
            if r == c:
                continue
            f = a[r][c] / a[c][c]
            for k in range(c, n + 1):
                a[r][k] -= f * a[c][k]
    return [a[r][n] / a[r][r] for r in range(n)]

def corners(im):
    px = im.convert("L").load()
    W, H = im.size

    def rows(fn, lo, hi, step):
        pts = []
        for t in range(lo, hi, step):
            v = fn(t)
            if v is not None:
                pts.append((t, v))
        return pts

    left  = rows(lambda y: first_bright_after_dark(lambda p: px[p, y], list(range(0, W // 2))),
                 int(H * 0.10), int(H * 0.80), 12)
    right = rows(lambda y: first_bright_after_dark(lambda p: px[p, y], list(range(W - 1, W // 2, -1))),
                 int(H * 0.10), int(H * 0.80), 12)
    top   = rows(lambda x: first_bright_after_dark(lambda p: px[x, p], list(range(0, H // 2))),
                 int(W * 0.20), int(W * 0.80), 12)

    # The bottom cannot be found from outside: below the screen is a keyboard,
    # and the light metal between two keys looks exactly like the start of a
    # screen. So it is found from inside, scanning down for the bezel.
    ta, tb = fit_robust(keep(top, "min"))[:2]
    bottom = []
    for x in range(int(W * 0.20), int(W * 0.80), 12):
        y = int(ta * x + tb) + 250
        while y < H - 20:
            if all(px[x, y + k] < DARK for k in range(20)):
                bottom.append((x, y))
                break
            y += 1

    lines = {}
    for name, pts, vertical, side in (("left", left, True, "min"), ("right", right, True, "max"),
                                      ("top", top, False, "min"), ("bottom", bottom, False, "max")):
        pts = keep(pts, side)
        if len(pts) < 8:
            raise ValueError(f"{name}: only {len(pts)} samples — the edge was not found")
        a, b, resid, used = fit_robust(pts)
        span = abs(a) * (H if vertical else W)
        if span > MAX_SKEW:
            raise ValueError(f"{name}: travels {span:.0f}px across the frame — that is not an edge")
        if resid > 4:
            raise ValueError(f"{name}: samples miss a straight line by {resid:.0f}px — not a clean edge")
        lines[name] = (a, b, resid, used)

    # Step just inside the glass. The boundary between bezel and screen is a
    # pixel or two of blend, and a quad drawn exactly on it keeps a hairline of
    # bezel along whichever edge the fit rounded outward. Nudging each line in
    # along its own normal costs three pixels of an interface that has margins
    # far wider than that.
    INSET = 3
    for name, sign in (("left", +1), ("right", -1), ("top", +1), ("bottom", -1)):
        a, b, resid, used = lines[name]
        lines[name] = (a, b + sign * INSET, resid, used)

    def meet(v, h):
        # x = av*y + bv and y = ah*x + bh
        av, bv = lines[v][0], lines[v][1]
        ah, bh = lines[h][0], lines[h][1]
        x = (av * bh + bv) / (1 - av * ah)
        return (x, ah * x + bh)

    quad = [meet("left", "top"), meet("right", "top"), meet("right", "bottom"), meet("left", "bottom")]
    return quad, lines

def coeffs(dst, src):
    """Pillow's PERSPECTIVE maps output back to input, so the system is built
    that way round: dst corners in, src corners out."""
    m, rhs = [], []
    for (X, Y), (x, y) in zip(dst, src):
        m.append([X, Y, 1, 0, 0, 0, -x * X, -x * Y]); rhs.append(x)
        m.append([0, 0, 0, X, Y, 1, -y * X, -y * Y]); rhs.append(y)
    return solve(m, rhs)

def dist(p, q):
    return ((p[0] - q[0]) ** 2 + (p[1] - q[1]) ** 2) ** 0.5

problems = []
plan = []
for src_name, out_name in FILES:
    path = f"{SRC}/{src_name}.png"
    try:
        im = Image.open(path).convert("RGB")
        quad, lines = corners(im)
    except Exception as e:
        problems.append(f"{src_name}: {e}")
        continue
    tl, tr, br, bl = quad
    w = round((dist(tl, tr) + dist(bl, br)) / 2)
    h = round((dist(tl, bl) + dist(tr, br)) / 2)
    # A screen wider than 1800 buys nothing in a column that is 1200 at most,
    # and upscaling past the source invents detail that was never captured.
    if w > 1800:
        h = round(h * 1800 / w); w = 1800
    plan.append((path, out_name, quad, w, h))
    edges = "  ".join(f"{k}:±{v[2]:.1f}/{v[3]}" for k, v in lines.items())
    print(f"{src_name:22s} -> {out_name:20s} {im.size[0]}x{im.size[1]} -> {w}x{h}   corners "
          f"{'  '.join(f'({x:.0f},{y:.0f})' for x, y in quad)}   fit {edges}")

if problems:
    print()
    for p in problems:
        print("STOP:", p)
    print("\\nNothing was written.")
    sys.exit(1)

if CHECK:
    print("\\nGeometry looks sane. Run without --check to write.")
    sys.exit(0)

def drop_notch(im):
    """Fill in the camera housing that hangs into the top of the screen.

    The bezel is not a rectangle: a notch is moulded into the top edge and it
    covers a piece of the picture. Straightening the screen cannot recover what
    was behind it — nothing was ever there — so the alternatives are to leave a
    black tab hanging into the app's header or to close it up with the header it
    interrupts. It runs along the top edge, which is a flat toolbar in every one
    of these, so closing it up costs no information.

    Returns how wide the notch was, or 0 if the render had none."""
    px = im.load()
    g = im.convert("L").load()
    W, H = im.size
    band = min(60, H // 8)
    # A notch is cut by the top edge, so it is dark in the first rows and
    # contiguous. Both conditions matter: the header's own text is dark too but
    # sits twenty pixels down, and a screen's rounded corners are dark at the
    # top but at the ends rather than the middle.
    hits = [x for x in range(int(W * 0.15), int(W * 0.85))
            if any(g[x, y] < 90 for y in range(3))]
    if not hits:
        return 0
    dark, run = [], [hits[0]]
    for x in hits[1:]:
        if x - run[-1] <= 3:
            run.append(x)
        else:
            if len(run) > len(dark):
                dark = run
            run = [x]
    if len(run) > len(dark):
        dark = run
    # The whole tab, plus a margin: the moulding is rounded and its edge fades
    # out over several pixels, and a fill that stops at the last black pixel
    # leaves that grey outline behind, which reads as a shape drawn on the
    # header rather than as header.
    PAD = 6
    x0, x1 = max(0, min(dark) - PAD), min(W - 1, max(dark) + PAD)
    depth = 0
    for x in dark:
        y = band - 1
        while y > 0 and g[x, y] > 200:
            y -= 1
        depth = max(depth, y)
    depth = min(H - 1, depth + PAD)
    # Rebuilt across rather than down, the way the header runs: these toolbars
    # are uniform left to right, so the two ends of each row carry everything
    # needed to close the gap between them.
    for y in range(depth + 1):
        left, right = px[x0, y], px[x1, y]
        span = x1 - x0
        for x in range(x0 + 1, x1):
            f = (x - x0) / span
            px[x, y] = tuple(round(a + (b - a) * f) for a, b in zip(left, right))
    return x1 - x0

for path, out_name, quad, w, h in plan:
    im = Image.open(path).convert("RGB")
    c = coeffs([(0, 0), (w, 0), (w, h), (0, h)], quad)
    out = im.transform((w, h), Image.PERSPECTIVE, c, Image.BICUBIC)
    notch = drop_notch(out)
    out.save(f"{OUT}/{out_name}.png", optimize=True)
    print(f"wrote  {out_name}.png  {w}x{h}" + (f"  (closed a {notch}px notch)" if notch else ""))
`;

if (!existsSync(SRC)) {
  console.error(`No source directory: ${SRC}`);
  process.exit(1);
}
try {
  console.log(execFileSync("python3", ["-c", py], { encoding: "utf8" }).trimEnd());
} catch (err) {
  console.log(err.stdout?.trimEnd() ?? "");
  process.exit(1);
}
