import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { pageMetadata } from "@/lib/seo";
import { site } from "@/config/site";
import PageHero from "@/components/PageHero";
import CtaBand from "@/components/CtaBand";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return pageMetadata(locale, "about", "/about");
}

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("about");
  const tc = await getTranslations("common");

  const founders = [
    {
      initials: "HP",
      name: t("founders.helgar.name"),
      role: t("founders.helgar.role"),
      bio: t("founders.helgar.bio"),
      photoAlt: t("founders.helgar.photoAlt"),
      linkedin: site.founders.helgar,
    },
    {
      // TODO before launch: add real founder photos
      initials: "SN",
      name: t("founders.partner.name"),
      role: t("founders.partner.role"),
      bio: t("founders.partner.bio"),
      photoAlt: t("founders.partner.photoAlt"),
      linkedin: site.founders.partner,
    },
  ];

  return (
    <>
      <PageHero eyebrow={t("hero.eyebrow")} title={t("hero.title")} intro={t("hero.intro")} />
      <div aria-hidden className="seam" />

      {/* The fusion moment */}
      <section className="border-b border-line bg-plum-wash py-[clamp(4rem,10vh,6.5rem)]">
        <div className="container-site">
          <div
            aria-hidden
            className="reveal font-display text-[clamp(3.75rem,10vw,8rem)] font-semibold leading-none tracking-tight"
          >
            <span className="text-plum">nov</span>
            <span className="text-gold-deep">ieri</span>
          </div>
          <div className="reveal mt-8 max-w-[68ch]" style={{ ["--rd" as string]: "100ms" }}>
            <h2 className="text-[clamp(1.375rem,2.4vw,1.75rem)]">{t("story.title")}</h2>
            <p className="mt-3.5 text-ink-muted">{t("story.body")}</p>
          </div>
        </div>
      </section>

      {/* Founders */}
      <section className="section-pad">
        <div className="container-site">
          <h2 className="reveal mb-[clamp(2.25rem,5vh,3.5rem)]">{t("founders.title")}</h2>
          <div className="grid gap-4.5 md:grid-cols-2">
            {founders.map((f, i) => (
              <div
                key={i}
                className="card-hairline reveal flex flex-col gap-5 p-8 sm:flex-row sm:items-start"
                style={{ ["--rd" as string]: `${i * 90}ms` }}
              >
                <div
                  role="img"
                  aria-label={f.photoAlt}
                  className="grid h-20 w-20 flex-none place-items-center rounded-xl border border-line bg-plum-wash font-display text-[22px] font-semibold text-plum"
                >
                  {f.initials}
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h3>{f.name}</h3>
                    {f.linkedin && (
                      <a
                        href={f.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={t("founders.linkedinLabel", { name: f.name })}
                        className="grid h-8 w-8 place-items-center rounded-lg border border-line text-ink-faint transition-colors hover:border-plum hover:text-plum"
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                          <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.36V9h3.41v1.56h.05c.47-.9 1.63-1.85 3.36-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.56V9h3.56v11.45z" />
                        </svg>
                      </a>
                    )}
                  </div>
                  <p className="idx-mono mt-1 lowercase text-gold-deep">·· {f.role}</p>
                  <p className="mt-3 text-[15.5px] text-ink-muted">{f.bio}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Barranquilla, two markets */}
      <section className="dark-s relative">
        <div aria-hidden className="seam absolute inset-x-0 top-0" />
        <div className="container-site section-pad-tight grid items-start gap-[clamp(2rem,5vw,5rem)] lg:grid-cols-[5fr_7fr]">
          <h2 className="reveal max-w-[16ch]">{t("location.title")}</h2>
          <div className="reveal" style={{ ["--rd" as string]: "100ms" }}>
            <p className="max-w-[62ch] text-lg text-on-dark-muted">{t("location.body")}</p>
            <p className="idx-mono mt-8 tracking-[0.07em] text-on-dark-faint">
              barranquilla <span className="text-gold-bright">··</span> gmt-5{" "}
              <span className="text-gold-bright">··</span> es / en
            </p>
          </div>
        </div>
      </section>

      <CtaBand title={t("cta.title")} subtitle={t("cta.subtitle")} button={tc("bookCall")} />
    </>
  );
}
