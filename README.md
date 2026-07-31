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
| `NEXT_PUBLIC_CAL_LINK` (e.g. `novieri/intro`) | env — Cal.com embed shows fallback until set |
| `NEXT_PUBLIC_LINKEDIN_URL` | env — footer icon hidden until set |
| `razonSocial`, `NIT` | `src/config/site.ts` — **required**: footer legal line *and* the controller identification in the legal pages (the NIT clause is omitted while empty) |
| Solutions section | `showSolutions` in `src/config/site.ts` — `false` hides nav/footer links, drops the pages from the sitemap, and marks them `noindex`. Flip to `true` to publish. |
| Founders photo | `src/app/[locale]/about/page.tsx` placeholders |
| `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` (`novieri.com`) | env — analytics off until set |
| `NEXT_PUBLIC_HUBSPOT_PORTAL_ID` | env — loads the HubSpot tracking script (only after cookie consent), which sets the `hubspotutk` cookie that attributes form submissions |
| `hubspot_portal_id`, `hubspot_form_contact`, `hubspot_form_diagnostic` | `api/config.php` — leads stop reaching the CRM while empty; email still works |
| `hubspot_token` (Private App, **not** an API key — those are deprecated) | `api/config.php` — optional, adds the diagnosis as a note on the contact |

## HubSpot

The site keeps its own forms and posts them server-side to HubSpot, so the
design and the bilingual consent copy stay ours while HubSpot still gets a
real form submission with full attribution.

Before it works, in HubSpot:

1. **Create two forms** (Marketing → Forms) — Contact and Self-diagnosis —
   and copy each GUID into `api/config.php`. The fields only need to exist;
   the forms are never embedded.
2. **Create the custom contact properties** the diagnostic writes:
   `novieri_diagnostic_score` (number), `novieri_diagnostic_level`,
   `novieri_diagnostic_headline`, `novieri_diag_q1` … `novieri_diag_q10`, and
   `novieri_service_interest` for the contact form. Unknown property names are
   rejected by the submission, so create them first.
3. Optionally create a **Private App** token for the timeline note.

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
express, informed consent, as the regulation requires.

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

## Deploy

Both workflows run on every push to `main` (and manually via *Run workflow*):

- **GitHub Pages** (`.github/workflows/deploy-pages.yml`) — preview at
  `https://<user>.github.io/Novieri/`. Static site only: the chat widget is
  hidden and the form shows its email fallback (no PHP on Pages). One-time
  setup: repo Settings → Pages → Source: **GitHub Actions**.
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
- `chat.php` — company chatbot → Claude API (`claude-opus-5`) over raw HTTPS.
  The company profile is assembled at request time from `data/es.json` +
  `data/en.json` (copies of `messages/*.json` made by the deploy), so the bot
  always matches the site. Prompt-cached system block; per-IP rate limit
  (20/5 min).
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

Local test: `php -S localhost:8223 -t server/api` (copy `messages/*.json` to
`server/api/data/` and create a `config.php` first — both are gitignored).

Note on page-level tracking snippets: static HTML can't read `config.php`.
Analytics that must render **on the pages** goes in at build time — Plausible
is already wired via `NEXT_PUBLIC_PLAUSIBLE_DOMAIN`; other snippets can be
added the same way in `src/app/[locale]/layout.tsx`.
