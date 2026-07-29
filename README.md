# novieri.com

Bilingual (ES/EN) marketing site for Novieri — AI-first IT solutions from
Barranquilla, Colombia. Next.js 15 (App Router) · Tailwind CSS v4 · next-intl.

## Develop

```bash
npm install
npm run dev      # http://localhost:3000  (/ redirects to /es or /en by Accept-Language)
npm run build    # production build
```

## Structure

- `messages/es.json`, `messages/en.json` — all copy lives here, no hardcoded strings.
- `src/i18n/routing.ts` — localized pathnames (`/es/servicios/...` ↔ `/en/services/...`).
- `src/config/site.ts` — single config point for launch placeholders.
- `PRODUCT.md` / `DESIGN.md` — strategy + visual system (impeccable skill).
- `Logo/` — original brand assets; web copies live in `public/brand/`.

## TODO before launch (brief §9)

| Item | Where |
|---|---|
| `RESEND_API_KEY` (+ optional `CONTACT_EMAIL`, `RESEND_FROM`) | env — contact form delivery |
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
- **Drafted, needs owner review**: Matter Flow (no README provided — copy inferred
  from the name; adjust `solutions.items.matterFlow` in both `messages/*.json`),
  and AI-powered Websites (productized service, review positioning).

## Deploy

Vercel. Apex `novieri.com`; `www` → apex redirect is configured in `next.config.ts`.
