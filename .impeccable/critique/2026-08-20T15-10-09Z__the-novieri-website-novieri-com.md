---
target: the Novieri website (novieri.com)
total_score: 28
max_score: 40
na_heuristics: 
p0_count: 2
p1_count: 3
timestamp: 2026-08-20T15-10-09Z
slug: the-novieri-website-novieri-com
---
Method: dual-agent (A: design review, 90 sitemap URLs, 5 phone widths · B: detector + browser evidence, 8 pages + 90-URL sweeps)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Fixed header keeps the CTA visible from every pixel. Chat send button reads disabled at rest; consent confirms only by disappearing. |
| 2 | Match System / Real World | 3 | EN blog h1 is "Insights" where ES is "Guías y recursos" — the Spanish name matches the voice guide, the English one is the jargon it forbids. |
| 3 | User Control and Freedom | 3 | Cookie choice reopenable, no modals, no scroll-jacking. Two differently-named Spanish cookie controls; the calendar is a hard context switch with no return. |
| 4 | Consistency and Standards | 2 | The banner says less on mobile than desktop; the stat strip claims different things in each language; `··` dropped on article eyebrows; nav focus ring is ink-muted where every other is plum; every apostrophe on the site is straight. |
| 5 | Error Prevention | 3 | Only email is required; consent is explicit opt-in; the chat pre-empts credential sharing. Nine of ten form fields carry no optional marker. |
| 6 | Recognition Rather Than Recall | 3 | Pricing published, not gated; mega-menu exposes everything. All 58 booking links land on one context-free calendar, so a "demo" click arrives as a generic slot. |
| 7 | Flexibility and Efficiency | 3 | One click to the calendar from any page. No per-plan CTA on pricing; ten blog cards share one date. |
| 8 | Aesthetic and Minimalist Design | 3 | Measured: 0 videos, 0 carousels, 0 logo bars, 0 stock photos, 0 gradient-text, 5 images sitewide, and the only box-shadow on the site is the chat bubble's. Undercut by that shadow and by header glassmorphism — both named anti-references. |
| 9 | Error Recovery | 2 | Form errors render twice (17px ink, 13px red), the invalid field's border does not change, and `aria-invalid` is null. The only red on the site is a HubSpot default; the palette has no error token. |
| 10 | Help and Documentation | 3 | The cookie policy is exemplary; articles cite named sources; pricing explains what moves each range. The privacy URL prints as a bare literal string in body copy. |
| **Total** | | **28/40** | **Good (70%) — the largest jump of the five runs** |

## Design Specificity Verdict

**~55% authored, up from ~45%, and both the gain and the ceiling have addresses.**

Genuinely Novieri's: the gem; the Clash/Satoshi/JetBrains type system with `··` eyebrows and `··01` indices; the Atena panel — dark ground, gold `·· novieri` at 8.77:1, hairline chips, an honest "AI answers can be wrong" line; the reconstructed WhatsApp thread built from real client colours rather than a screenshot; five images sitewide and not one of them stock; and copy that measures **zero exclamation marks and zero buzzwords from an eleven-term list**, with a cookie policy containing the sentence "Two things happen before you answer, and we would rather write them down than let you discover them."

The ceiling is one composition. **The same inner hero ships about 25 times** — eyebrow, headline, a 34ch paragraph, one plum button, packed left, right 40% empty but for a dot grid. Measured hero heights on the five service pages: 774 / 698 / 667 / 743 / 698px — up to 86% of a 900px viewport for four elements.

And **the per-pillar accent is in the contract and not built.** All five service pages measure the same eyebrow `rgb(119,97,60)` and the same plum button. DESIGN.md specifies AI=plum, Managed IT=teal, Security=gold, Software=ink. `--teal` appears as an accent on the Managed IT page zero times. Four pillars, one colour.

**Deterministic scan.** CLI: 2 findings, both re-verified false positives — a 2px `border-left` on a legal-prose note (the rule wants thick stripes on cards) and a `bounce-easing` match on an animation *name* whose timing function is `ease-in-out` and which is reduced-motion gated. Browser pass: 166 findings across 8 pages, **91 of them (55%) reproduced false positives** with mechanisms confirmed at source — `nested-cards` ×32 all `isHidden: true` (`/\bborder\b/` matching Tailwind's `border-b` makes `<header>` a card), `ai-color-palette` ×38 mostly the 1440×2px brand seam scored as a full-bleed wash, `text-overflow` ×2 on elements carrying Tailwind's `.truncate` (where `scrollWidth > clientWidth` is the intended state), `gray-on-color` ×2 measuring 6.77:1.

## Overall Impression

The chassis is now genuinely sound: one h1 and zero heading skips across all 90 sitemap URLs, zero non-reciprocal hreflang pairs, zero genuine contrast failures across 44 page/viewport/locale combinations, reduced-motion taking 13 running animations to 0 with `.reveal` opacity landing at 1 rather than stranding content, and all six brand fonts loading. That is a floor most sites never reach.

What is left divides cleanly into two piles. One is **the consequences of this week's own fixes** — three of the priority issues below were introduced by changes made in the last twenty-four hours. The other is **one composition and one colour rule**, both already written down in DESIGN.md and neither built.

## What's Working

1. **The accessibility floor was designed, not retrofitted.** One decorative contrast failure across 44 combinations. `prefers-reduced-motion` collapses animations to zero *and* sets `.reveal` opacity to 1 — content becomes immediately visible rather than stranded, which is the failure mode most animated sites ship. Keyboard focus reveals IntersectionObserver content correctly.
2. **The copy holds under measurement.** Zero exclamation marks, zero buzzwords, articles citing named government sources, pricing publishing thirteen real ranges with what-moves-them, and a legal document written in the brand's voice.
3. **Booking-verb discipline is now complete.** Every meeting-promising label sitewide — 58 links across 14 product pages, 20 articles, both indices, both pricing and both contact pages — resolves to the calendar. Zero `Request a demo` or `Book a conversation` detours remain.

## Priority Issues

**[P0] The `1000+` claim now says two different things in two languages.** English: "users supported in founder-led operations". Spanish: "**Experiencia** dirigiendo operaciones tecnológicas". With the disclaimer removed, the Spanish label kept its qualifier and the English one lost its only one — so the same number reads as prior experience in one locale and current clients in the other, two columns from "2 / founders, zero middlemen". *Fix:* give the English label the qualifier the Spanish one already has, then reconsider the format — this is a proof line, not a metric strip, and as a strip it is also the brief's first named anti-reference.

**[P0] The cookie banner discloses less on a phone than on a desktop.** Two `<p>` variants, one hidden per breakpoint. Desktop names session recording and "never advertising"; mobile names neither, in both languages. Microsoft Clarity session replay is confirmed loading after consent. The phone visitor — most of the Colombian audience — consents to session recording without the notice ever mentioning it. *Fix:* delete the short variant and ship one string at both breakpoints.

**[P1] The article fix pushed the article below the fold.** Alignment is exact — h1, every paragraph, the card and the back link all at L=400.0 W=640.0, margins 400/400. But 72px display type in a 640px measure produces a **six-line headline**, so the first body paragraph starts at y=876 on a 900px viewport: 24px of it visible. And the measure is **~83 characters, not the 75 I reported** — that figure came from one paragraph; across all fourteen the medians run 80–87 with a maximum of 91. *Fix:* give the h1 its own wider measure (880–960px, still centred on the same axis) so it lands in three lines, and either narrow the body to ~578px or raise it to 19px.

**[P1] At 320px the wordmark reads "novie"; above 375px the header row stops short of its own margin.** The wordmark span is flex-shrunk to 42.3px for text needing 90.3px and the opaque CTA paints over the overflow — Spanish loses two letters, English one. Separately, with the desktop nav hidden and `justify-content: normal`, the cluster packs left and terminates at a constant R=350.3px, so the right gutter grows 24.7 → 39.7 → 63.7 → 79.7px against a fixed 20px left gutter. *Fix:* `justify-content: space-between` below the nav breakpoint, `flex-shrink: 0; white-space: nowrap` on the wordmark.

**[P1] Pricing has no per-plan CTA, and every booking link lands context-free.** `/pricing` and `/precios` contain exactly two visible links in `<main>`, both the same hero button, across thirteen priced rows. And all 58 booking links resolve to a bare `meetings.hubspot.com/helgar-palmieri` — no meeting type, no product parameter, no prefill, so six carefully-differentiated verbs collapse into one undifferentiated arrival.

**[P2] Two named anti-references remain, both in permanent chrome.** `header.site-header` computes `backdrop-filter: blur(8px)` over 90% white — glassmorphism, under the logo, on every page. `.chat-fab` carries `box-shadow: rgba(79,52,97,0.32) 0 6px 22px` — a plum glow, and the only real box-shadow on the entire site. Everything else obeys "depth from borders" perfectly, which is what makes these two read as leaks rather than decisions.

**[P3] Per-pillar accent: specified, unbuilt.** Four pillars in "strict priority order" are chromatically identical. This is the highest-leverage specificity move available and the design contract already contains it.

## Persona Red Flags

**US ops lead, five tabs open.** `1000+` beside `2 founders` with no qualifier — she closes the tab rather than emailing to ask, and if she opens `/es` she finds a different claim. Ten articles all dated today, with the date above the title. She reaches pricing, finds real published ranges — a genuine win over the other four tabs — picks a tier, and there is nothing to click.

**Barranquilla SMB owner, Android, English system language.** He lands on English; the switch is a flag emoji at 55×21px. At 320px his first impression of the brand name is "novie". The banner on his phone never mentions session recording. The footer he'd use for the legal pages has 19px links and offers him two differently-named buttons for the same action. (Prices do reach him correctly in pesos — see the note on method below.)

## Minor Observations

- Every apostrophe on the site is straight; zero curly. On a site set in Clash Display, the cheapest craft upgrade available.
- The gradient seam now separates white from white on ~25 pages — residue from the abandoned dark-hero direction, where DESIGN.md scoped it as a structural joint.
- `/industries` lists 4 sectors, `/industrias` lists 6, and the ES home drops a card the EN home carries — two audiences of stated equal priority seeing different coverage.
- Card grids produce a dangling fourth card in a three-wide row on three separate pages.
- The footer offers "cookie settings" twice, 34px apart, wired to two different handlers, in Spanish under two different names.
- Skip-to-content is the 6th tab stop, and tab 5 focuses `<body>` — an invisible stop before the one a keyboard user came for.
- The WhatsApp mock lives on the home page; `/products/whatsapp-ai-assistant`, headed "A real product, in production", contains no picture of the product.
- Form errors render twice and the invalid field's border does not change; `aria-invalid` is null.
- `theme.css` is 12.3 KB on the wire. The largest asset on the home page is Google Tag Manager at 496 KB decoded — 2.6× the entire first-party payload.

## Questions to Consider

1. The dark stage already exists — it is the Atena panel, and it is the most on-brand component built. If the dark hero is genuinely dead, why is the seam still separating white from white on 25 pages?
2. Twenty-five pages share one hero with an empty right 40%. What is supposed to be in it? The home page answers with the gem; the pillar pages have a per-pillar accent and a piece of proof both specified and unbuilt.
3. The article fix satisfied its own success criterion — perfect alignment — and made the page worse to read. What was that criterion actually measuring?
4. Ten articles, one date. Would three with real dates and named authors convert better than ten anonymous ones?
5. Six booking verbs, one calendar. Is a context-free arrival a deliberate qualification filter, or the last thing on the list?

## Note on method — two claims that did not survive checking

The design review reported that the currency marker renders `USD` in all four combinations and that a Colombian visitor sees dollars on the Spanish page. **That is a harness artifact.** The region gate reads the browser's *timezone*, not its locale, and the review's context set `locale: es-CO` without `timezoneId`, resolving to UTC and therefore to the international branch. Verified directly: `es-CO` + `America/Bogota` → `$95.000 – 115.000 COP`; `en-US` + `America/Bogota` → the same. A real Colombian visitor gets pesos whichever language they read. The detector pass, which set the timezone, measured 13/13 cells correctly marked in all four combinations.

It did surface a genuine adjacent defect: the COP branch of the *English* page is US-formatted — `95,000 – 115,000 COP` and `1.1 – 2.5 million COP` — where the Spanish page renders the same amounts as `$95.000 – 115.000 COP` and `$1,1 – 2,5 millones COP`.

The review also treated the absence of any WhatsApp entry point as a defect against PRODUCT.md. That is an explicit owner decision — the number is given by the assistant when someone asks for a person, and is deliberately not published on any page. PRODUCT.md is the stale artifact there, not the site.
