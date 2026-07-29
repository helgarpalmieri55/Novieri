import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getPathname } from "@/i18n/navigation";
import type { AppPathname } from "@/i18n/routing";
import { site } from "@/config/site";
import { JsonLd } from "@/lib/seo";
import PageHero from "./PageHero";
import CtaBand from "./CtaBand";
import FaqList from "./FaqList";

type ServiceNs = "ai" | "managedIt" | "security" | "software";

export default async function ServicePageTemplate({
  locale,
  ns,
  pathname,
  illustration,
}: {
  locale: string;
  ns: ServiceNs;
  pathname: AppPathname;
  illustration: React.ReactNode;
}) {
  const t = await getTranslations(ns);
  const tsc = await getTranslations("serviceCommon");
  const tc = await getTranslations("common");
  const tp = await getTranslations("pillars");

  const items = t.raw("what.items") as { title: string; body: string }[];
  const tiers = t.raw("packages.tiers") as { name: string; blurb: string }[];
  const faqs = t.raw("faq.items") as { q: string; a: string }[];

  const serviceJsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: tp(`${ns}.name`),
    description: tp(`${ns}.tagline`),
    url: site.url + getPathname({ locale: locale as "es" | "en", href: pathname }),
    provider: { "@type": "Organization", name: "Novieri", url: site.url },
    areaServed: ["CO", "US"],
  };

  return (
    <>
      <PageHero eyebrow={t("hero.eyebrow")} title={t("hero.title")} intro={t("hero.promise")}>
        <div className="rise mt-9" style={{ ["--d" as string]: "320ms" }}>
          <Link href="/contact" className="btn btn-white">
            {tc("bookCall")}
          </Link>
        </div>
      </PageHero>
      <div aria-hidden className="seam" />

      {/* What we do */}
      <section className="section-pad">
        <div className="container-site">
          <h2 className="reveal mb-[clamp(2.25rem,5vh,3.5rem)]">{tsc("whatTitle")}</h2>
          <ul className="dot-list grid gap-x-14 gap-y-9 md:grid-cols-2">
            {items.map((item, i) => (
              <li key={i} className="reveal" style={{ ["--rd" as string]: `${(i % 2) * 80}ms` }}>
                <h3 className="text-[19px]">{item.title}</h3>
                <p className="mt-1.5 max-w-[52ch] text-[15.5px] text-ink-muted">{item.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* How it looks */}
      <section className="dark-s relative">
        <div aria-hidden className="seam absolute inset-x-0 top-0" />
        <div className="container-site section-pad-tight grid items-center gap-[clamp(2rem,5vw,4.5rem)] lg:grid-cols-[5fr_7fr]">
          <div className="reveal">
            <h2>{tsc("howTitle")}</h2>
            <p className="mt-4 max-w-[46ch] text-on-dark-muted">{t("how.caption")}</p>
          </div>
          <div className="reveal" style={{ ["--rd" as string]: "120ms" }}>
            {illustration}
          </div>
        </div>
      </section>

      {/* Packages */}
      <section className="section-pad">
        <div className="container-site">
          <div className="reveal mb-[clamp(2.25rem,5vh,3.5rem)] max-w-2xl">
            <h2>{tsc("packagesTitle")}</h2>
            <p className="mt-4 text-ink-muted">{tsc("packagesIntro")}</p>
          </div>
          <div className="grid gap-4.5 md:grid-cols-3">
            {tiers.map((tier, i) => (
              <div
                key={i}
                className="card-hairline reveal flex flex-col p-8"
                style={{ ["--rd" as string]: `${i * 80}ms` }}
              >
                <span className="idx-mono text-gold-deep">··0{i + 1}</span>
                <h3 className="mt-3">{tier.name}</h3>
                <p className="mt-2.5 grow text-[15px] text-ink-muted">{tier.blurb}</p>
                <Link href="/contact" className="link-accent mt-6 text-[15px]">
                  {tc("talkCase")}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="pb-[clamp(5rem,13vh,8rem)]">
        <div className="container-site max-w-[860px]">
          <h2 className="reveal mb-[clamp(2rem,4vh,3rem)]">{tsc("faqTitle")}</h2>
          <div className="reveal" style={{ ["--rd" as string]: "80ms" }}>
            <FaqList items={faqs} />
          </div>
        </div>
      </section>

      <CtaBand title={tsc("ctaTitle")} subtitle={tsc("ctaSubtitle")} button={tc("bookCall")} />
      <JsonLd data={serviceJsonLd} />
    </>
  );
}
