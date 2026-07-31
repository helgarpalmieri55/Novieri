import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { AppPathname } from "@/i18n/routing";
import { site } from "@/config/site";

export type LegalDoc = "privacy" | "cookies" | "terms";

type Section = { h: string; p?: string[]; p2?: string[]; ul?: string[] };

const OTHER: Record<LegalDoc, { doc: LegalDoc; href: AppPathname; label: string }[]> = {
  privacy: [
    { doc: "cookies", href: "/legal/cookies", label: "cookies" },
    { doc: "terms", href: "/legal/terms", label: "terms" },
  ],
  cookies: [
    { doc: "privacy", href: "/legal/privacy", label: "privacy" },
    { doc: "terms", href: "/legal/terms", label: "terms" },
  ],
  terms: [
    { doc: "privacy", href: "/legal/privacy", label: "privacy" },
    { doc: "cookies", href: "/legal/cookies", label: "cookies" },
  ],
};

/** Slugs are derived from the numbered headings ("3. Cookies we use" -> "s3"). */
function anchor(index: number): string {
  return `s${index + 1}`;
}

export default async function LegalPageTemplate({
  locale,
  doc,
}: {
  locale: string;
  doc: LegalDoc;
}) {
  setRequestLocale(locale);
  const t = await getTranslations("legal");
  const tf = await getTranslations("footer");

  const sections = t.raw(`${doc}.sections`) as Section[];
  const vars = {
    company: site.razonSocial || site.name,
    nit: site.nit,
    email: site.contactEmail,
  };

  return (
    <>
      <section className="border-b border-line bg-white pb-[clamp(2.5rem,6vh,4rem)] pt-[clamp(7rem,14vh,9rem)]">
        <div className="container-site max-w-[68rem]">
          <span className="eyebrow">{t("common.eyebrow")}</span>
          <h1 className="mt-4 max-w-[24ch] text-[clamp(2.1rem,4.6vw,3.4rem)]">{t(`${doc}.title`)}</h1>
          <p className="mt-6 max-w-[70ch] text-ink-muted">{t(`${doc}.lead`)}</p>
          <p className="idx-mono mt-7 text-ink-faint">
            {t("common.updated")}: {t("common.updatedValue")}
          </p>
        </div>
      </section>

      <div className="container-site max-w-[68rem] grid gap-[clamp(2.5rem,5vw,4rem)] py-[clamp(3rem,8vh,5rem)] lg:grid-cols-[1fr_2.4fr]">
        {/* Contents */}
        <nav aria-label={t("common.toc")} className="lg:sticky lg:top-24 lg:self-start">
          <p className="idx-mono uppercase tracking-[0.12em] text-ink-faint">{t("common.toc")}</p>
          <ol className="mt-4 space-y-2.5 text-small">
            {sections.map((s, i) => (
              <li key={anchor(i)}>
                <a href={`#${anchor(i)}`} className="text-ink-muted transition-colors hover:text-plum">
                  {s.h}
                </a>
              </li>
            ))}
          </ol>

          <p className="idx-mono mt-9 uppercase tracking-[0.12em] text-ink-faint">{t("common.otherDocs")}</p>
          <ul className="mt-4 space-y-2.5 text-small">
            {OTHER[doc].map((o) => (
              <li key={o.doc}>
                <Link href={o.href} className="text-ink-muted transition-colors hover:text-plum">
                  {tf(o.label)}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Body */}
        <div>
          <div className="card-hairline mb-10 p-6">
            <p className="idx-mono uppercase tracking-[0.12em] text-ink-faint">{t("common.identityTitle")}</p>
            <p className="mt-3 text-small text-ink-muted">
              {interpolate(t.raw("common.identityBody") as string, vars)}
            </p>
          </div>

          {sections.map((s, i) => (
            <section key={anchor(i)} id={anchor(i)} className="mb-10 scroll-mt-24">
              <h2 className="text-h4">{s.h}</h2>
              {s.p?.map((para, j) => (
                <p key={j} className="mt-4 text-ink-muted">
                  {interpolate(para, vars)}
                </p>
              ))}
              {s.ul && (
                <ul className="dot-list mt-5 space-y-2.5 text-ink-muted">
                  {s.ul.map((item, j) => (
                    <li key={j}>{interpolate(item, vars)}</li>
                  ))}
                </ul>
              )}
              {s.p2?.map((para, j) => (
                <p key={j} className="mt-4 text-ink-muted">
                  {interpolate(para, vars)}
                </p>
              ))}
            </section>
          ))}

          <div className="mt-12 rounded-2xl bg-plum-wash p-7">
            <h2 className="text-lead">{t("common.questionsTitle")}</h2>
            <p className="mt-3 text-ink-muted">
              {interpolate(t.raw("common.questionsBody") as string, vars)}
            </p>
            <a href={`mailto:${site.contactEmail}`} className="link-accent mt-4 inline-block">
              {site.contactEmail}
            </a>
          </div>
        </div>
      </div>
    </>
  );
}

/**
 * Fills {company} / {nit} / {email} in copy that lives inside arrays.
 * A [[…]] block is dropped entirely when a placeholder inside it has no
 * value, so the legal identification reads correctly before the company's
 * razón social and NIT are filled in (no dangling "NIT —").
 */
function interpolate(text: string, vars: Record<string, string>): string {
  const fill = (s: string) => s.replace(/\{(\w+)\}/g, (m, key) => vars[key] ?? m);
  return fill(
    text.replace(/\[\[(.+?)\]\]/g, (_, inner: string) => {
      const keys = [...inner.matchAll(/\{(\w+)\}/g)].map((m) => m[1]);
      return keys.every((k) => (vars[k] ?? "") !== "") ? inner : "";
    }),
  );
}
