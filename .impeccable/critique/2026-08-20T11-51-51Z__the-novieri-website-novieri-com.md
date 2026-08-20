---
target: the Novieri website (novieri.com)
total_score: 24
max_score: 40
na_heuristics: 
p0_count: 1
p1_count: 3
timestamp: 2026-08-20T11-51-51Z
slug: the-novieri-website-novieri-com
---
Method: dual-agent (A: design review, 90 URLs both locales, 5 phone widths · B: detector + browser evidence, 8 pages)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Every booking link is same-tab with no `rel` — you leave the site with no signal. Focus visible on all 26 tab stops. |
| 2 | Match System / Real World | 3 | `$99 – 115` with no currency code on `/precios` under an English-locale browser. The word "USD" appears nowhere on the site. |
| 3 | User Control and Freedom | 2 | No currency override. The whole mobile IA sat behind a hamburger measuring 20×44 in Spanish at every width 320–414 (since fixed). |
| 4 | Consistency and Standards | 1 | Three destinations behind booking verbs: `Book a call` → calendar (112/112 clean), `Book a conversation →` → form (11 articles), `Request a demo` → form (19 product URLs). |
| 5 | Error Prevention | 2 | Unlabelled currency is the most consequential preventable error on the site. Consent checkbox now 24×24, up from 13×13. |
| 6 | Recognition Rather Than Recall | 3 | Plan name at x≈175, its price at x≈1000 — 600px of white between the two things you must pair. |
| 7 | Flexibility and Efficiency | 2 | `/insights`: no search, filter, tag or pagination for ten posts all dated the same day. |
| 8 | Aesthetic and Minimalist Design | 3 | Zero box-shadow on any content element sitewide; three fonts exactly per spec. Undercut by six identical empty-right heroes and two 40%-void dark bands. |
| 9 | Error Recovery | 2 | Form not submitted, so no validation copy observed — not scored on what was not seen. |
| 10 | Help and Documentation | 3 | Twenty bilingual articles with real numbers, a ten-question diagnostic, per-plan cost drivers. Held back by one shared publish date and a misrouted article CTA. |
| **Total** | | **24/40** | **Acceptable (60%) — up 2, with one self-inflicted P0 costing points back** |

## Design Specificity Verdict

**Moved from "roughly a third theirs" to roughly 45%. The gain is all in the system; the loss is all in composition and in the highest-traffic copy.**

Genuinely Novieri's: the gem with four live animations and a real particle canvas; the `··` gold mono eyebrow system, consistent across both locales; the teal→plum→gold 2px seam doing structural work exactly as DESIGN.md instructs; the WhatsApp proof card with its honest "illustrative demo" tag; three fonts deployed as specified; and about half the copy ("Most firms make you sit through a sales call before you hear a price").

Category costume: the home h1 and subhead — "streamline operations and help your team grow" is the exact register the brief's Principle 5 forbids, and it is the first thing both audiences read. One inner-page hero template repeated six times, each leaving the right 45% of a 1440px canvas empty, where the spec asked for a *compact* band. Two of the four dark bands are ~40% void. Flag-emoji language switching. The chat bubble carries a glow and a gradient fill — two named anti-references and the only box-shadow on the home page. The header uses backdrop-blur glassmorphism, a third.

**The signature element the brief ranks first does not exist as specified.** "The living gem: breathing facet squares, pulsing gradient star core, rotating mono ring-text, mouse parallax" — there are zero inline SVGs over 60px on the home page. The gem is an `<img>`, so per-facet animation and ring-text are impossible by construction. What ships is a whole-image float plus halo, sweep and particles. Handsome, and one-fifth of the spec.

**Deterministic scan.** CLI: **2 findings, both reproduced false positives** — a 2px `border-left` on a legal-prose note (the rule targets thick stripes on cards) and a `bounce-easing` match on an animation *name* whose actual timing function is `ease-in-out`. Down from 8. The Tailwind scope fix is verifiable in the artifact: `source(none)` with an explicit `@source` list, and `transition:…width` now returns zero matches anywhere in the theme.

Browser pass: 178 findings across 8 pages, of which 32 are the reproduced `nested-cards` false positive (`/\bborder\b/` matching Tailwind's `border-b` makes `<header>` register as a card; all 32 carry `isHidden: true`). The phantom `marquee` and `gradient-text` findings from the previous run are gone — this run injected via `page.evaluate` rather than `addScriptTag`, so the detector's own source never entered the DOM.

**Visual overlays:** none. No browser is visible to the user in this session.

## Overall Impression

Seven of the ten shipped fixes hold under measurement. Contrast is clean across 973 elements, heading order is perfect on all ten pages, hreflang is reciprocal on 88 of 90 URLs, the redirect respects deep links in both directions, reduced-motion takes twenty animations to zero, and the cookie banner clears the CTA in both languages at both breakpoints.

And the touch-target fix broke the mobile header sitewide. A rule written to make targets bigger made the most important target on the page smaller — in Spanish, 20px wide with its right edge outside the viewport. That is the finding worth keeping: the failure came from an accessibility fix, in both languages, on every page, and no check caught it.

## What's Working

1. **Material discipline is real and measurable.** Zero box-shadow on any content element. 1px hairlines and background steps only. Three fonts exactly as specified, all six faces returning 200. Gold rationed to eyebrows and the star. Reduced-motion genuinely works: 20 animations to 0, and all 38 reveal elements still reach opacity 1.
2. **The proof section.** The WhatsApp card is category-correct, market-correct and honestly labelled. It is the one place a Barranquilla restaurant owner sees their own operation.
3. **Pricing is a competitive weapon.** Published ranges, per-plan cost drivers, locale-aware currency, and an opening line that names the competitor's behaviour.

## Priority Issues

**[P0 — since fixed and verified] The mobile header broke sitewide.**
`@media (max-width:767px){ .site-header .btn { display:flex } }` has specificity (0,2,0) and beat Tailwind's `.hidden` (0,1,0), so the desktop-only CTA rendered on every phone. Two booking buttons shared the row, the wordmark was cut to "novie", and the hamburger flex-shrank to 20×44 in Spanish with its right edge 6.4px outside a 390px viewport. The min-width guard named `.mnav-toggle` — the drawer's submenu disclosure — while the hamburger is `.site-menu-toggle`, so it never matched. Now scoped with `:not(.hidden)`, and the toggle carries `flex: none`. Verified live: 44×44 in both languages, one header CTA, no overflow.

**[P1] Money without a unit.** On `/precios` with an English-locale browser: `$99 – 115`, `$139 – 160`, `$189 – 220`, under "por usuario al mes", with no currency code. Measured across all four combinations, the word "USD" appears **nowhere on the site**; only the COP branch on the English page is labelled. This is persona (b) exactly — a Barranquilla owner whose Android runs English, arriving from a WhatsApp link. *Fix:* print the code on both branches and add an explicit toggle so the geo guess is overridable.

**[P1] Booking verbs still resolve to three destinations.** The primary label is now clean — 112 of 112 `Book a call`/`Agendar llamada` reach the calendar. The residue: `Book a conversation →` → `/contact` on 6 English articles, `Agenda una conversación →` → `/contacto` on 5 Spanish ones, `Request a demo` → form on 7 product URLs, `Solicita una demo` → form on 12. An article reader is the warmest lead on the site and pays two extra steps.

**[P1] The site sets persistent tracking cookies before consent.** `__hstc` and `hubspotutk`, both `.novieri.com`, both expiring 2027-02-16, are set before any consent click, alongside GA and HubSpot beacons. The banner module's own header comment states nothing non-essential loads until the visitor accepts, citing Ley 1581 and Decreto 1074. Accepting *does* gate the additional GA4/Clarity/Bing layer, so consent mode works — it does not gate HubSpot's own analytics.

**[P2] Six identical empty-right heroes, two 40%-void dark bands.** Pricing, products, self-diagnosis, industries and services all open with the same 780px template whose right 45% is blank; content begins at y≈780. `/self-diagnosis` puts "QUESTION 1 OF 10" — the thing the page exists for — below the fold at y≈823, behind a hero whose only button is the secondary one.

**[P2] The credibility disclaimer is the least readable text on the site.** 11.5px JetBrains Mono, 1144px box, `max-width: none`, **102 characters per line** — the sentence that qualifies the founders' experience claim, set at the smallest size in the widest measure in the lowest-contrast token.

## Persona Red Flags

**US ops lead, tabs open, desktop English.** All ten `/insights` articles are dated today, with no author and no filter — in a tab comparison that reads as SEO fill and discounts every number in them. The h1 is the most generic sentence on the site while the differentiators sit two clicks deep. The trust line is a hedge set in 11.5px mono at 102 characters per line. `/pricing` will probably win the comparison — if she reaches it.

**Barranquilla SMB owner, Android, English system language.** She never sees the gem: header plus banner take 28–30% of an 844px viewport and the mark sits below both. If she follows a WhatsApp link to `/precios` she sees `$99` with no currency code. Her hero CTA clears the banner by 12px in Spanish — Android font scaling or a 360px device closes that gap. The content is right for her; the delivery is not.

## Minor Observations

- `Recursos y Guias` in the Spanish drawer — missing accent on *Guías*, a third Spanish typography defect alongside the two known menu ones.
- The resources section is called four things: `Recursos`, `Recursos y Guias`, `Guías y recursos`, `Blog`.
- The `/insights` eyebrow uses the gold token but drops the `··` prefix every other eyebrow carries, and repeats the h1 verbatim.
- The `··` in the chat header renders grey — the only non-gold instance of the motif sitewide.
- Tab #1 on the desktop home page is the chat bubble, before the skip link.
- 17 footer links are 19px tall on mobile, under WCAG 2.2's 24px floor. Chat controls: close 32, chips 35, send 40.
- The logo SVG is still 30.5 KB over the wire and 92.5 KB decoded — the largest image on the page. Six fonts are 148 KB, 59% of total transfer.
- One line over 90 characters remains sitewide: 102 on the Spanish credential strip.
- Every booking link is same-tab; a bounced calendar leaves only the back button.

## Questions to Consider

1. If the dark hero is off the table, what carries the drama? The brief spent its whole personality budget on dark stage moments; four remain, two of them 40% empty under a glass header.
2. What is the h1 for? "Your outsourced technology team — with AI built in" is true of every firm in the consideration set. "Most firms make you sit through a sales call before you hear a price" is true of almost none — and it is two clicks deep.
3. Ten articles, one date. Would three with real dates and named authors convert better than ten anonymous ones?
4. If booking is the one success action, why do 19 product pages and 11 articles route to a form — and why does `/industries/hospitality` book directly with a nearly identical label?
5. The header broke because a 44px rule out-specified a `hidden` utility and the hamburger guard named a class that isn't on the hamburger. What in the ship process lets that reach production in both languages on every page?
