import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { pageMetadata, JsonLd } from "@/lib/seo";
import { site, whatsappHref } from "@/config/site";
import PageHero from "@/components/PageHero";
import ContactForm from "@/components/ContactForm";
import ClientMessages from "@/i18n/ClientMessages";
import MeetingsEmbed from "@/components/MeetingsEmbed";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return pageMetadata(locale, "contact", "/contact");
}

const localBusinessJsonLd = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  name: "Novieri",
  url: site.url,
  email: site.contactEmail,
  address: {
    "@type": "PostalAddress",
    addressLocality: "Barranquilla",
    addressRegion: "Atlántico",
    addressCountry: "CO",
  },
  areaServed: ["CO", "US"],
};

export default async function ContactPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("contact");
  const tw = await getTranslations("whatsapp");

  return (
    <>
      <PageHero eyebrow={t("hero.eyebrow")} title={t("hero.title")} intro={t("hero.intro")} />
      <div aria-hidden className="seam" />

      <section className="section-pad-tight pb-[clamp(5rem,13vh,8rem)]">
        <div className="container-site grid gap-[clamp(2.5rem,5vw,4.5rem)] lg:grid-cols-[6fr_5fr]">
          <div className="reveal">
            <ClientMessages only={["contact", "common"]}>
              <ContactForm />
            </ClientMessages>
            <div className="mt-9 border-t border-line pt-7">
              <ul className="grid gap-3 text-small text-ink-muted">
                {site.whatsappNumber && (
                  <li>
                    <a
                      href={whatsappHref(tw("greeting"))}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2.5 font-medium text-ink transition-colors hover:text-plum"
                    >
                      <span
                        aria-hidden
                        className="grid h-8 w-8 place-items-center rounded-full bg-[#25D366] text-white"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.64.07-.3-.15-1.26-.46-2.4-1.47-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.6.13-.14.3-.35.44-.53.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.5 0 1.47 1.07 2.9 1.22 3.1.15.2 2.1 3.2 5.1 4.49.71.3 1.27.49 1.7.63.72.23 1.37.2 1.88.12.58-.09 1.76-.72 2.01-1.42.25-.7.25-1.3.17-1.42-.07-.12-.27-.2-.57-.35zM12.05 21.79h-.01a9.87 9.87 0 0 1-5.03-1.38l-.36-.21-3.74.98 1-3.65-.24-.37a9.86 9.86 0 0 1-1.51-5.26c0-5.45 4.44-9.88 9.9-9.88a9.83 9.83 0 0 1 7 2.9 9.83 9.83 0 0 1 2.89 7c0 5.45-4.44 9.87-9.9 9.87zm8.42-18.3A11.8 11.8 0 0 0 12.05 0C5.5 0 .16 5.34.16 11.9c0 2.1.55 4.14 1.59 5.95L.06 24l6.3-1.65a11.9 11.9 0 0 0 5.68 1.45h.01c6.55 0 11.89-5.34 11.89-11.9a11.82 11.82 0 0 0-3.47-8.41z" />
                        </svg>
                      </span>
                      {t("aside.whatsappLabel")}
                    </a>
                  </li>
                )}
                <li>
                  {t("aside.emailLabel")}:{" "}
                  <a href={`mailto:${site.contactEmail}`} className="link-accent">
                    {site.contactEmail}
                  </a>
                </li>
                <li className="idx-mono lowercase tracking-[0.06em] text-ink-faint">{t("aside.location")}</li>
              </ul>
            </div>
          </div>

          <aside className="reveal" style={{ ["--rd" as string]: "120ms" }}>
            <div className="card-hairline p-7 hover:!translate-y-0 hover:!border-line">
              <h2 className="text-h4">{t("booking.title")}</h2>
              <p className="mt-2.5 text-small text-ink-muted">{t("booking.body")}</p>
              <div className="mt-5">
                {site.meetingsLink ? (
                  <MeetingsEmbed />
                ) : (
                  <p className="rounded-lg bg-plum-wash px-4 py-3.5 text-small text-ink-muted">
                    {t("booking.fallback", { email: site.contactEmail })}
                  </p>
                )}
              </div>
            </div>
          </aside>
        </div>
      </section>

      {locale === "es" && <JsonLd data={localBusinessJsonLd} />}
    </>
  );
}
