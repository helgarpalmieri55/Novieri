import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { pageUrl } from "@/lib/urls";
import type { AppPathname } from "@/i18n/routing";
import { site } from "@/config/site";
import { JsonLd } from "@/lib/seo";
import PageHero from "./PageHero";
import CtaBand from "./CtaBand";

export type SolutionKey =
  | "aiAssistant"
  | "whatsapp"
  | "itSuite"
  | "visitorIntel"
  | "ventia"
  | "matterFlow"
  | "monitoring"
  | "sentinel"
  | "webDev";

export default async function SolutionPageTemplate({
  locale,
  solution,
  pathname,
  illustration,
}: {
  locale: string;
  solution: SolutionKey;
  pathname: AppPathname;
  illustration?: React.ReactNode;
}) {
  const t = await getTranslations(`solutions.items.${solution}`);
  const ts = await getTranslations("solutions.common");
  const tc = await getTranslations("common");

  const features = t.raw("features") as { title: string; body: string }[];
  const stack = t.raw("stack") as string[];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: t("name"),
    description: t("tagline"),
    url: pageUrl(locale as "es" | "en", pathname),
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    creator: { "@type": "Organization", name: "Novieri", url: site.url },
  };

  return (
    <>
      <PageHero eyebrow={ts("eyebrow")} title={t("hero.title")} intro={t("hero.promise")}>
        <div className="rise mt-8 flex flex-wrap items-center gap-4" style={{ ["--d" as string]: "320ms" }}>
          <Link href="/contact" className="btn btn-primary">
            {ts("demoCta")}
          </Link>
          <span className="idx-mono lowercase tracking-[0.08em] text-gold-deep">·· {ts("poweredBadge")}</span>
        </div>
      </PageHero>
      <div aria-hidden className="seam" />

      {/* Features */}
      <section className="section-pad">
        <div className="container-site">
          <h2 className="reveal mb-[clamp(2.25rem,5vh,3.5rem)]">{ts("featuresTitle")}</h2>
          <ul className="dot-list grid gap-x-14 gap-y-9 md:grid-cols-2">
            {features.map((f, i) => (
              <li key={i} className="reveal" style={{ ["--rd" as string]: `${(i % 2) * 80}ms` }}>
                <h3 className="text-lead">{f.title}</h3>
                <p className="mt-1.5 max-w-[52ch] text-small text-ink-muted">{f.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Illustration (optional) + built-on strip */}
      <section className="dark-s relative">
        <div aria-hidden className="seam absolute inset-x-0 top-0" />
        <div
          className={`container-site section-pad-tight grid items-center gap-[clamp(2rem,5vw,4.5rem)] ${
            illustration ? "lg:grid-cols-[5fr_7fr]" : ""
          }`}
        >
          <div className="reveal">
            <span className="eyebrow">{ts("builtEyebrow")}</span>
            <h2 className="mt-4">{t("built.title")}</h2>
            <p className="mt-4 max-w-[52ch] text-on-dark-muted">{t("built.body")}</p>
            <div className="mt-7 flex flex-wrap gap-2">
              {stack.map((s) => (
                <span
                  key={s}
                  className="rounded-md border border-line-dark px-2.5 py-1 font-mono text-micro tracking-[0.04em] text-on-dark-muted"
                >
                  {s}
                </span>
              ))}
            </div>
          </div>
          {illustration && (
            <div className="reveal" style={{ ["--rd" as string]: "120ms" }}>
              {illustration}
            </div>
          )}
        </div>
      </section>

      {/* Powered by Novieri */}
      <section className="border-b border-line bg-plum-wash py-[clamp(3.5rem,9vh,5.5rem)]">
        <div className="container-site grid items-center gap-8 lg:grid-cols-[7fr_5fr]">
          <div className="reveal">
            <h2 className="text-h4">{ts("poweredTitle")}</h2>
            <p className="mt-3 max-w-[62ch] text-small text-ink-muted">{ts("poweredBody")}</p>
          </div>
          <div className="reveal lg:justify-self-end" style={{ ["--rd" as string]: "100ms" }}>
            <Link href="/services" className="link-accent">
              {tc("seeServices")} →
            </Link>
          </div>
        </div>
      </section>

      <CtaBand title={ts("ctaTitle")} subtitle={ts("ctaSubtitle")} button={ts("demoCta")} />
      <JsonLd data={jsonLd} />
    </>
  );
}
