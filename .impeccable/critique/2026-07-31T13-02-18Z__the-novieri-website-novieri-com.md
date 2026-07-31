---
target: the Novieri website
total_score: 30
p0_count: 1
p1_count: 2
timestamp: 2026-07-31T13-02-18Z
slug: the-novieri-website-novieri-com
---
## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Forms, quiz and chat all report state well; you only learn booking is unavailable *after* clicking the CTA |
| 2 | Match System / Real World | 4 | Plain, specific, "tú", localized URLs. No jargon anywhere |
| 3 | User Control and Freedom | 3 | Quiz has Back/restart; cookie choice can only be changed by clearing site data |
| 4 | Consistency and Standards | 3 | Strong system, but 17 distinct font sizes on one page and every section opens identically |
| 5 | Error Prevention | 3 | Inline validation, honeypot, maxlength, consent gate |
| 6 | Recognition Rather Than Recall | 3 | Clear nav; the nine products are currently invisible |
| 7 | Flexibility and Efficiency | 2 | Booking dead end; no fast path for a visitor who already knows what they want |
| 8 | Aesthetic and Minimalist Design | 4 | Genuinely distinctive; the jewel system is committed and consistent |
| 9 | Error Recovery | 3 | Failures name the email fallback in both languages |
| 10 | Help and Documentation | 2 | FAQs live only on service pages; chatbot is the main help and it's backend-gated |
| **Total** | | **30/40** | **Good — with one critical conversion gap** |

## Anti-Patterns Verdict

**LLM assessment: not AI slop.** The site has a real POV — the jewel/facet language pulled from the actual logo, the `··` motif, mono metadata, four scripted product animations built from your own systems rather than stock illustration. Nobody would look at the RMM console or the WhatsApp demo and think "template". The one tell: **every section opens the same way** — eyebrow, then h2, then content, eight times down the home page. That uniform reflex is the fingerprint the register warns about.

**Deterministic scan:** 3 findings total across the built site and source.
- `em-dash-overuse` — `/es/nosotros/`, 5 em-dashes in body copy.
- `bounce-easing` ×2 — `ChatDemo.tsx:130`, `ChatWidget.tsx:114` (typing-dot indicators).

Nothing else fired. That is a very clean scan.

## Overall Impression

The craft is there. The identity is specific, the copy is disciplined, the animations are grounded in real products, the legal and consent layer is more rigorous than most agencies ship. **And the front door is locked.** Three "Agenda una llamada" buttons on the home page lead to a page that says the calendar isn't available yet. The single biggest opportunity isn't design — it's connecting the conversion you already built the whole site to serve.

## What's Working

1. **The product animations earn their place.** The RMM fleet, the controls review climbing to 100%, the agent team with its human approval gate — each shows the actual thing you sell rather than decorating around it. The approval gate frame answers an objection before it's raised.
2. **Bilingual is structural, not bolted on.** Localized URLs, `hs_language` on every contact, per-audience "why" points (nearshore/time zone for EN, cost/practices for ES). Most bilingual sites are one site translated; this is two arguments.
3. **The diagnostic is a genuinely strong asset.** Ten questions that map to what you sell, an instant local score, then a gated AI report. It's the most valuable thing on the site.

## Priority Issues

**[P0] The primary conversion action is a dead end**
- **Why it matters:** PRODUCT.md names booking a call as *the* success action sitewide. Three CTAs on the home page, plus the header button, plus every service page, all route to `/es/contacto/` — where the booking card reads "El calendario en línea estará disponible pronto." A visitor at peak intent is told to send an email instead. This wastes the entire funnel above it.
- **Fix:** Set `NEXT_PUBLIC_CAL_LINK`, or switch to HubSpot Meetings now that HubSpot is live (Sales Hub creates the contact and logs the meeting natively). Until one exists, change the CTA label so it doesn't promise something the page can't deliver.
- **Command:** `/impeccable polish` on the contact page after the link exists.

**[P1] No social proof anywhere on the site**
- **Why it matters:** Zero testimonials, zero client names, zero case studies, zero logos — confirmed across home, about and service pages. Both audiences buy trust: the US CTO comparing nearshore vendors and the Barranquilla owner handing over their infrastructure. "1000+ usuarios asistidos como CTO" is your *previous employer's* scale, not Novieri's track record, and a careful reader will notice.
- **Fix:** Even two short named quotes, or one anonymized case study per pillar ("a 40-person distributor, backups untested for two years, restored and verified in three weeks"), changes the page materially.
- **Command:** `/impeccable craft` a proof section.

**[P1] Nine products are invisible**
- **Why it matters:** You deliberately hid Solutions, so this is known — but the cost is worth stating. The site claims custom software and AI expertise while showing no evidence you've built anything. The solution pages *are* that evidence.
- **Fix:** Unhide when ready, or add one line to the home services section pointing at what you've built.

**[P2] Sectional monotony and a duplicated stat**
- **Why it matters:** Eight home sections, each opening eyebrow → h2 → body. It reads as a template even though nothing else does. And "fundadores, cero intermediarios" appears **twice** on the home page — once in the proof strip, again as the "why" stat. Repetition inside one page reads as an oversight.
- **Fix:** Vary two or three section openings (lead with the number, the visual, or a full-bleed statement). Drop one instance of the founders stat.
- **Command:** `/impeccable layout` on the home page.

**[P2] Typographic scale has sprawled**
- **Why it matters:** 17 distinct font sizes render on the home page: 10.5, 11.5, 12, 13, 13.5, 14.5, 15, 15.5, 16, 17, 18, 18.5, 22, 25, 26, 72, 118px. Six of those sit within 5px of each other and do no distinguishing work. It's the difference between a system and accumulated one-off decisions.
- **Fix:** Collapse to a modular scale of ~7 steps and map every component onto it.
- **Command:** `/impeccable typeset`.

## Persona Red Flags

**Camila (Barranquilla SMB owner, ES, 40 employees, no IT staff)** — The diagnostic is perfect for her and she'd finish it. Then: her result page offers "Agenda una llamada de 30 minutos", she clicks, and gets told the calendar isn't ready. She emails instead, or doesn't. She also has no way to judge whether you've done this for a company like hers, because nothing on the site names one.

**Marcus (US startup COO, EN, comparing three nearshore vendors)** — Opens `/en/`, reads the nearshore argument, and immediately looks for evidence: clients, case studies, a team page with more than two people. He finds two founders and no clients. He is also price-sensitive at this stage and finds no range, no "starting from", not even a typical engagement size. He will not book a call to find out; he'll open the next tab.

**Jordan (first-time visitor, mobile)** — The home page is **9,488px tall on a 390px screen** — roughly eleven full screens of scrolling, with no in-page navigation and no anchor links. The diagnostic band sits at screen five. On mobile the WhatsApp demo panel is the strongest thing on the page and it arrives at screen six.

## Minor Observations

- The contact form asks for name, company, email, service and message; the diagnostic also asks for phone. Pick one standard.
- Cookie consent can't be changed once given except by clearing site data — the policy says so honestly, but a "cookie settings" footer link is a 20-line component.
- `bounce-easing` on the typing indicators: defensible for a chat dot, but it's the one motion in the system that isn't ease-out.
- Five em-dashes in the About story. Two would read better.
- `/es/nosotros/` still shows initials in squares where founder photos should be — the highest-trust page on the site has no faces on it.

## Questions to Consider

- If a visitor could only see **one** screen of this site, which would you choose? Is that screen the one that loads first?
- The diagnostic is your best asset and it sits fifth on the home page. What if it were the hero?
- You sell "enterprise standards at a fraction of the price" — but the site shows no price at all. What would a confident version of that claim look like?
