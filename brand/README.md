# Brand guidelines

`Novieri-Brand-Guidelines.pdf` — ten pages, Letter, with the four brand faces
embedded and subset.

## Regenerating

```
python3 brand/build.py     # HTML from template + live tokens
node brand/topdf.mjs       # HTML -> PDF via Chromium
```

`build.py` reads the palette straight out of `src/app/tokens.css` and computes
every WCAG contrast figure at build time. Nothing in the document is a
transcribed hex value or a remembered ratio, so the PDF cannot quietly drift
from what the site actually ships — change a token, rebuild, and the swatches
and the ratios both follow.

`_fonts.css` and `_mark.svg` are generated inputs: the six woff2 faces
base64-inlined, and the logo. Regenerate them if either changes.

## Known and deliberate

DejaVu Sans appears in the PDF's font table alongside the four brand faces. It
is Chromium's fallback and carries a small number of glyphs the brand fonts do
not include. Do not remove it.
