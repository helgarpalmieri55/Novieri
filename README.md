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
| `anthropic_api_key` | `api/config.php` on the server — chatbot answers 503 until set |
| SMTP mailbox + password (`smtp_user`, `smtp_pass`, `mail_to`, `mail_from`) | `api/config.php` on the server — contact form delivery |
| FTPS secrets (`FTP_SERVER`, `FTP_USERNAME`, `FTP_PASSWORD`, optional `FTP_SERVER_DIR` variable) | GitHub repo → Settings → Secrets and variables → Actions |
| `NEXT_PUBLIC_CONTACT_EMAIL` | env or `src/config/site.ts` (default hola@novieri.com) |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` (+57…, digits only) | env — WhatsApp button hidden until set |
| `NEXT_PUBLIC_CAL_LINK` (e.g. `novieri/intro`) | env — Cal.com embed shows fallback until set |
| `NEXT_PUBLIC_LINKEDIN_URL` | env — footer icon hidden until set |
| `razonSocial`, `NIT` | `src/config/site.ts` — footer legal line |
| `[WIFE_NAME]`, `[WIFE_BIO]` | `messages/*.json` (about.founders.partner) |
| Founders photo | `src/app/[locale]/about/page.tsx` placeholders |
| `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` (`novieri.com`) | env — analytics off until set |

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
- `config.sample.php` — template for the server-managed `config.php`.

Local test: `php -S localhost:8223 -t server/api` (copy `messages/*.json` to
`server/api/data/` and create a `config.php` first — both are gitignored).

Note on page-level tracking snippets: static HTML can't read `config.php`.
Analytics that must render **on the pages** goes in at build time — Plausible
is already wired via `NEXT_PUBLIC_PLAUSIBLE_DOMAIN`; other snippets can be
added the same way in `src/app/[locale]/layout.tsx`.
