# Assembles the brand guidelines document. Kept as a script rather than a static
# file so the palette, the type scale and the contrast figures are read from the
# same tokens the site ships — a guidelines PDF that drifts from the codebase is
# worse than none, because people trust it.
import io, re, json

TOKENS = io.open("src/app/tokens.css", encoding="utf-8").read()

def token(name):
    m = re.search(r"--%s:\s*([^;]+);" % re.escape(name), TOKENS)
    return m.group(1).strip() if m else None

def lin(c):
    c /= 255
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4

def lum(h):
    h = h.lstrip("#")
    r, g, b = (int(h[i:i + 2], 16) for i in (0, 2, 4))
    return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)

def contrast(a, b):
    la, lb = lum(a), lum(b)
    hi, lo = max(la, lb), min(la, lb)
    return (hi + 0.05) / (lo + 0.05)

def grade(r, large=False):
    if r >= 7: return "AAA"
    if r >= 4.5: return "AA"
    if r >= 3: return "AA large only"
    return "decorative only"

FONTS = io.open("brand/_fonts.css", encoding="utf-8").read()
MARK = io.open("brand/_mark.svg", encoding="utf-8").read()
MARK = MARK.replace('width="264.00" height="269.00"', '')

WHITE, BLACK = "#ffffff", token("color-black") or "#0c0a10"

INK = [
    ("ink", "Body text on white.", WHITE),
    ("ink-muted", "Secondary text, long-form prose.", WHITE),
    ("ink-faint", "Labels, meta, fine print. Large or bold only.", WHITE),
]
ACCENT = [
    ("plum", "The interaction colour. Buttons, links, focus.", WHITE),
    ("plum-deep", "Hover state for plum.", WHITE),
    ("gold-deep", "Gold where small text needs to pass AA.", WHITE),
    ("teal", "The third voice. Managed IT accent.", WHITE),
    ("gold", "The ·· motif and ornament on white.", WHITE),
]
DARK = [
    ("on-dark", "Body text on the black stage.", BLACK),
    ("on-dark-muted", "Secondary text on black.", BLACK),
    ("plum-bright", "Plum, on a dark surface.", BLACK),
    ("gold-bright", "Gold, on a dark surface.", BLACK),
    ("teal-bright", "Teal, on a dark surface.", BLACK),
]

def swatches(rows, ground):
    out = []
    for name, use, bg in rows:
        hexv = token("color-" + name)
        r = contrast(hexv, bg)
        out.append(f'''<div class="sw">
  <div class="chip" style="background:{hexv};{'border:1px solid var(--line)' if hexv.lower() in ('#ffffff','#fff') else ''}"></div>
  <div class="swb">
    <div class="swn">{name}</div>
    <div class="swh">{hexv.upper()}</div>
    <p class="swu">{use}</p>
    <div class="swc"><b>{r:.2f}:1</b> on {'white' if bg == WHITE else 'black'} · {grade(r)}</div>
  </div>
</div>''')
    return "\n".join(out)

SCALE = [
    ("text-h1", "Hero headline", "clamp — 40 to 72px", "Clash Display 600"),
    ("text-h2", "Section headline", "clamp — 32 to 52px", "Clash Display 600"),
    ("text-display-sm", "Card and panel heading", "26px", "Clash Display 600"),
    ("text-h3", "Sub-heading", "22px", "Clash Display 600"),
    ("text-h4", "Small heading, fluid", "clamp — 20 to 26px", "Clash Display 600"),
    ("text-lead", "Intros, article body", "19px", "Satoshi 400"),
    ("text-body", "Body", "17px", "Satoshi 400"),
    ("text-small", "Lists, cards, UI", "15px", "Satoshi 400"),
    ("text-caption", "Labels, fine print", "13px", "Satoshi 400"),
    ("text-micro", "Mono tags and indices", "11.5px", "JetBrains Mono 400"),
]
scale_rows = "\n".join(
    f'<tr><td class="mono">--{n}</td><td>{use}</td><td class="mono">{size}</td><td>{face}</td></tr>'
    for n, use, size, face in SCALE)

PILLARS = [
    ("AI &amp; automation", "plum", token("color-plum")),
    ("Managed IT", "teal", token("color-teal")),
    ("Cybersecurity &amp; compliance", "gold", token("color-gold")),
    ("Custom software", "ink", token("color-ink-muted")),
]
pillar_rows = "\n".join(
    f'<tr><td style="padding-top:9pt">{n}</td>'
    f'<td><span class="dotbig" style="color:{hexv}">··</span></td>'
    f'<td><span class="swatchdot" style="background:{hexv}"></span></td>'
    f'<td class="mono" style="padding-top:9pt">{key}</td>'
    f'<td class="mono" style="padding-top:9pt">{hexv.upper()}</td>'
    f'<td style="padding-top:8pt"><span class="pill" style="background:{token("color-plum")}">plum</span></td></tr>'
    for n, key, hexv in PILLARS)

html = io.open("brand/template.html", encoding="utf-8").read()
html = (html
        .replace("/*FONTS*/", FONTS)
        .replace("<!--MARK-->", MARK)
        .replace("<!--INK-->", swatches(INK, WHITE))
        .replace("<!--ACCENT-->", swatches(ACCENT, WHITE))
        .replace("<!--DARK-->", swatches(DARK, BLACK))
        .replace("<!--SCALE-->", scale_rows)
        .replace("<!--PILLARS-->", pillar_rows))
io.open("brand/novieri-brand-guidelines.html", "w", encoding="utf-8").write(html)
print("built:", len(html) // 1024, "KB")
