# Design

Direction (owner-approved): **"La gema viva" hero + "La consola" proof** — futuristic
premium on a white-and-black canvas with the logo's jewel accents. Dark stage moments
(hero, console demo, CTA band, footer) alternate with white engineering sections.
Reference feel: Linear-like precision; personality: premium / jewel / distinctive.

## Color

White and black carry the page; jewel accents (from the final logo) do the work on top.

```css
--white:         #ffffff;  /* light sections */
--black:         #0c0a10;  /* dark stage sections (hero, console, CTA, footer) */
--ink:           #16121d;  /* text on white */
--ink-muted:     #554d60;
--ink-faint:     #6f6880;  /* large/label use only */
--on-dark:       #f4f2f7;  /* text on black */
--on-dark-muted: #a49cb2;
--on-dark-faint: #8b8399;
--line:          #e9e6ee;  /* hairlines on white */
--line-dark:     #2b2536;  /* hairlines on black */
--plum:          #4f3461;  /* primary accent: CTAs, links (on white) */
--plum-bright:   #8d63ad;  /* plum on dark surfaces */
--plum-deep:     #3b2549;  /* hover */
--plum-wash:     #f4f0f8;  /* tags, founders panel */
--gold:          #a8875c;  /* ·· motif on white */
--gold-bright:   #c9a878;  /* gold on dark; hero highlight */
--gold-deep:     #77613c;  /* gold for small text on white (AA) */
--teal:          #264e59;  /* third voice on white */
--teal-bright:   #4f93a6;  /* teal on dark */
```

Gradient is reserved for: the logo artwork, the gem's core/facets, and 2px hairline
seams between dark and light sections (teal→plum→gold). Never on text, never as fills.

## Signature elements

1. **The living gem** (home hero): the logo's facet language rebuilt as animated SVG —
   breathing facet squares, pulsing gradient star core, rotating mono ring-text, canvas
   particle field drifting toward it, mouse parallax.
2. **The agent console**: dark terminal card with typed log lines of a real automation
   loop — home proof section and AI service page illustration.
3. **The two dots `··`**: eyebrows, list markers, index numbers (`··01`). Gold.
4. **The four-point star ✦**: gem core, marquee separators, dark-band ornament.
5. **Per-pillar accent**: AI=plum, Managed IT=teal, Security=gold, Software=neutral ink.

## Typography

Clash Display (500/600) display · Satoshi (400/500/700) body · JetBrains Mono (400)
labels/numbers/console. H1 clamp(2.5rem…4.5rem), tight -0.02em; eyebrows 13px mono
0.1em tracking, lowercase.

## Motion

- Hero: staggered rise entrance; gem breathes/pulses continuously; particles drift;
  parallax on mouse.
- Console: lines type in on loop, cursor blinks.
- Scroll: IntersectionObserver reveals (16px rise, 600ms ease-out-quart, 60–90ms
  stagger); process steps grow a gold tick.
- Hover: cards lift 4–6px + accent border/top-edge; arrows slide; buttons lift 2px.
- Marquee: infinite tech belt, ~30s loop.
- All gated by `html.js` (content visible without JS) and fully disabled under
  `prefers-reduced-motion`.

## Layout

Structure: dark hero → gradient seam → white sections → dark console proof →
white → plum-wash founders → black CTA band → black footer. Inner pages open with a
compact dark hero band (header always sits on black). Max width 1200–1240px, section
padding clamp(84px…140px), hairline borders, no shadows.

## Hero lens (video)

The hero shows **one subject, never two**. The animated logo mark is the floor:
no network, no codec, always rendered. When a clip is configured and reports it
can play, it takes the mark's place as a *lens* and the mark crossfades out.

Rejected: dropping the clip in as a rectangle. A 16:9 video in the square hero
column letterboxes into a hard black slab that breaks the white canvas and
fights the mark behind it. Also rejected: wrapping it in the dark gradient-bordered
panel used for the service illustrations — correct for those sections, but it
makes the hero heavy and repeats a pattern that should stay downpage.

The lens instead:

- square box, `object-fit: cover` (no letterbox), circular mask with a short
  feather at 59–68% so the edge reads as a lens rather than a smudge;
- a brand-gradient rim (teal → plum → gold) sitting on the visible edge,
  counter-rotating against the mono ring for depth;
- a jewel glow behind it, so the dark disc sits *on* the white canvas instead of
  being punched into it;
- `saturate(1.12) contrast(1.04)` so the clip's colour reads as jewel, not grey.

Never loaded below 1024px or under `prefers-reduced-motion`; any decode error
leaves the mark in place.
