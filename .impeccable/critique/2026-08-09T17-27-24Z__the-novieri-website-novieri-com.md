---
target: the Novieri website (novieri.com)
total_score: 23
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 4
timestamp: 2026-08-09T17-27-24Z
slug: the-novieri-website-novieri-com
---
## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 2 | `aria-current` appears 0 times sitewide — no nav item is ever marked current. The region gate silently rewrites every price with no on-screen indication of which market you were assigned. The diagnostic is the exception and is exemplary. |
| 2 | Match System / Real World | 2 | Every "Book a call" button resolves to a 9-field form, not a calendar. The word promises a booking and delivers paperwork. |
| 3 | User Control and Freedom | 2 | `/es` silently redirects to `/` unless the browser locale is Spanish — a Spanish speaker on an English-configured laptop cannot land on the Spanish home page. No currency control by design, so a Colombian on a US timezone cannot get back to COP. |
| 4 | Consistency and Standards | 2 | Seven labels for one destination. EN tier 3 is "Premium", ES tier 3 is "Cumplimiento" — two audiences of stated equal priority are shown different products. The contact form is unstyled HubSpot default inside a hand-built system. |
| 5 | Error Prevention | 3 | Inline "Pick an option to continue." is good. But the diagnostic gate's name, company, email and consent checkbox all carry `required=false`; validation is JS-only. |
| 6 | Recognition Rather Than Recall | 3 | Prices published unhidden — the best recognition decision on the site. Undercut by figures carrying a bare `$`: "COP" occurs once on `/precios`, in fine print five screens below the numbers. |
| 7 | Flexibility and Efficiency | 2 | Scored, not n/a: a Persuade surface still owes a ready buyer an express lane. There is none — the calendar is behind a page load and a scroll, and none of the 15 priced rows is clickable. |
| 8 | Aesthetic and Minimalist Design | 2 | Real craft (hairline depth, mono microtype, price rows) sabotaged by six 404ing webfonts, a 13,248px Spanish mobile home page, and 40–50% dead right-hand columns in four sections. |
| 9 | Error Recognition and Recovery | 2 | The one observable recovery message is plain and good. Everything else routes through HubSpot's default form error styling, which does not match the site. The live form was not submitted; scored on the observable case plus the styling mismatch. |
| 10 | Help and Documentation | 3 | Strong for a marketing site: a 7-item pricing FAQ answering the hostile questions, "How to read these numbers", a sample report before the diagnostic, 10 comparison guides. Loses a point because all 10 guides are dated `aug 6, 2026`. |
| **Total** | | **23/40** | **Acceptable — significant improvements needed** |

## Design Specificity Verdict

**Partly authored, structurally interchangeable — and currently not shipping its own typography.**

**LLM assessment.** Four moments are unmistakably this product's: the WhatsApp mock resolving to `booking created · #1284 · 4 guests · 8:00 PM · terrace`; the four playable simulated receptionist calls footnoted "Casa Marina is a fictional restaurant"; the About page's real time-zone arithmetic; and the pricing page's bordered row list with the figure right-aligned in display weight. That last one is the only layout on the site that could not be lifted from a template, and the only page whose form matches its argument — a row list says *range*, where a three-column card table would say *pick one now*.

Against that: every page opens identically — dotted mask, `··` mono eyebrow, left-pinned h1, 50ch lead, one plum button, hairline. Home, pricing, services, contact, self-diagnosis, products, insights, no exceptions. You cannot tell which page you are on from the first 900px without reading. The card grid is the only compositional idea, and it produces orphan rows in two consecutive home sections (4-in-3, then 5-in-3). `/services` is a home section with a hero bolted on — same five cards, same copy, same tag chips, then 600px of white. The hero stat strip is the "hero-metric template" the brief names as an anti-reference, and `hero.module` ships radial-gradient halos, a particle canvas and a light sweep against a brief that bans glow and rations ornament to two motifs.

The sharpest missed opportunity: `founders-band.module` renders `aria-hidden` display type in place of a heading. `home.founders.title` — "Two founders, enterprise standards." — is written, translated, and never rendered. `home.founders.photoAlt` reads "Photo of Novieri's founders (pending)". For the audience the brief says "buy trust in the founders, not a brand wall", the founders are a decorative wordmark with an empty column beside it.

**Deterministic scan.** CLI: 105 findings across 16 live pages (exit 2). 80 of them are one `nested-cards` hit — the header's hover flyout, counted 5× per page — and are a false positive: the inner element is `invisible opacity-0` until hover, the outer is a bare positioning wrapper, and the static engine cannot evaluate either. Genuine: **6 `skipped-heading` h1→h3** on the six index pages (services, servicios, products, productos, industries, industrias), and one `marketing-buzzword` on About ("Founder-led service, enterprise-grade execution"). Source templates scanned almost clean — 17 templates and 29 modules produced **2 findings**, both in `audio-demo.module/module.hubl.css`: a real `transition: width` on the progress bar, and a `bounce-easing` false positive that matched the substring "bounce" in a keyframe name whose actual timing function is `ease-in-out`.

Browser rule pass (in-page, real computed styles): 177 findings across 6 runs — `ai-color-palette` 40, `wide-tracking` 27, `tiny-text` 24, `line-length` 17 (up to 199 characters per line on home), `oversized-h1` 2, `radial-spotlight-glow` 4. The last of those is the brief's own banned "glow", detected independently.

**Where the two assessments agree:** the design review measured the chat-mock contrast failure at 3.91:1 and the detector's browser engine reported "3.9:1 (need 4.5:1) — #8696a0 on #2a3942" for the same node. Independent methods, same number.

**Visual overlays.** Injection genuinely succeeded — CSP is only `upgrade-insecure-requests`, the live server came up on port 8400, `detect.js` loaded on all five pages and created real `div.impeccable-overlay` nodes in the DOM, which were read back programmatically. But this was a headless run with nobody at a browser tab, and the pages were discarded at close. **There is no persistent user-visible overlay.** What it bought over the CLI was a browser-rendered rule pass with real computed styles, which the CLI's URL mode could not deliver here (its Puppeteer launcher exposes no proxy option and died on `ERR_CONNECTION_RESET`).

## Overall Impression

The thinking is better than the execution, and right now the execution has a hole in it. The copy discipline is genuinely rare — published prices with the hostile questions answered, AI demos that label their own limits, a diagnostic that shows you a result before it asks for your email. That is a firm with a point of view.

But the site is not currently rendering its own brand. All six webfonts 404, so every visitor reads it in their OS default face. Every "Book a call" button lands on a form. The Spanish home page bounces English-browser visitors to English. The English home page has no title. Each of these is a deploy-layer defect rather than a design failure, which is the good news and the bad news: they are all cheap to fix, and they have all been live.

The single biggest opportunity is not a redesign. It is connecting what is already built — the fonts to their URLs, the buttons to the calendar, the founders to the home page — and then breaking the one visual pattern that repeats nine times.

## What's Working

1. **The pricing page is the best strategic and formal decision on the site.** Fifteen real figures published ungated, as bordered rows with the number right-aligned and a mono qualifier. It works because the form matches the argument: the copy says "ranges, not quotes", and a row list communicates range where a card table would communicate choose-now. It is also the sharpest execution of the brief's "Linear-like precision" anywhere in the build.

2. **The demos are the brand argument made physical.** The WhatsApp mock, the four playable calls, Sylvi. Each answers the AI buyer's real fear — "does this work or is it a deck?" — by running, then immediately labelling its own limits. The honesty label is what turns a demo into evidence, and it is the brief's "senior engineer who explains clearly" expressed as an interaction pattern rather than a sentence.

3. **Accessibility fundamentals are properly built.** 25 of 25 tab stops carry a visible focus ring at 4.65:1 against white (WCAG 2.2 needs 3:1). `prefers-reduced-motion: reduce` takes all 14 animations and all 11 running animations to zero — genuinely disabled, not just the scroll behaviour. One h1 per page holds everywhere measured. Contrast fails in exactly four places sitewide, all inside a chat mock that is deliberately reproducing WhatsApp's own palette. That is a better baseline than most production marketing sites.

## Priority Issues

Nothing here blocks task completion outright, so there are no P0s by the strict definition. The ordering below is by business impact.

**[P1] All six brand webfonts 404 in production.** Clash Display Medium/Semibold, Satoshi Regular/Medium/Bold and JetBrains Mono all return 404 with an HTML error body; `document.fonts` reports `error` on every face, both locales.
*Why it matters:* the brief's fourth design principle is "typography does the selling". A Mac visitor sees SF Pro, Windows sees Segoe UI, Linux sees DejaVu — three different brands, none of them Novieri. For a firm selling "we run your technology properly", a site whose own assets 404 is the worst available proof point. It is also the probable cause of the wordmark/nav collision below.
*Fix:* the fonts are uploaded and serve fine — the CSS just resolves one directory too deep. The stylesheet is served from `/hubfs/raw_assets/76/public/…/css/theme.css` (with a `76/` version segment) while the fonts serve from `/hubfs/raw_assets/public/…/fonts/` (without it), so the relative `../fonts/` in `@font-face` can never resolve. Make the six `src` URLs absolute, and add a deploy check that fetches all six and fails on non-200 — this reached production silently because the fallback stack is close enough that nothing looked obviously broken.
*Command:* `/impeccable harden`

**[P1] Every primary CTA lands on a form, not the calendar.** On home and pricing in both languages, the header CTA, hero CTA and closing-band CTA all resolve to `/contact` or `/contacto`. The scheduler appears exactly twice on the whole site, both inside one card partway down the contact page. Seven different labels share the one non-booking destination.
*Why it matters:* PRODUCT.md names booking a call as *the* success action sitewide, with the form as a secondary path. The build has inverted that. Every step between intent and calendar sheds intent, and this one costs a page load, a scroll and a second click.
*Fix:* point the header, hero and CTA-band buttons at the scheduler directly. If qualification data is wanted first, embed the scheduler at the top of `/contact` and demote the nine-field form to "or send the details instead". Standardise on two labels sitewide.
*Command:* `/impeccable clarify`

**[P1] The English home page ships with no title and no meta description.** `<title>Home</title>`, empty description, `og:title` "Home", empty `og:description`. Every other English page is correct; the Spanish home is correct and specific.
*Why it matters:* the US audience arrives "from referrals, LinkedIn, or search". The page they land on has no search snippet and no link preview — a share of `novieri.com` renders as an untitled card. Pure loss on half the business, and the cheapest fix on this list.
*Fix:* set them in HubSpot mirroring the Spanish page's specificity, populate the OG tags, and extend the existing `--sync-names` reconciliation to cover the home page, which is currently excluded from `PAGES` by design and so is the one page nothing ever checks.
*Command:* `/impeccable harden`

**[P1] `/es` silently redirects to English unless the browser locale is Spanish.** `language-preference.js` navigates `/es → /` client-side; `curl` sees HTTP 200 and zero redirects, so it is invisible to every server-side check.
*Why it matters:* Spanish is the default locale and the Colombian audience's entry point. A Spanish speaker on an English-configured work laptop — or any US Hispanic visitor — is bounced to English on arrival. It also means a shared `/es` link does not reliably show what the sender saw.
*Fix:* honour an explicit `/es` request as intent and never redirect away from it; run the language preference only on the bare root, and only once per visitor.
*Command:* `/impeccable harden`

**[P2] Mobile is where the structure breaks.** Two measured faults. The header declares `position: sticky; top: 0` but an ancestor defeats it — at `scrollY = 4000` its bounding top is `-4000`, so it is simply gone; on a 13,248px Spanish mobile home page the "Agendar" button is on screen for the first 6% of the scroll and never again. Separately, `/products/ai-virtual-assistant` scrolls sideways 226px at 390px wide (`scrollWidth` 616 vs 390): `.ad-card` is a grid item left at `min-width: auto`, and its min-content comes from an `h3.truncate` whose `white-space: nowrap` gives it a 434px intrinsic width — `truncate` clips visually but does not reduce min-content.
*Why it matters:* the only persistent control after the first screen is the Sylvi bubble, and none of its four chips books a call. A visitor persuaded by the WhatsApp demo at 62% depth has nothing to click without a 3,000px scroll.
*Fix:* find the `overflow`/`transform` on the header's ancestor chain (the hero's `overflow-hidden` wrapper is the prime suspect) and assert `top: 0` holds at `scrollY = 4000` on every template; add `min-width: 0` to `.ad-card`. On mobile, add a compact persistent bar carrying the single booking action once the hero passes.
*Command:* `/impeccable layout`

## Persona Red Flags

**Jordan (first-timer, English).** The hero eyebrow rotates — "Managed IT", then "Cybersecurity & compliance" — so the page appears to be about a different company each time he looks up. He clicks Services expecting explanation and gets the five cards he just read, verbatim, then 600px of white. The Products dropdown offers seven items including "WhatsApp AI Assistant", "AI Virtual Receptionist" and "Website AI Chatbot", with nothing distinguishing them. He reaches the founders band, sees "novieri" at 118px in two colours and no heading, and still does not know who these people are. He clicks "Book a call" and meets a "Service interest" free-text field he cannot fill in.

**Riley (stress tester).** Opens DevTools and finds six 404s on every page load, all of them the brand's own fonts. Tabs the header and finds `aria-current` used zero times — he is on `/pricing` and the Pricing nav item looks like the other six. Counts 15 priced rows on `/pricing`, none clickable, none marked recommended except in body prose. Reads `$99 – 115` on `/pricing`, then `$95.000 – 115.000` on `/precios` with no currency token anywhere near it; searches for "COP" and finds one occurrence, in fine print. Notices EN tier 3 is "Premium" and ES tier 3 is "Cumplimiento" with different inclusions, and concludes the two markets are being sold different products. Inspects the diagnostic gate and finds `required=false` on email, name, company **and the consent checkbox** — on a page collecting business data under Ley 1581.

**Casey (distracted, one-handed, 390px).** The fonts never arrive, so she reads the site in her phone's default face. She scrolls past the first screen and the header is gone for the remaining 12,400px. The Sylvi bubble is the only persistent control and it sits on top of body content. On the receptionist page she gets 226px of horizontal scroll. The hamburger is 40×40 — under the 44px minimum — and on the Spanish page its accessible name is still `aria-label="Open menu"`, in English. She reaches `/contact` and meets nine fields, two browser-default `<select>`s reading "Please Select", and a raw unlinked privacy URL as body text — on a phone, one-handed.

**Camila, 44, owner of a 40-person BPO in Barranquilla (project-specific).** The brief says she buys trust in the founders. She never sees them: the home page's founders band is a decorative wordmark and one paragraph, with `photoAlt` reading "Photo of Novieri's founders (pending)". The photos and bios that would close her are two clicks away on `/about`, unsignposted. **She cannot WhatsApp them** — there is no `wa.me` or `api.whatsapp.com` link anywhere on the site, in either language, though PRODUCT.md names WhatsApp conversations as one of three success metrics and the warm channel for exactly her. She taps "Agenda una llamada" mid-shift and gets a nine-field form. And the price she reads, `$145.000 – 170.000 por usuario al mes`, carries no currency label — the moment she forwards the link to a client abroad, the same page shows USD with no indication anything changed.

## Minor Observations

- Footer column labels ("·· services", "·· explore", "·· legal", "·· contact") are marked up as `<h2>`, so a screen-reader outline ends with four top-level sections named after footer columns, ranked equal to the page's real sections.
- `/insights` has no canonical tag — the only page on the site missing one — and its h1 reads "Insights — Novieri", the `<title>` string leaked into the heading, directly under an eyebrow that already says "insights".
- All 10 insight articles are dated `aug 6, 2026`. One bulk publish date on the credibility library, on a site whose fifth principle is "every claim is specific".
- The five Spanish pages sampled carry only `en`/`es` alternates while their English twins also carry `x-default`. Not an error — `x-default` need only appear once per cluster — but asymmetric.
- `robots.txt` omits a `Sitemap:` line, though the sitemap itself is complete and current at 90 URLs across both locales.
- The language switcher uses a US flag for English and a Colombian flag for Spanish, asking a UK or Mexican visitor to identify with a country that is not theirs. The design already renders EN/ES text chips beside them.
- `/precios` ships both the `co` and `intl` variants of two FAQ answers into the DOM, hidden by CSS only. With CSS blocked, in reader mode, or to a scraper, contradictory contract-minimum answers are both visible.
- The founders band splits the wordmark as `no` (plum) + `vieri` (gold), which at 118px reads as two words before it reads as one.
- The logo SVG is 48.1 KB transferred and 120.3 KB decoded — the largest asset on the home page by a wide margin, for a mark that renders at 349px.
- `/contact` is 261.8 KB transferred, of which `/_hcms/forms/v2.js` is 200.5 KB (591.8 KB decoded) — 77% of the page, and HubSpot platform code rather than theme code.
- The type scale has tightened since the last critique: 13 distinct font sizes on the home page, down from 17.
- The stat strip's honesty line — "Experience includes work led by Novieri's founders in current and previous technology leadership roles" — is exactly the right disclosure, set in 12px mono at the lowest contrast on the page, directly under the numbers it qualifies.

## Questions to Consider

1. **If the fonts had never 404'd, would anyone have noticed?** The failure survived to production because the fallbacks are close enough. What would have to be true of the Clash Display / JetBrains Mono pairing for its absence to be obvious in the first 200ms — and if the answer is "nothing", is the type system earning its place?
2. **What if `/pricing` were the English home page?** It is the only page with a layout that could not be lifted from a template, the only one making an argument competitors won't make, and the only one whose form matches its content. The home page opens with a rotating word and a stat strip. Which does a CTO with four vendor tabs open actually remember?
3. **Why is booking routed through a form at all?** The closing copy promises "no sales deck". A form asking "Service interest" before it lets you talk is a sales deck in field form. What is the smallest thing you actually need before a 30-minute call, and is it more than the email the calendar already collects?
4. **The founders are the product for one of two equal audiences. Why are they a decorative wordmark?** The heading exists in both languages and is never rendered. What happens to Spanish conversion if that band becomes two faces, two names, two credentials and a WhatsApp link?
5. **Is there any section that could not open with `·· eyebrow` → h1 → lead → hairline?** If they all could, it is not a system, it is a default. Which two sections would gain most from breaking it — and would the break be a full-bleed artifact, a table, or a number at 200px?
