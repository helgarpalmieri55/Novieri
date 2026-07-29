# Design

Light-mode-only, minimalist premium. Depth from 1px hairline borders and background steps (paper → surface), never drop shadows. No gradients in UI (the logo artwork is the single gradient on the site), no glassmorphism, no glow.

## Color

All tokens as CSS variables, derived from the final logo (teal → plum → gold gradient, dark-plum wordmark):

```css
--paper:      #FAFAF8;  /* page background — near-white, whisper of warmth */
--surface:    #FFFFFF;  /* cards, elevated surfaces */
--ink:        #221B2C;  /* primary text — plum-black, from the wordmark */
--ink-muted:  #574E62;  /* secondary text (4.5:1+ on paper) */
--ink-faint:  #857D90;  /* captions, placeholders (large/label use only) */
--border:     #E8E5E1;  /* hairline borders */
--plum:       #4F3461;  /* accent — links, CTAs, interaction */
--plum-deep:  #3B2549;  /* hover / active */
--plum-wash:  #F4F0F7;  /* tinted backgrounds: tags, highlights */
--gold:       #A8875C;  /* the star, key numbers ≥24px, decorative rules */
--gold-deep:  #77613C;  /* gold for small text (AA on paper) */
--teal:       #264E59;  /* rare third voice: eyebrow labels, terminal art */
```

Rules: plum is the one interactive accent. Gold appears only where the eye should land — the two i-dots, the four-point star, one key stat per page. Teal only in mono labels and coded illustrations. If a section feels flat, fix typography/spacing, not color.

## Typography

- **Display — Clash Display** (500, 600, self-hosted): H1–H3, big statements. Letter-spacing -0.02em on large sizes. Lowercase-leaning, like the wordmark.
- **Body — Satoshi** (400, 500, 700, self-hosted): everything else, line-height 1.6–1.7, max 70ch.
- **Mono — JetBrains Mono** (400, self-hosted): eyebrows/section labels (13px, letter-spacing 0.08em), numbers, technical details.

Scale: H1 `clamp(2.5rem, 6vw, 4.5rem)` · H2 `clamp(1.875rem, 4vw, 2.75rem)` · H3 24px · body 17px · small 14px · eyebrow 13px mono. `text-wrap: balance` on headings.

## Signature motifs

1. **The two dots `··`** (from the wordmark's two i's): section eyebrows (`·· servicios`), feature-list markers. The one recurring element. Rendered in gold.
2. **The four-point star ✦** (from the logo's center): sparingly — dark CTA band, hero composition, favicon company. Never as list bullets.
3. Thin diagonal rule at the logo's angle as a section divider — max twice sitewide.

## Components

- **Buttons:** primary = plum fill, paper text, 10px radius, hover plum-deep; secondary = 1px border, ink text, hover border-plum. No shadows.
- **Cards:** surface bg + 1px border + generous padding (32–40px); hover: border → plum. No lift.
- **Eyebrow:** `·· label` — gold dots + mono ink-muted label, lowercase.
- **Header:** sticky, paper bg, hairline bottom border appears on scroll; real logo mark + wordmark.
- **Dark band:** `--ink` bg, paper text, gold star — the one dark moment per page.

## Motion

One restrained system: fade-up on scroll (12px, 400–500ms, ease-out-quart), 60ms stagger in grids; hero gets a slightly choreographed load (mark draws in / text staggers). `prefers-reduced-motion` disables everything. Content must be visible without JS.

## Layout

Max content width 1120px, gutters `clamp(20px, 5vw, 48px)`. Section padding `clamp(72px, 12vh, 128px)` — vary rhythm, tighter for connected sections. Fully responsive 360→1440px, no horizontal scroll.
