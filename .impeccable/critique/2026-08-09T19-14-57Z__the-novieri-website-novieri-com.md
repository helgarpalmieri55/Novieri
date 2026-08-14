---
target: the Novieri website (novieri.com)
total_score: 19
max_score: 36
na_heuristics: 9
p0_count: 0
p1_count: 3
timestamp: 2026-08-09T19-14-57Z
slug: the-novieri-website-novieri-com
---
## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 2 | The sticky header does not stick on any page — measured `rect.top` tracks `−scrollY` exactly from the first pixel, so location is lost after one screen. `favicon.ico` 404s on all ten page loads. |
| 2 | Match System / Real World | 3 | Voice is excellent and locale-native. Undercut by an English label — "How many people are affected?" — sitting in the Spanish contact form, and by Managed IT appearing as *TI administrada*, *IT Administrado* and *IT Administrado* in one session. |
| 3 | User Control and Freedom | 2 | The hero eyebrow ticker cannot be paused or stepped. The chat bubble cannot be dismissed. The mobile menu vanishes on scroll along with the header. |
| 4 | Consistency and Standards | 1 | Five labels for one action: "Book a call", "Book", "Book a 30-minute consultation", "Book a demo", "Open the booking calendar". `<title>` of the English home page is still `Home`. "Cookie settings" appears twice in the EN footer; in ES the same two slots read *Configurar cookies* and *Preferencias de cookies*. Four pillars in the brief, five cards on the site. |
| 5 | Error Prevention | 2 | Nine inputs, only `email` required, no optional/required marking. The consent checkbox measures **13×13px**. |
| 6 | Recognition Rather Than Recall | 2 | The rotating eyebrow means the pillar you read is not the pillar on screen. Tiers are Core/Complete/Premium in EN and Esencial/Completo/Cumplimiento in ES — a bilingual buyer comparing tabs cannot map them. |
| 7 | Flexibility and Efficiency | 1 | The one success action costs two navigations and a scroll. Every `<a>` on `/` and `/es` was enumerated: **no direct calendar link, no `wa.me`, no `tel:`**. The only channels are the form and `mailto:`. |
| 8 | Aesthetic and Minimalist Design | 3 | The type system is now genuinely excellent — all three brand faces confirmed rendering. Undercut by two metric blocks, the gem halo, the gradient chat bubble, and six full-bleed bands whose right 40–50% is empty. |
| 9 | Error Recognition and Recovery | n/a | Neither form was submitted, so no validation, error or success state was observed. Not verified — scoring it would be inventing a number. |
| 10 | Help and Documentation | 3 | Outstanding: pricing FAQ, "How to read these numbers", the diagnostic, per-clip transcripts, explicit demo disclaimers. Held back because the fine print is the site's lowest-contrast, smallest type. |
| **Total** | | **19/36** | **Acceptable (53%) — the honest copy is carried by a broken chassis** |

## Design Specificity Verdict

**Roughly a third theirs, two thirds swappable.** The writing is unmistakably Novieri's; the composition is a competent Linear-derivative another nearshore firm could ship with a logo swap.

**Genuinely theirs:** the WhatsApp console (a Barranquilla marisquería, a voice note, `✓ booking created · #1284 · 4 guests · 8:00 PM · terrace`, then a dietary flag routed to the kitchen); the `nov|ieri` wordmark band splitting the two surnames in plum and gold; the Barranquilla time-zone paragraph; and the pricing pages. The honesty furniture — "Real client, anonymous by agreement", "Casa Marina is a fictional restaurant", "all-party-consent jurisdictions like Florida" — is a voice nobody else in this category has.

**Category-interchangeable:** the 3-up stat strip, the hairline card grid with mono pill tags and a `Learn more →`, the `01 — 04` numbered process row, the FAQ accordion, the four-column footer. The brief asked for Linear-like *precision*; what shipped is Linear-like *components*. Precision is a property of grid and type; component vocabulary is a costume, and right now the costume is doing more work than the tailoring.

**Brief violations, checked specifically.** The hero eyebrow **auto-rotates all five pillars** at ~2.7s with no pause and no controls — a carousel wearing a mono label, on a site whose brief bans carousels, and it fails WCAG 2.2.2. It also destroys the "strict priority order": one load opened on *Cybersecurity & compliance*. The **hero-metric strip** is the named anti-reference, shipped twice. A soft radial **halo** sits behind the gem on every hero, and the chat bubble is a plum→pink **gradient fill** with a cast shadow, against a brief that says depth comes from 1px borders and gradient is never a fill. The `··` motif now carries five jobs on the home page alone; a signature repeated five times per screen stops being a signature.

**Deterministic scan.** CLI: 102 findings across 16 live routes, but **80 of them are one false positive** — `isCardLike()` tests `/\bborder\b/` and `/\bbg-white\b/`, so Tailwind's `border-b` and `bg-white/90` make `<header>` itself register as a card and everything bordered inside it "nested". Reproducing the heuristic in a live browser found 9 innermost hits, all in shared chrome, **none in page content**, and the flagged dropdowns measure `visibility: hidden; opacity: 0` at rest. A further 15 `codex-grid-background` hits are also false: the rule describes a tiled hairline *line-field*; the actual CSS is an `aria-hidden` radial *dot* field, further masked. Genuine and worth fixing: **6 `skipped-heading` h1→h3** on the six index pages, one `marketing-buzzword` on About ("Founder-led service, enterprise-grade execution"), and a real `transition: width` at `audio-demo.module/module.hubl.css:81`. Source markup is clean — 48 `.hubl.html` files, zero findings.

Browser rule pass: 146 findings — `ai-color-palette` 32 (mostly the 1440×2px brand hairline, a false positive), `wide-tracking` 22, `nested-cards` 20 (same FP), `tiny-text` 17 at 11.5px, `line-length` 17 including a **199-character line** in the credibility strip, `radial-spotlight-glow` 4 — the brief's own banned glow, found independently.

**Visual overlays.** Injection succeeded on all five pages — CSP is `upgrade-insecure-requests` only, the live server came up on 8400, `detect.js` loaded and exposed eight globals. But this ran headless with nobody at a browser tab; the findings were read from console messages and return values, not seen. **There is no overlay for you to look at.** One genuine obstacle worth recording: an in-page `fetch('http://localhost:8400/...')` fails on every page, because `upgrade-insecure-requests` rewrites it to https.

## Overall Impression

The fonts are fixed and it shows — the type system is now the strongest formal thing on the site, and one finding from the last run (the `/es` wordmark colliding with the nav) resolved by itself, confirming it was a symptom of the 404s rather than a layout bug.

What's left is a pattern: the *copy* is honest, specific and better than anyone else in this category, and the *chassis* under it keeps failing. The header doesn't stick on any page. The mobile menu's booking button renders at 1.31:1. Every "Book a call" goes to a form. There is no WhatsApp link at all, on a site whose brief names WhatsApp as the warm channel for half the audience. The English home page still has no title.

None of that is a design problem. It is a small number of concrete defects, each cheap, sitting directly on the conversion path.

## What's Working

1. **The pricing pages are the strategy, executed.** Five categories, real ranges, mono units, hairline rows, a "Most teams land here" nudge, and a dark band explaining what moves a number. The *format* carries the argument: a table of ranges is structurally an admission of uncertainty, which is exactly the trust posture the brief asks for. A card grid with a "Contact us" tier would have said the opposite.

2. **The WhatsApp console is an argument, not a decoration.** Every element is falsifiable — business name, booking ID, guest count, table, dietary flag routed to the kitchen — and it is labelled `illustrative demo`. It shows the whole loop in the space a stock hero would have wasted, in the register of the Spanish audience.

3. **The accessibility floor is real, and the fonts now land on it.** All six faces confirmed rendering by CDP glyph inspection — **zero `[system]` fallback glyphs on any measured element**, where the last run found all six 404ing. 25 of 25 tab stops carry a visible focus ring at 4.65:1. `prefers-reduced-motion` takes 14 animations and 41 running animations to **zero**. One h1 per page, no skipped levels, on all five measured pages.

## Priority Issues

No P0s by the strict definition — nothing blocks task completion outright. Ordered by business impact.

**[P1] The mobile menu's booking button is invisible.** `rgb(85,77,96)` on `rgb(79,52,97)` = **1.31:1** against a 4.5:1 requirement, both locales, full opacity after settle, a 350×46 button. Verified independently twice.
*Cause, found:* one legacy rule, `.site-nav a, .site-mobile-nav a { color: var(--color-ink-muted) }`, whose own comment claimed it had been deleted. Element+class outranks a single utility class, so it also flattened the menu's two-level hierarchy and overrode `text-ink` on the desktop active nav item — which is why no nav item has ever looked like the page you are on, a symptom both runs reported without a cause.
*Status:* fixed and committed, deploy held until this run finished measuring.

**[P1] The sticky header does not stick, on any page.** `position: sticky; top: 0` computes correctly, but `rect.top` tracks `−scrollY` exactly from the first pixel. On the 12,044px Spanish mobile home page the booking button is on screen for 6% of the scroll and never again.
*Cause, now isolated:* not an `overflow` or `transform` ancestor — every ancestor was checked and none has one. The header's parent `div#hs_cos_wrapper_site_header`, HubSpot's own module wrapper, computes `height: 85px`, identical to the header, as does its parent. A sticky element cannot travel outside its containing block, so it leaves with the 85px wrapper.
*Fix:* give the wrapper chain `height: auto` (or `display: contents`) from the theme's CSS, then assert `top` stays 0 at `scrollY 4000` on every template.

**[P1] "Book a call" does not book a call, and WhatsApp does not exist.** Every booking control resolves to `/contact` or `/contacto`. The real calendar is reachable only from a card at y=725 (EN) / y=910 (ES) — below the fold, after nine form fields in reading order — and opens in a new tab with no warning. Every `<a>` on both home pages was enumerated: **no `wa.me`, no `tel:`**. For a Barranquilla owner, no WhatsApp reads as "not really local".
*Fix:* point every booking control at the scheduler, or embed the meetings widget as the *left* column of `/contact` with the form demoted underneath. Add a `wa.me` link and a `tel:` to the Spanish footer.

**[P2] `/products/ai-virtual-assistant` scrolls sideways 195px at 390px wide.** `scrollWidth` 585 vs 390. The audio grid's implicit track resolves to **564.922px inside a 350px container**; setting `grid-template-columns: minmax(0,1fr)` drops it to 390 immediately. Source: `audio-demo.module/module.hubl.html:30`.

**[P2] The home page ships its largest asset twice.** `novieri-isotipo-color.svg` is requested **two times** on both `/` and `/es`, at both viewports — 48.5 KB transferred each, ~97 KB of a 412 KB page. It also carries no `width`, `height` or `loading` attribute and renders at 345×345 from a 264×269 intrinsic. Separately, `favicon.ico` **404s on all ten page loads**, and a 20×20 PNG never decodes (`naturalWidth 0`, `complete: false`) on every page.

## Persona Red Flags

**Jordan (first-timer, EN).** Clicks the header "Book a call", lands on "Tell us about your case." with nine fields and no calendar in sight — so he fills the form, because that is what the page appears to be. The booking card sits at y=725 on a 900px viewport, beside the thing he is already typing into. Before that, what he thinks Novieri does was set by whichever pillar the ticker happened to be showing; one load opened on *Cybersecurity & compliance*, three items from the lead service. The hero `2` reads as a rendering error until he finds `founders, zero middlemen` beneath it.

**Riley (stress tester).** Tabs the header and finds the four dropdown panels **never enter the tab order** — every product and industry page is keyboard-unreachable from the nav. Reads the fine print under the metric strip and learns `1000+` and `12+` are career totals, not Novieri's book, deflating the hero's strongest claim. Checks the EN home tab title: **`Home`**. Follows a stale `/es/precios` link and gets a **404 rendered in English** with `lang="en"`. Opens DevTools and finds `favicon.ico` 404ing and the hero SVG fetched twice.

**Casey (one-handed, 390px).** The only always-visible control is the chat bubble, and it overlaps content on nearly every screen — including the word "answering." in *"While you read this, our agents are answering."* It cannot be dismissed. The header CTA reads **"Book"** — a verb with no object. Opening the menu, the booking button is unreadable at 1.31:1. Scrolling, the menu and header vanish together for the remaining ~11,000px.

**Marcela, 25-person distributor in Barranquilla (project persona).** Told "these are serious people from here." She looks for WhatsApp: **there is none** — no `wa.me`, no `tel:`, no number in the footer. Her options are a web form and an email address, and she will not email. She fills the form and hits **"How many people are affected?" in English**. The footer says `© 2026 Novieri SAS` with no NIT and no razón social — the two identifiers a Colombian buyer checks before wiring money. She wants the founders, whom the brief says she is buying: the home page gives her the wordmark and a paragraph; their faces are two ~76px thumbnails on `/nosotros` with mismatched crops.

## Minor Observations

- EN home `<title>` is still `Home`. ES titles use a third pattern (`… | Novieri`) against the site's `… — Novieri`.
- `/es/precios`, `/es/servicios`, `/es/nosotros` all 404 — correct, they were never routes — but **the 404 page is English-only**. Spanish URL architecture is genuinely mixed: home at `/es`, articles at `/es/insights/*`, everything else at root.
- The language switcher uses flag emoji. Flags denote countries, not languages, and they are the only bitmap colour on a page whose first law is "the logo is the law".
- Header says `Recursos`; footer says `Recursos y Guias`, missing its accent. `Consultoria IT` likewise.
- On `/products/ai-virtual-assistant` the fourth audio title truncates mid-word; the first clip's duration reads `0:00` while the others read real times; four `.mp3` requests `ERR_ABORTED` under `preload="metadata"`.
- On `/about`, two adjacent **dark** bands are separated by the teal→plum→gold seam, which DESIGN.md reserves for dark↔light transitions.
- On `/pricing` the FAQ block starts at x≈338 while every other section starts at x≈148 — a broken left edge on an otherwise rigorous grid.
- `/contact` is 498 KB transferred, 924 KB decoded; `/_hcms/forms/v2.js` alone is 202 KB of it. HubSpot platform code, not theme code.
- 14 distinct font sizes on the home page — 17 in July, 13 last run, 14 now. Holding, not improving.
- Seven contrast failures, all inside the WhatsApp mock reproducing WhatsApp's own palette. Every other text node on all five pages passes AA at both viewports.
- Confirmed resolved since the last run: the `/es` wordmark no longer collides with the nav — measured at 1440, 1366 and 1280, zero overlap. It was a symptom of the font 404s. ES clearance is now 24px (exactly the flex gap) against EN's 133px, so it is tight rather than broken, and the ES header CTA wraps to two lines at 1440.

## Questions to Consider

1. **If the pricing table is the best thing you have — and it is — why is it sixth in the nav instead of the second section of the home page?** You are burying your only structural advantage behind a stat strip you copied from the competitors it beats.
2. **What if "Book a call" opened the calendar and `/contact` did not exist?** Booking is the one success action; the form is a hedge. What breaks if the only two options are "pick a time" and "message us on WhatsApp"?
3. **The most persuasive sentences on the site are its disclaimers,** and they are set in the smallest, faintest type available. What happens if honesty is the headline rather than the footnote?
4. **Six bands are half empty and the eyebrow rotates.** Both are symptoms of one thing: the layout has more room than content, so motion filled the time and whitespace filled the space. What would the page look like at two thirds the height with nothing moving?
5. **The brief says four pillars in strict priority order. The site ships five, in a rotating ticker, in a 3+2 grid.** Which is wrong — the brief or the build? Answering that fixes the nav, the grids, the footer column and the ticker in one decision.
