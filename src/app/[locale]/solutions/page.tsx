import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { AppPathname } from "@/i18n/routing";
import { pageMetadata } from "@/lib/seo";
import PageHero from "@/components/PageHero";
import CtaBand from "@/components/CtaBand";
import { SOLUTIONS } from "@/config/solutions";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return pageMetadata(locale, "solutions", "/solutions");
}

export default async function SolutionsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("solutions");
  const ts = await getTranslations("solutions.common");

  return (
    <>
      <PageHero eyebrow={t("index.eyebrow")} title={t("index.title")} intro={t("index.intro")} />
      <div aria-hidden className="seam" />
      <section className="section-pad">
        <div className="container-site">
          <p className="reveal idx-mono mb-10 lowercase tracking-[0.08em] text-gold-deep">
            ·· {ts("poweredBadge")}
          </p>
          <div className="grid gap-4.5 md:grid-cols-2 xl:grid-cols-3">
            {SOLUTIONS.map((s, i) => (
              <Link
                key={s.key}
                href={s.href as AppPathname}
                className="card-hairline reveal group flex flex-col gap-3.5 p-8"
                style={{ ["--rd" as string]: `${(i % 3) * 70}ms` }}
              >
                <span aria-hidden className={`idx-mono ${s.accent}`}>
                  ··0{i + 1}
                </span>
                <h2 className="text-h4">{t(`items.${s.key}.name`)}</h2>
                <p className="grow text-small text-ink-muted">{t(`items.${s.key}.tagline`)}</p>
                <span className="flex flex-wrap gap-1.5">
                  {(t.raw(`items.${s.key}.tags`) as string[]).map((tag) => (
                    <span key={tag} className="tag-mono">
                      {tag}
                    </span>
                  ))}
                </span>
                <span className="mt-1 inline-flex items-center gap-1.5 text-small font-medium text-plum transition-[gap] duration-200 group-hover:gap-3">
                  {ts("seeSolution")} <span aria-hidden>→</span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>
      <CtaBand title={ts("ctaTitle")} subtitle={ts("ctaSubtitle")} button={ts("demoCta")} />
    </>
  );
}
