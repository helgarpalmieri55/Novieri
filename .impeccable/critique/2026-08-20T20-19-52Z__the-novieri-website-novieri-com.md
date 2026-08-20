---
target: the Novieri website (novieri.com)
total_score: 23
max_score: 40
na_heuristics: 
p0_count: 3
p1_count: 2
timestamp: 2026-08-20T20-19-52Z
slug: the-novieri-website-novieri-com
---
Method: dual-agent (A: design review, ~15 pages × 4 widths, both locales · B: detector + 90-URL sweeps, 11-page injection). A's first run died on an API error and was relaunched. Every contested claim below was re-verified in the parent before scoring.

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | The diagnostic gate does report errors — four specific inline messages on an empty submit, verified. But zero `role="alert"`, zero `aria-live` on them, and no focus move, so a screen-reader user gets nothing. |
| 2 | Match System / Real World | 3 | ES nav says "IT Administrado" and "Consultoria IT" (unaccented) where the pages say "TI administrada" and "Consultoría tecnológica". EN blog h1 is "Insights" where ES is "Guías y recursos". |
| 3 | User Control and Freedom | 2 | All 58 booking links navigate same-tab to a bare `meetings.hubspot.com` subdomain with a tracking querystring — no `target`, no external indication. The consent banner has no dismiss, only two choices, and follows the reader down all 12,593px of the ES home. |
| 4 | Consistency and Standards | 1 | The header bar overflows its viewport from 768–1023px in both languages and the primary CTA leaves the screen. Contact submit is a 999px pill against 10px everywhere else. Article h1/h2 ratio collapses from 2.0 to 1.24 at 768. Container left edges differ per section. |
| 5 | Error Prevention | 2 | The gate's Ley 1581 consent is validated in JS but carries no `required` attribute — if the script fails, nothing is enforced. The contact form marks 1 of 10 fields required. |
| 6 | Recognition Rather Than Recall | 3 | Breadcrumbs, a sticky legal TOC, published pricing, per-group booking rows. Pricing separates a tier name (x=174) from its price (x=980) with no leader; all 11 blog posts carry the same date. |
| 7 | Flexibility and Efficiency | 2 | The diagnostic is 20 interactions with no auto-advance. A 6,015px, 11-heading article has no TOC while the legal page — which needs one less — has one. |
| 8 | Aesthetic and Minimalist Design | 2 | Genuinely restrained where content exists: 0 carousels, 0 stock photos, 5 images sitewide, and 145 KB of fonts is essentially the entire 149 KB first-party payload. Undercut by grid orphans, 40/60 sections with an empty right column, and two named anti-references in permanent chrome. |
| 9 | Error Recovery | 2 | The diagnostic's messages are specific and useful ("Enter a valid email."). No `aria-invalid`, no `role="alert"`, no focus to the first invalid field; the contact form renders each error twice; the palette still has no error token. |
| 10 | Help and Documentation | 3 | Pricing FAQ, per-group "what moves the price", a legal library with a 12-section sticky TOC, an assistant that self-labels its own fallibility. The privacy-policy URL prints as bare text inside both contact forms — `form a` count is 0. |
| **Total** | | **23/40** | **Fair (58%) — a discovery drop, not a regression** |

## Design Specificity Verdict

**~70% authored, up from ~55%, and the ceiling moved.**

Unmistakably Novieri's: the hero gem rebuilt from the logo's own facet language; the `··` gold motif used as eyebrow, list marker and index; the WhatsApp thread with a 0:07 waveform and a `✓ booking created · #1284 · 4 guests · 8:00 PM · terrace` receipt; the founders band setting the wordmark at 180px with a gold i-dot; JetBrains Mono carrying the "laboratory" half of the brief structurally rather than decoratively; and copy that argues — "Most firms make you sit through a sales call before you hear a price."

What still reads as category-default is now almost entirely execution, not identity:

- **Three named anti-references ship in permanent chrome.** `header.site-header` is `bg-white/90` + `backdrop-filter: blur(8px)` — glassmorphism, on every page. The nav dropdowns and the cookie banner both carry `shadow-[0_8px_40px_rgba(22,18,29,0.10)]` in a system whose first principle is "depth from borders, not shadows." The header's own `border-b` is `1px solid rgba(0,0,0,0)`.
- **DESIGN.md says "header always sits on black." It never does.** The translucent white bar cuts a light stripe across every dark band — five times per home scroll.
- **One composition, repeated.** Five home sections (843 / 728 / 1073 / 845 / 664px tall) put every word in a left 40% and leave the right 60% empty. Two grids are `xl:grid-cols-3` fed 4 and 5 items, stranding one card beside ~900px of dead black and two beside ~370px of dead white.
- **The per-pillar accent is still specified and unbuilt** — AI=plum, Managed IT=teal, Security=gold, Software=ink. All five pillar pages measure the same eyebrow and the same plum button.

**Deterministic scan.** CLI: 2 findings on the HubSpot theme, both re-verified false positives — a 2px hairline on a legal pull-quote scored as a card accent bar, and `bounce-easing` matching the *name* of an equalizer animation whose actual timing function is `ease-in-out` and which is reduced-motion gated. Browser injection across 11 pages: the recurring high-count rules are also false positives with mechanisms confirmed at source — `nested-cards` ×44 is the header mega-menu flyout on every page (`/\bborder\b/` matches `border-line`), `ai-color-palette` on `.seam` is the 2px brand gradient scored as a full-bleed wash, `tiny-text` ×23 and `wide-tracking` ×40 are both the `--text-micro` mono eyebrow token, and `gray-on-color` measures 6.77:1.

## Overall Impression

**The score went down and the site did not get worse.** Every one of the three P0s below predates today's work; they were found because this run measured things earlier runs did not — the header at tablet widths, the DOM shape inside `.article-prose`, and whether the JSON-LD actually parses. Two of them have almost certainly been shipping since those templates were written.

The floor B measured is genuinely strong: 90/90 pages with exactly one h1 and zero heading skips, 88/90 with fully reciprocal hreflang, 5 real contrast failures out of 2,238 text nodes tested, 13 animations going to 0 under `prefers-reduced-motion` with all 38 `.reveal` elements ending at opacity 1, all six brand fonts returning 200, and zero horizontal overflow across 50 page/width measurements.

That last number is the lesson of this run. **The document did not overflow at any width — and the header still pushed its primary CTA off the screen at five of them.** `.site-header` is `position: fixed`, so it contributes nothing to `document.scrollWidth`. Every overflow check anyone has run on this site, including mine this morning, was structurally incapable of seeing it.

## What's Working

1. **The pricing page is a competitive weapon and now behaves like one.** Five groups, three tiers, real ranges, "what moves the price" under each, currency by timezone (verified correct across all four locale × timezone combinations), and — as of today — a booking row naming its own group at the end of each table. `main` link count went from 2 to 7.
2. **The accessibility floor was designed, not retrofitted.** 2,238 text nodes tested; 5 failures, all on one page's chat mockup. Reduced motion is a complete, correct gate. The mobile menu's disclosure buttons already do the ARIA pattern properly — which is exactly why the desktop dropdown's failure below is fixable by copying code that already exists in the same file.
3. **228 KB, 36 requests, 2.32s at 390px** — for an animated SVG hero, a chat widget, HubSpot forms and a consent platform. The single largest asset on the site is Google Tag Manager at 167.6 KB, larger than the entire first-party payload including all six fonts.

## Priority Issues

**[P0] The header overflows from 768px to 1023px and takes the primary CTA off-screen — in both languages.** Measured `header-bar.scrollWidth` against viewport:

| Width | English | Spanish |
|---|---|---|
| 768 | scrollW 1016 — Contact, both language links, **Book a call** off-screen | scrollW 1093 — Contacto, both language links, **Agendar llamada** off-screen |
| 820 | scrollW 1017 — language links, **Book a call** | scrollW 1093 — Contacto, language links, **Agendar llamada** |
| 900 | scrollW 1019 — Español, **Book a call** | scrollW 1095 — both language links, **Agendar llamada** |
| 1024 | clean | scrollW 1098 — **Agendar llamada** sliced by the viewport edge |
| 1100+ | clean | clean |

Every iPad in portrait, every 13" laptop in a half-width window. `document.scrollWidth === innerWidth` at all five, because the header is `position: fixed`. *Fix:* move the desktop nav from `md:flex` to `xl:flex` — Spanish needs 1098px plus padding, so 1024 is not enough headroom — and keep the mobile bar up to `xl`. Then assert `header-bar.scrollWidth <= viewport` per locale at 320/360/390/768/820/900/1024/1100/1280/1440 in CI, because no document-level check will ever catch this.

**[P0] Article paragraphs have no spacing, and the comparison table has no cell padding.** `.article-prose > * + * { margin-top: 1rem }` has never applied: HubSpot wraps `content.post_body` in a single `hs_cos_wrapper` `<span>`, so `.article-prose`'s only direct child is that span and every paragraph is a grandchild. Verified — `childTags: ["SPAN"]`, `pCount: 0` at the child level. The child combinator misses; the descendant selectors added today (`.article-prose p`) hit, which is why the font-size change worked and the spacing never has. The one comparison table has `padding: 0px` and `border-width: 0px` on every cell under `border-collapse: collapse`, so column text collides — the SOC 2 / ISO 27001 row renders as "…judgedA defined standard with a…". *Fix:* switch to descendant selectors (`.article-prose p { margin-bottom: 1.15em }`), give `th, td` real padding and a hairline bottom border, and wrap tables in `overflow-x: auto`.

**[P0] Two of the four JSON-LD blocks on every blog post are invalid JSON.** Verified by parsing: `ProfessionalService` OK, HubSpot's own `BlogPosting` OK, **`Article` FAIL**, **`BreadcrumbList` FAIL**. Both die the same way — `"headline": <span id="hs_cos_wrapper_name" class="hs_cos_...` — because `content.name|escapejson` emits the COS wrapper markup instead of the string. Every article's structured data has been dead since it was written. *Fix:* strip the wrapper before escaping (`content.name|striptags|escapejson`) and add a parse assertion over every `application/ld+json` block to the deploy.

**[P1] All 18 nav submenu links are unreachable by keyboard.** The panel is hidden with `invisible … opacity-0` and revealed by `group-hover:visible group-focus-within:visible` — but `visibility: hidden` removes the children from the tab order, so nothing inside can take focus to trigger `group-focus-within`. It can never fire. A 22-key tab trace goes Services → Products → Industries → Insights → Pricing → About → Contact, skipping every child. No `aria-haspopup`, no `aria-expanded`. WCAG 2.1.1, on a site selling SOC 2 and PCI DSS readiness. *Fix:* the mobile pattern in the same module already does this correctly — a real button with `aria-expanded` toggling `hidden`.

**[P1] The error plumbing is sighted-user-only, and the privacy link isn't a link.** The diagnostic gate genuinely validates — an empty submit unhides four specific messages ("Enter your name.", "Enter your company name.", "Enter a valid email.", "We need your authorization…"). But: 0 `role="alert"`, 0 `aria-invalid`, 0 focus move, and no `required` attributes, so the Ley 1581 consent is enforced only as long as the JavaScript runs. On both contact pages the privacy-policy URL is printed as bare text inside the form — `form a` count is 0, at the exact moment personal data is handed over — and 1 of 10 fields is marked required.

**[P2] Grid orphans and the empty right column.** `xl:grid-cols-3` receives 4 children (home and service-page industries) and 5 children (home services). At 1440 that strands one card beside ~900px of dead black and two beside ~370px of dead white. Making the counts agree also lets the 5 pillars express the "strict priority order" PRODUCT.md specifies and the current equal-peer grid erases.

**[P2] The home page never links to its own best argument.** 14 unique destinations from the home body; none is `/pricing`, none is any of the 7 product pages, none is `/insights`, none is `/contact`. Pricing is reachable from the nav, but the page carrying "Most firms make you sit through a sales call before you hear a price" is not something the home page ever offers.

## Persona Red Flags

**US ops lead, five tabs, 13" MacBook.** Puts the Novieri tab at half-width (~900px) to compare against another tab, and the only CTA on the page is off-screen. Opens `/insights` to check whether these people know anything: all 11 articles dated today. Opens one: paragraphs run together as a single 6,000px slab and the key comparison table's columns collide. Runs a schema check on a technology vendor — two of four blocks fail to parse. Tabs to check keyboard access before recommending a security vendor — the entire submenu is unreachable.

**Barranquilla SMB owner, mid-range Android.** 228 KB in 2.3s, of which 147 KB is fonts. At 320px the consent banner is 172px tall and the hero CTA sits below it; the banner's own heading is `sr-only` on phones, so the first thing on screen is an untitled card of grey legalese. The banner never dismisses — only consents — and occupies ~21% of the viewport for the entire 12,593px page, including over the footer's own "Cookie policy" link. On `/precios` she reads "TI administrada" on the page and "IT Administrado" in the menu she just used.

## Minor Observations

- `/industrias/restaurantes` and `/industrias/pymes` emit zero `hreflang` tags — no self-reference, no `x-default`. Every other industry page emits all three. Independently confirmed.
- `robots.txt` still has no `Sitemap:` directive, though `/sitemap.xml` serves 90 valid URLs.
- Two focus-ring colours: nav links get `--ink-muted`, everything else `--plum-bright`.
- `<select>` is 47px against `<input>` at 51px in the same contact-form column.
- "Service interest" is free text on a site with exactly five named pillars; the ES form asks the better question.
- The contact consent checkbox is 24×24, under the 44px minimum, with no gap to its label.
- No `<time>` elements anywhere on the blog — dates carry no machine-readable value.
- EN writes "1000+" without a separator; ES correctly writes "+1.000".
- ES pricing tiers are Esencial / Completo / **Cumplimiento** against EN's Core / Complete / **Premium** — the third is a different concept, on two hreflang-linked pages.
- `data-region-only="co"` hides the WhatsApp product from the EN nav, but the 845px home section promoting it, the featured case study, and the assistant's own suggestion chip all still fire for US visitors.
- The booking calendar now renders correctly in both locales (`lang=es-co`, "agosto 2026 / Selecciona un día") — but the meeting title stays "Meet with Novieri" on the Spanish page, and both locales show a dangling "available times for **.**" before a day is picked.
- Footer links are 19px tall with a 34.8px median pitch — passing WCAG 2.5.8 via the spacing exception, failing 2.5.5.

## Questions to Consider

1. **If the footnote is true, why are the numbers the headline?** "Experience includes work led by Novieri's founders in current and previous technology leadership roles" says the 1,000 users and the compliance programs happened elsewhere. What if the strip led with what is unambiguously yours — two founders, zero middlemen, same-day time zone — and the borrowed credentials moved to `/about`, where a narrative can hold them honestly instead of a footnote retracting them?
2. **A blur and two drop-shadows ship on every page of a site whose first design principle is "depth from borders, not shadows."** Deliberate override, or typed once in the header module and never re-read against DESIGN.md?
3. **What is the right column for?** Five home sections put every word in a left 40%. If the asymmetry is intentional it needs a counterweight; if it isn't, a 900px measure would be a more confident page than a 40/60 split with nothing in the 60.
4. **You built the honest version of a lead magnet and then gated it.** The diagnostic shows a real preliminary score before asking for anything — rare and good. So why does the home page promise "you read the diagnostic at the end … It commits you to nothing" and then present a five-field form at "Question 10 of 10"?
5. **Every overflow check this project has ever run was blind to the header.** What else is `position: fixed` hiding from the assertions?
