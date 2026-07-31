import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { AppPathname } from "@/i18n/routing";
import { pageMetadata } from "@/lib/seo";
import PageHero from "@/components/PageHero";
import CtaBand from "@/components/CtaBand";

const PILLARS: { key: string; href: AppPathname; accent: string }[] = [
  { key: "ai", href: "/services/ai-automation", accent: "text-plum" },
  { key: "managedIt", href: "/services/managed-it", accent: "text-teal" },
  { key: "security", href: "/services/cybersecurity-compliance", accent: "text-gold-deep" },
  { key: "software", href: "/services/custom-software", accent: "text-ink-muted" },
];

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return pageMetadata(locale, "services", "/services");
}

export default async function ServicesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("servicesIndex");
  const tp = await getTranslations("pillars");
  const tc = await getTranslations("common");
  const tsc = await getTranslations("serviceCommon");

  return (
    <>
      <PageHero eyebrow={t("eyebrow")} title={t("title")} intro={t("intro")} />
      <div aria-hidden className="seam" />
      <section className="section-pad">
        <div className="container-site grid gap-4.5 md:grid-cols-2">
          {PILLARS.map((p, i) => (
            <Link
              key={p.key}
              href={p.href}
              className="card-hairline reveal group flex flex-col gap-4 p-9"
              style={{ ["--rd" as string]: `${i * 70}ms` }}
            >
              <span className={`idx-mono ${p.accent}`}>··0{i + 1}</span>
              <h2 className="text-h4">{tp(`${p.key}.name`)}</h2>
              <p className="grow text-ink-muted">{tp(`${p.key}.tagline`)}</p>
              <span className="flex flex-wrap gap-1.5">
                {(tp.raw(`${p.key}.tags`) as string[]).map((tag) => (
                  <span key={tag} className="tag-mono">
                    {tag}
                  </span>
                ))}
              </span>
              <span className="mt-1 inline-flex items-center gap-1.5 font-medium text-plum transition-[gap] duration-200 group-hover:gap-3">
                {tc("learnMore")} <span aria-hidden>→</span>
              </span>
            </Link>
          ))}
        </div>
      </section>
      <CtaBand title={tsc("ctaTitle")} subtitle={tsc("ctaSubtitle")} button={tc("bookCall")} />
    </>
  );
}
