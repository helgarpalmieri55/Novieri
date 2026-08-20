---
target: the Novieri website (novieri.com)
total_score: 22
max_score: 40
na_heuristics: 
p0_count: 2
p1_count: 3
timestamp: 2026-08-20T09-21-18Z
slug: the-novieri-website-novieri-com
---
Method: dual-agent (A: design review, 24 URLs both locales · B: detector + browser evidence, 8 pages)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | The CTA promises "Book a 30-minute consultation"; the scheduler opens defaulted to **15 minutes**, with nothing marking the downgrade. |
| 2 | Match System / Real World | 2 | A browser with an English system locale requesting any Spanish URL is rewritten to English — measured: `/es` → `/`, `/precios` → `/pricing`. The Spanish site is unreachable to exactly the phones Colombian SMB owners carry. |
| 3 | User Control and Freedom | 2 | The cookie banner is `role="dialog"` but never enters the first 22 tab stops; a keyboard user cannot dismiss the thing covering the primary CTA. |
| 4 | Consistency and Standards | 1 | "Book a call" resolves to both the calendar and the contact form. In Spanish "Agendar llamada" → calendar, "Agenda una llamada" → `/contacto`. 13 labels, 2 destinations. |
| 5 | Error Prevention | 2 | Consent checkbox still **13×13px** — 54% of the WCAG 2.5.8 minimum. Third critique in a row reporting it. |
| 6 | Recognition Rather Than Recall | 2 | Plan tiers diverge across locales: Core/Complete/**Premium** vs Esencial/Completo/**Cumplimiento**; ES also sells ISO 27001 readiness that EN does not. |
| 7 | Flexibility and Efficiency | 2 | The self-diagnostic costs 20 taps — 10 answers, 10 "Next", no auto-advance on single-select. |
| 8 | Aesthetic and Minimalist Design | 3 | 27 (EN) / 29 (ES) nav destinations behind 7 hover triggers; five service pillars against a four-pillar brief. |
| 9 | Error Recovery | 2 | "Email must be formatted correctly." renders **twice**, and the invalid field keeps its normal `rgb(233,230,238)` hairline — nothing marks which of 9 fields failed. |
| 10 | Help and Documentation | 3 | Strong pricing FAQ, diagnostic, demo disclaimers. Undercut by `/insights`: **one heading on a page listing 10 articles** — card titles are `<span>`, so a screen-reader rotor returns a single item. |
| **Total** | | **22/40** | **Acceptable (55%) — honest content on a chassis with two blocking defects** |

## Design Specificity Verdict

**Still about a third theirs. The fraction has not moved since August 9; the quality inside it has.**

Genuinely Novieri's: the bespoke gem SVG driven by exactly four infinite keyframes and nothing else — no particles, no parallax; the gold `··` motif used as eyebrow and card marker; the WhatsApp proof section with a named fictional restaurant and an "illustrative demo" tag; the pricing pages, which publish ranges as hairline rows with no cards, no shadows, no "most popular" ribbon; and copy that could not be swapped in ("Two founders, and nobody in between", "Security priced by scope, not by fear").

Category costume: the white hero. DESIGN.md's owner-approved direction is `dark hero → gradient seam → white sections`, header always on black, inner pages opening on a compact dark band. None of it shipped. The dark stage was the differentiator — the gem reads as a jewel photographed in a laboratory on black, and as a nice SVG on white. Also: a `bg-white/90 backdrop-blur` header (glassmorphism, a named anti-reference, and it visibly bleeds body copy on `/precios`); a 7-trigger mega-menu; flag-emoji language switching; and `.chat-fab`, a plum gradient pill with `box-shadow: 0 6px 22px` — the only drop shadow on the entire site, against a brief whose second principle is "depth from borders, not shadows".

**Deterministic scan.** CLI: 8 findings, of which **4 are genuine** — a `transition: width` on the diagnostic progress bar, a bounce easing in the audio module, a `border-left` side-tab in the legal prose. The other 4 match Tailwind utility definitions that nothing on the site uses: dead CSS shipped to every visitor. Browser pass across 8 pages: 217 findings, **152 genuine**. The largest block — `nested-cards` ×32 — is one false positive reproduced and confirmed: the detector's `isCardLike` regex `/\bborder\b/` matches Tailwind's `border-b`, so `<header>` registers as a card and every hidden mega-menu panel inside it as "nested". All 32 carry the detector's own `isHidden: true`.

**Visual overlays:** none. This session has no browser the user can see; findings are console and measurement output only.

## Overall Impression

The chassis defects from the last two critiques are genuinely fixed — sticky header, favicons, the banned ticker, heading order, hreflang, the font 404s, the `<title>` that said "Home". Six clean, and the fixes hold under measurement. What the score barely moved on is that two new blocking problems now sit in front of the conversion path, and both were invisible until someone measured the *journey* instead of the *page*.

The single biggest opportunity: **the funnel's first, middle and last moments are all owned by surfaces nobody designed.** A cookie banner covers the primary CTA on every viewport in both languages. A language redirect throws Spanish-URL visitors onto the English site. The booking calendar defaults to half the duration the button promised and greets Spanish visitors in English. The pages are good. The seams between them are where the visitors are lost.

## What's Working

1. **`prefers-reduced-motion` is implemented properly, which is rare.** Under `reduce`: 0 running animations, 0 of 38 reveal elements left hidden, `scroll-behavior` drops to `auto`. Most sites that add scroll reveals strand reduced-motion users on a blank page.
2. **The carousel is gone and nothing replaced it.** Zero marquees, sliders, horizontal-scroll containers or auto-advancing anything across 24 pages. Four infinite animations total, all on the gem. Restraint held.
3. **The keyboard path through the mega-menu actually works** — focus flips the submenu visible and Tab walks all five children in order. Contrast is near-clean: exactly 3 failures site-wide, all the same 11.5px label class at 3.95:1.

## Priority Issues

**[P0] An English-locale browser cannot reach the Spanish site.**
Measured with a clean context: requesting `/es` with `en-US` lands on `https://www.novieri.com/` serving English; `/precios` lands on `/pricing`. No 3xx appears — the rewrite is client-side. `curl` returns correct Spanish 200s, so the origin is right and only browsers are redirected. Colombian Android handsets very commonly run an English system locale. Every Google result, ad click and shared link into the Spanish site silently delivers English to the audience the Spanish site exists for — and it defeats the hreflang cluster that was just repaired.
*Fix:* the redirect must respect an explicit path. A visitor who asked for a Spanish URL has stated a preference; only redirect when the visitor landed on a locale-neutral route with no stored choice.
*Command:* `/impeccable harden`

**[P0] The cookie banner buries the primary CTA, on every page, in both languages, on both viewports.**
Desktop 1440×900: the banner spans `y 647–880`, the hero CTA `y 693–743` — covered. Mobile 390×844: banner `y 521–832`, CTA `y 606–654` — fully buried, and the banner occupies 37% of the viewport and also covers the Atena bubble. It is `role="dialog"` at DOM index 566 of 607 and never enters the first 22 tab stops, so it cannot be dismissed from the keyboard.
*Fix:* a slim top bar, or a bottom-left card clear of the CTA column; cap it at ~180px on mobile; give it real dialog semantics with autofocus, or drop the dialog role.
*Command:* `/impeccable layout`

**[P1] "Book a call" means two different things.**
The same label resolves to `meetings.hubspot.com` in the header and to `/contact` on `/industries/bpo`. Spanish is worse: near-homographs "Agendar llamada" (calendar) and "Agenda una llamada" (form). Counted: EN 5 calendar labels + 5 form labels; ES 5 + 8. Separately the calendar opens on 15 minutes when the button said 30.
*Fix:* two verbs, no overlap — calendar is always "Book a call"/"Agendar llamada", form is always "Send us a message"/"Escríbenos". Default the scheduler link to 30 minutes so the label stays true.
*Command:* `/impeccable clarify`

**[P1] `/es/insights` is an orphan carrying four regressions at once.**
It is the only page whose header is `position: sticky` and scrolls away (`top: -1500` at `scrollY 1500`); the only page missing `x-default`; it has zero links to the calendar; and its `<h1>` is the raw `<title>` string, brand suffix included — "Guías y recursos — Novieri". Separately, `/industrias/pymes` and `/industrias/restaurantes` return **zero** `<link rel=alternate>` and have no language switcher at all.
*Fix:* repoint that template at the partials the EN listing uses; write a real h1; add the CTA band; give the switcher a designed behaviour for "no counterpart exists".
*Command:* `/impeccable harden`

**[P1] Mobile targets: 23 of 28 interactive elements are under 44px.**
With the menu open, 19 of 28 links measure 19–21px tall — including every service and industry destination and both language links. The header "Book" pill is 34px. The consent checkbox is 13×13px, reported in all three critiques and never fixed. The menu trigger passes at exactly 44×44.
*Fix:* `min-height: 44px` on every mobile nav row, the header CTA and the cookie buttons; style the consent checkbox to 24px minimum.
*Command:* `/impeccable adapt`

**[P2] The approved visual centrepiece was never built.**
DESIGN.md specifies a dark hero, a gradient seam, a header on black. The site is light throughout. This is the whole answer to "could a competitor ship this with a logo swap", and right now the site and its own design contract disagree.
*Fix:* build the dark hero for the two home pages and measure — or amend DESIGN.md and make the light hero a documented decision. Every future critique will otherwise keep re-finding this gap.
*Command:* `/impeccable bolder`

## Persona Red Flags

**US startup ops lead, three vendor tabs open.** Second tab gets a clean first impression; this one gets a consent chore over the CTA. She clicks "Book a 30-minute consultation" and lands on a 15-minute default — first measurable promise, first measurable miss, from a vendor selling operational reliability. On `/pricing` she reads "Discovery sprint — **500** fixed", a price with no currency symbol on the page that exists to prove precision. She hovers Products: seven, unranked, beside five unranked services, and cannot tell whether this is an MSP with side projects or a product company with a services arm.

**Barranquilla SMB owner, Android phone.** 37% of his screen is a cookie notice on arrival; the gem — the entire premium argument — is below the fold. If his handset runs an English system locale, the Spanish link he was sent redirects him to English and his own language switcher will not hold. He taps for "Restaurantes" and hits a 19px target. If he reaches that page, it has no language switcher at all. He finishes the 20-tap diagnostic, is told his company scores "Initial · 20/100", and is then asked for four fields to receive a PDF — with **no booking CTA anywhere on the result screen**, at the highest-intent moment on the site.

## Minor Observations

- The largest asset on the home page is `novieri-isotipo-color.svg` at **123 KB raw / 49 KB gzipped** — a logo outweighing everything else. Page total is a healthy 325 KB / 40 requests with zero render-blocking resources, so this is the one obvious win.
- **Line length runs to 197 characters** on the pricing caption and 110 in article body copy. The mechanism is a unit mistake: Tailwind's `ch` measures the `0` glyph, which is far wider than average in Satoshi, so `max-w-[68ch]` renders at 104–108 actual characters. Article `<p>` has no max-width at all.
- 18 elements render at **11.5px**, and those same elements are the site's only three contrast failures (3.95:1).
- `"Consultoria IT"` is missing its accent on every Spanish page. `"Contact center"` is an English nav label pointing at a page titled "BPO y centros de contacto".
- Title Case is used for six Spanish product names against a brand rule of sentence case everywhere — and Spanish orthography doesn't title-case common nouns at all.
- Top-nav focus rings are `--ink-muted`, not the plum accent every other control uses.
- The EN contact form has no placeholders; the Spanish one does. Parity inverted.
- Atena's four opening chips do not include booking a call — the sitewide success action.
- `/favicon.ico` still 404s; no `<link>` points at it, so only legacy root-probing clients are affected.
- The 404 page returns a correct HTTP 404 status, and is English-only with one escape link.
- On `/es` a badge overflows its container by 68.7px and is clipped — the Spanish string is longer and `flex-none` prevents shrinking.

## Questions to Consider

1. The dark hero was approved and does not exist. Was it cut deliberately, or did it never get built? Every point in the specificity gap traces back to that one decision.
2. Why does the highest-intent screen on the site — the diagnostic result — offer a PDF instead of a call?
3. The brief names four pillars in strict priority; the site ships five, unranked, beside seven unranked products. What is Novieri selling first, and can a visitor tell from the navigation?
4. Who owns the design of the parts of the funnel that aren't pages — the banner, the chat bubble, the scheduler? They own the visitor's first, middle and last moments, and none of them fully speaks the brand or the language.
