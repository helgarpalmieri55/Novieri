# novieri.com

Bilingual (ES/EN) marketing site for Novieri — AI-first IT solutions from
Barranquilla, Colombia. Next.js 15 (App Router) · Tailwind CSS v4 · next-intl.

## Develop

```bash
npm install
npm run dev      # http://localhost:3000 (open /es or /en; the root gate is public/index.html)
npm run build    # static export -> out/ (includes the localized-pathname rename step)
npm run serve    # serve out/ locally
```

The site is a **static export** (`output: "export"`): plain HTML/CSS/JS that any
static host can serve. `scripts/localize-export.mjs` runs after `next build` to
rename exported directories to their localized paths (`/es/soluciones/...`) and
verify every sitemap URL resolves to a file.

## Structure

- `messages/es.json`, `messages/en.json` — all copy lives here, no hardcoded strings.
- `src/i18n/routing.ts` — localized pathnames (`/es/servicios/...` ↔ `/en/services/...`).
- `src/config/site.ts` — single config point for launch placeholders.
- `PRODUCT.md` / `DESIGN.md` — strategy + visual system (impeccable skill).
- `Logo/` — original brand assets; web copies live in `public/brand/`.

## TODO before launch (brief §9)

| Item | Where |
|---|---|
| `anthropic_api_key` | `api/config.php` on the server — chatbot **and the self-diagnosis** answer 503 until set |
| SMTP mailbox + password (`smtp_user`, `smtp_pass`, `mail_to`, `mail_from`) | `api/config.php` on the server — contact form delivery |
| FTPS secrets (`FTP_SERVER`, `FTP_USERNAME`, `FTP_PASSWORD`, optional `FTP_SERVER_DIR` variable) | GitHub repo → Settings → Secrets and variables → Actions |
| `NEXT_PUBLIC_CONTACT_EMAIL` | env or `src/config/site.ts` (default sales@novieri.com) |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` (+57…, digits only) | env — WhatsApp button hidden until set |
| ~~`NEXT_PUBLIC_MEETINGS_LINK`~~ | **done** — `https://meetings.hubspot.com/helgar-palmieri` is the default in `src/config/site.ts`; the env var only overrides it |
| reCAPTCHA keys | `RECAPTCHA_SITE_KEY` as a **repo variable** (Settings → Secrets and variables → Actions → Variables) and `recaptcha_secret` in `api/config.php`. Until both exist the forms work with no captcha. See **Form protection** below. |
| Founder photos | drop `helgar.jpg` and `sylvana.jpg` into `public/team/`. The About page swaps the initials for the portrait automatically when the file is there (checked at build time). Square, 400×400 or larger, face near the top — the cards crop with `object-top`. |
| `NEXT_PUBLIC_LINKEDIN_URL` | env — footer icon hidden until set |
| `razonSocial`, `NIT` | `src/config/site.ts` — **required**: footer legal line *and* the controller identification in the legal pages (the NIT clause is omitted while empty) |
| Solutions section | `showSolutions` in `src/config/site.ts` — `false` hides nav/footer links, drops the pages from the sitemap, and marks them `noindex`. Flip to `true` to publish. |
| Testimonials | `home.testimonials.items` in `messages/es.json` + `messages/en.json`. Ships **empty on purpose** — nothing about clients is invented here. Add `{ "quote": "…", "name": "…", "role": "…", "company": "…" }` (company optional) and the section appears on the home page; leave it empty and it stays out of the DOM entirely. Add each quote to both locales, translated. |
| `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` (`novieri.com`) | env — analytics off until set |
| `hubspot_token` (Private App, **not** an API key — those are deprecated) | `api/config.php` on the server — optional, adds the diagnosis as a note on the contact |

## HubSpot

The site keeps its own forms and posts them server-side to HubSpot, so the
design and the bilingual consent copy stay ours while HubSpot still gets a
real form submission with full attribution.

Portal **45528787** (region na1) and both form GUIDs are already in
`src/config/site.ts` and `server/api/config.sample.php` — they are public
values, the kind that appear in any embed code. Only the Private App token is
secret, and it goes into `api/config.php` on the server.

**Which form is which:** `hubspot_form_contact` is assumed to be
`21f27f61-…` and `hubspot_form_diagnostic` `42957848-…`. If a diagnostic
submission is rejected for unknown fields while the contact form works, they
are reversed — swap the two lines in `config.php`.

Still to do in HubSpot:

1. **Create the custom contact properties** the diagnostic writes:
   `novieri_diagnostic_score` (number), `novieri_diagnostic_level`,
   `novieri_diagnostic_headline`, `novieri_diag_q1` … `novieri_diag_q10`, and
   `novieri_service_interest` for the contact form. Unknown property names are
   rejected by the submission, so create them first.
2. **Add every field to its form**, and enable *Data privacy and consent* on
   both (Options tab) so the consent text we send is stored. HubSpot rejects a
   submission carrying a field that isn't on the form.
3. Optionally create a **Private App** token for the timeline note.

**Nothing reaches HubSpot from GitHub Pages** — form submissions go through the
PHP backend, which only exists on GoDaddy. The tracking script *does* run on
Pages, so page views and the `hubspotutk` cookie start accumulating now.

`hs_language` is set from the locale on every contact, so the ES and EN
audiences can be segmented and nurtured separately from day one.

## Legal pages — have a lawyer review before launch

`/legal/privacy`, `/legal/cookies`, and `/legal/terms` (both locales) are
drafted against Colombian law — Ley 1581 de 2012 and Decreto 1074 de 2015
(data protection, SIC as authority), Ley 1480 de 2011 (consumer statute),
Ley 527 de 1999 (electronic commerce), Ley 1273 de 2009 (computer crimes),
and Ley 23 de 1982 / Decisión Andina 486 (intellectual property). They are a
solid starting point written from the site's actual data flows, **not legal
advice** — have Colombian counsel review them before launch.

Two things must be filled in first: `razonSocial` and `nit` in
`src/config/site.ts`. Until then the pages identify the controller as
"Novieri" and omit the NIT clause. Also check whether the company must
register its databases in the *Registro Nacional de Bases de Datos* (RNBD)
of the Superintendencia de Industria y Comercio — that depends on the
company's assets and headcount.

Copy lives in `messages/*.json` under `legal.*`. A `[[…]]` block in that copy
is dropped automatically when a value inside it is empty, which is how the
NIT clause disappears cleanly.

The cookie banner (`src/components/CookieBanner.tsx`) stores the choice in
localStorage under `novieri-consent` and analytics
(`src/components/Analytics.tsx`) stays off until the visitor accepts — prior,
express, informed consent, as the regulation requires. The footer's *cookie
settings* link reopens the banner, so consent is as easy to withdraw as it
was to give.

## Solutions content — review before launch

Solution-page copy sources:

- **Repo-verified** (written from the actual code/READMEs): AI Virtual Receptionist,
  WhatsApp AI Assistant, IT Management Suite & RMM, Visitor Intelligence, Sentinel,
  Networks & Systems Monitoring, Ventia.
- **Repo-verified too**: Matter Flow (observability platform — rewritten from its
  README; the Systems Monitoring page is positioned as the managed service that
  runs on it).
- **Drafted, needs owner review**: AI-powered Websites (productized service,
  review positioning).

## HubSpot site (`hubspot/`)

The site is being rebuilt as a HubSpot **project** (`platformVersion 2026.03`)
so page copy can be edited in HubSpot instead of in this repo. Serverless
functions do not exist in 2025.2 — HubSpot removed them there and restored
them in 2026.03, where public endpoint functions need **Content Hub
Enterprise** and get a 15-second timeout.

The project is called **Novieri website** in HubSpot, and `hsproject.json`
must keep that exact name: the CLI matches on it, and a mismatch silently
creates a second project instead of uploading into yours.

```
hubspot/
├── hsproject.json
├── build/theme.css            # Tailwind entry — not deployed, it is the source
└── src/
    ├── app/                   # private app + serverless endpoints
    │   ├── app-hsmeta.json
    │   └── functions/         # chat.js (Sylvi), diagnose.js, lib/
    └── theme/novieri/         # templates, modules, css, js, fonts, images
```

### Templates and modules

Six templates, all extending `partials/base.hubl.html`:

| Template | Used for | Editing |
| --- | --- | --- |
| `home` | the home page | drag-and-drop |
| `service` | the four pillars, the service index, every solution page | drag-and-drop |
| `about` | about | drag-and-drop |
| `page` | anything else — starts with a rich-text block | drag-and-drop |
| `contact` | contact | fixed layout, fields editable |
| `legal` | privacy, cookies, terms | fixed layout, fields editable |
| `diagnostic` | the self-diagnosis | fixed layout, fields editable |

The drag-and-drop templates ship with a sensible section order; a page can drop
a section it does not need or add another from the module list. Contact, legal
and diagnostic are fixed because their arrangement *is* the design — everything
in them is still edited from the sidebar.

Inside a project, every HubL file takes `.hubl` **before** its original
extension: `module.html` → `module.hubl.html`, `module.css` →
`module.hubl.css`, `module.js` → `module.hubl.js`, `template.html` →
`template.hubl.html`. JSON files keep their names. Get this wrong and there is
no error anywhere: the upload succeeds, the module's CSS and JS load on the
page, and the module renders **nothing** — an empty `hs_cos_wrapper` div. A
theme of blank white pages is the only symptom you get. `.hubl.htm` cost us a
deploy this way.

`npm run check:hubspot` enforces that, plus the rules HubSpot only reports one
at a time, three minutes into an upload: reserved field names (`label`, `name`,
`body`), names reused anywhere in a module (they are module-wide, not per
group), `module.x` references with no matching field, template paths pointing
at modules that do not exist, and a `@source` glob that no longer covers the
markup. It runs first inside `npm run build:hubspot`.

Two files are **generated — never edit them by hand**, and the deploy fails if
they are stale:

- `src/theme/novieri/css/theme.css` — Tailwind, scanning the HubL templates and
  importing `src/app/globals.css`. The design system is shared with the Next.js
  site, so module markup can be lifted from the React components unchanged.
- `src/app/functions/lib/company-profile.json` — Sylvi's knowledge, built from
  the site's own copy. When copy moves into HubSpot pages, change
  `scripts/build-company-profile.mjs` and nothing else.

Rebuild both with `npm run build:hubspot`.

### One-time setup in HubSpot

1. **Secrets** (`hs secrets add NAME`, then paste the value — they never touch
   the repo): `ANTHROPIC_API_KEY`, and optionally `CHAT_SECRET`,
   `CONTACT_EMAIL`, `CHAT_DAILY_PER_IP`, `CHAT_DAILY_TOTAL`,
   `DIAGNOSE_DAILY_TOTAL`, `RECAPTCHA_SECRET`, `HUBSPOT_PORTAL_ID`,
   `HUBSPOT_FORM_DIAGNOSTIC`. The last two are how the diagnostic delivers its
   lead; without them the report still reaches the visitor, it just does not
   reach the CRM.
2. **HubDB table** for the rate limits — serverless invocations share no
   filesystem, so the counters live in HubDB. Create a table named
   `novieri_rate_limits` with two text columns, `bucket` and `hits`, publish
   it, and add its id as the secret `RATE_LIMIT_TABLE_ID`. Until it exists the
   limiter is inert and the endpoints are protected only by the origin check.
3. **Forms**: a contact form (dropped straight onto the contact template) and a
   diagnostic form whose GUID becomes `HUBSPOT_FORM_DIAGNOSTIC`. Give the
   diagnostic form the contact properties the function writes:
   `novieri_diagnostic_score`, `novieri_diagnostic_level`,
   `novieri_diagnostic_headline`, and `novieri_diag_q1` … `novieri_diag_q10`.
   Every answer as its own property is what keeps the CRM segmentable — "leads
   over 50 people whose backups have never been restored" is then a list.
4. **Workflows**: the diagnostic promises the visitor a copy by email. That is
   a workflow on the diagnostic form submission, so the copy can be edited
   without a deploy. Notification to sales belongs on the same trigger.
5. **Menus** (Content → Navigation): one per language. The header and footer
   read them, which is what makes links editable without a deploy.
6. **Pages**: create each page from the theme's templates, then add the English
   variant from the same page's language menu. The home page must be set as the
   domain's home page in Settings → Website → Domains, or `/` keeps answering
   with HubSpot's 404 even once the page exists.
7. **Domain**: connect `novieri.com` last, once the pages look right on the
   `*.hs-sites.com` preview. Both endpoints already allow that preview host.

### The pages to create

Templates are not pages. Each row below is one page created in Content →
Website Pages, choosing the template in column two and setting the slug in
column three. Titles and descriptions are the ones the React site shipped
(`messages/en.json` → `meta`), so they can be pasted straight in.

`showSolutions` is `false` in `src/config/site.ts`, so the eight solution pages
stay out until that flips.

| Page | Template | Slug (EN) | Slug (ES) |
| --- | --- | --- | --- |
| Home | Novieri — home | *(empty — this is what makes it the homepage)* | *(empty)* |
| Services | Novieri — service | `services` | `servicios` |
| AI & automation | Novieri — service | `services/ai-automation` | `servicios/ia-y-automatizacion` |
| Managed IT | Novieri — service | `services/managed-it` | `servicios/it-administrado` |
| Cybersecurity & compliance | Novieri — service | `services/cybersecurity-compliance` | `servicios/ciberseguridad-y-cumplimiento` |
| Custom software | Novieri — service | `services/custom-software` | `servicios/desarrollo-a-medida` |
| About | Novieri — about | `about` | `nosotros` |
| Contact | Novieri — contact | `contact` | `contacto` |
| Self-diagnosis | Novieri — diagnostic | `self-diagnosis` | `autodiagnostico` |
| Privacy policy | Novieri — legal | `legal/privacy-policy` | `legal/politica-de-privacidad` |
| Cookie policy | Novieri — legal | `legal/cookie-policy` | `legal/politica-de-cookies` |
| Terms of use | Novieri — legal | `legal/terms-of-use` | `legal/terminos-de-uso` |

Then the menu (Content → Navigation), one per language — the header and footer
both read it: **Services** (with the four pillars beneath it), **About**,
**Contact**, **Self-diagnosis**.

Two settings that are easy to miss:

- **Turn off HubSpot's own cookie banner** (Settings → Privacy & Consent →
  Cookies). The theme ships its own, and that one is not decorative: it calls
  `_hsp.push(["setHubSpotConsent", …])`, so it is what actually gates HubSpot's
  tracking cookies. Leaving both on shows the visitor two banners.
- **Field defaults are copied when a page is created**, not read live. A page
  made before a `fields.json` default changed keeps the old value — recreate it,
  or edit the field in the page editor.

### Deploying

`.github/workflows/deploy-hubspot.yml` uploads the project on every push to
`main` that touches `hubspot/`, `messages/`, or the shared stylesheet. It uses
the two repo secrets from `hs init` (`HUBSPOT_ACCOUNT_ID`,
`HUBSPOT_PERSONAL_ACCESS_KEY`). Locally: `hs project upload`.

A note on module CSS: HubSpot loads each module's `module.css` when that module
renders, so the header and footer styles are not in `theme.css`. That is
deliberate — those two files are the only place the design is applied by
element selector, because `{% menu %}` and `{% language_switcher %}` emit
HubSpot's own markup.

## Deploy

Both workflows run on every push to `main` (and manually via *Run workflow*):

- **GitHub Pages** (`.github/workflows/deploy-pages.yml`) — preview at
  `https://<user>.github.io/Novieri/`. Static site only: the chat widget is
  hidden and the form shows its email fallback (no PHP on Pages).

  The Pages source **must be "GitHub Actions"**, not a branch. In branch mode
  GitHub runs its own Jekyll build on every push *in addition* to this
  workflow, and whichever finishes last is what visitors get — Jekyll
  publishes the rendered README as the home page. The workflow's first step
  now sets the mode over the API, but if the token is ever refused, fix it by
  hand: repo Settings → Pages → Source: **GitHub Actions**. You can tell which
  one served a page by whether `/es/` returns 404.
- **GoDaddy via FTPS** (`.github/workflows/deploy-godaddy.yml`) — production.
  Uploads the static site plus the PHP backend to `/api`. One-time setup:
  the FTPS secrets above, and on the server copy `api/config.sample.php` to
  `api/config.php` and fill in your keys (Anthropic key, SMTP password, your
  tracking/integration keys). The deploy never uploads or deletes
  `config.php`. `www` → apex and HTTPS redirects live in `public/.htaccess`.

## Backend (`server/api/`)

Dependency-free PHP (works on GoDaddy shared hosting, PHP ≥ 8.0):

- `contact.php` — contact form → email via GoDaddy SMTP (vendored PHPMailer in
  `lib/`). Honeypot + per-IP rate limit (5/10 min).
- `chat.php` — **Sylvi**, the website assistant → Claude API (`claude-opus-5`) over raw HTTPS.
  The company profile is assembled at request time from `data/es.json` +
  `data/en.json` (copies of `messages/*.json` made by the deploy), so the bot
  always matches the site. Prompt-cached system block. See **Chatbot
  guardrails** below.
- `diagnose.php` — self-diagnosis: takes the ten answers plus contact details,
  asks Claude for a report written for that company, renders it to a PDF
  (vendored FPDF in `lib/`, core font metrics in `lib/font/`), emails the lead
  with the PDF attached to the sales mailbox and to the visitor, and returns
  the report plus the PDF as base64 in one response — nothing is written to
  disk. Honeypot + per-IP rate limit (6/hour).
- `hubspot.php` — lead delivery to HubSpot via the **Forms Submission API**
  (not the CRM API: only a form submission counts as a conversion, enrols
  form-submission workflows and lands on the timeline). Needs no token — the
  portal id and form GUID identify it. Every failure is logged and swallowed,
  so a HubSpot outage never costs a lead or breaks a submission. The optional
  private-app token adds the diagnosis as a note on the contact.
- `config.sample.php` — template for the server-managed `config.php`.

### Form protection — Google reCAPTCHA v3

Invisible and score-based: no puzzles, no checkbox. The script loads on the
first focus inside a form (not on every page view), and the backend verifies
the token with Google before doing anything with the submission.

Setup, once:

1. [google.com/recaptcha/admin](https://www.google.com/recaptcha/admin) →
   register a site → **reCAPTCHA v3** → domains `novieri.com`, `www.novieri.com`
   (add `localhost` if you want to test locally).
2. Copy the **site key** into the repo variable `RECAPTCHA_SITE_KEY`
   (Settings → Secrets and variables → Actions → **Variables**, not Secrets —
   it ships in the HTML and is public by design).
3. Copy the **secret key** into `recaptcha_secret` in `api/config.php` on the
   server. That half is secret and never leaves GoDaddy.
4. Re-run the deploy. Verify a real submission still arrives, then watch the
   reCAPTCHA admin console for a day and tune `recaptcha_min_score` (default
   0.5) if legitimate submissions are being turned away.

Behaviour: no secret configured → verification is skipped entirely (nothing
breaks before setup). Secret configured but no token → rejected. Token
present but Google unreachable → **allowed**, and logged: a lead lost to
someone else's outage costs more than the spam it stops. The badge is hidden
because it lands on top of the chat launcher, which Google permits as long as
the attribution text is shown — it is, under both forms.

### Chatbot guardrails

The chatbot spends money on every message, so the endpoint assumes the caller
is hostile. Verified locally against each case:

| Guard | Behaviour |
|---|---|
| **Origin** | POST without an `Origin`/`Referer` from this host (or an entry in `allowed_origins`) → `403`. A browser always sends one; a script usually doesn't. Also applied to `contact.php` and `diagnose.php`. |
| **Per-IP limits** | 5/min · 20/15 min · `chat_daily_per_ip` (60) per day → `429`, and the widget shows a "write to us instead" message. |
| **Site-wide daily cap** | `chat_daily_total` (800/day) across all IPs — the ceiling that holds when someone rotates addresses. `diagnose_daily_total` (100/day) does the same for the report. |
| **Input size** | 1 000 characters per message (`413`), 8 000 per conversation, 12 turns kept, control/formatting characters stripped. |
| **Reply size** | `max_tokens` 700, answers capped at ~120 words by the prompt. |
| **Forged history** | Every reply is returned with an HMAC; the widget echoes it back and the server rejects any `assistant` turn it didn't write (`400`). Without this, a caller could put words in the bot's mouth — the cheapest jailbreak there is. Roles must also start at `user` and alternate strictly. |
| **Scope** | The system prompt answers only from the company profile: no code, no translation, no homework, no other companies, no pricing, no commitments, no model/provider disclosure, and it treats visitor text as data rather than instructions. |

The key that spends the money (`anthropic_api_key`) lives only in
`api/config.php` on the server — never in the repo, never in the built HTML,
never sent to the browser.

Local test: `php -S localhost:8223 -t server/api` (copy `messages/*.json` to
`server/api/data/` and create a `config.php` first — both are gitignored).

Note on page-level tracking snippets: static HTML can't read `config.php`.
Analytics that must render **on the pages** goes in at build time — Plausible
is already wired via `NEXT_PUBLIC_PLAUSIBLE_DOMAIN`; other snippets can be
added the same way in `src/app/[locale]/layout.tsx`.
