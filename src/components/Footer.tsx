import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { AppPathname } from "@/i18n/routing";
import { site, whatsappHref } from "@/config/site";

const SERVICE_LINKS: { key: string; href: AppPathname }[] = [
  { key: "ai", href: "/services/ai-automation" },
  { key: "managedIt", href: "/services/managed-it" },
  { key: "security", href: "/services/cybersecurity-compliance" },
  { key: "software", href: "/services/custom-software" },
];

export default async function Footer({ locale }: { locale: string }) {
  const t = await getTranslations("footer");
  const tp = await getTranslations("pillars");
  const tn = await getTranslations("nav");
  const tw = await getTranslations("whatsapp");
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-line bg-white">
      <div className="container-site pb-10 pt-16">
        <div className="grid grid-cols-2 gap-x-8 gap-y-10 md:grid-cols-[4fr_2fr_2fr_2fr]">
          <div className="col-span-2 md:col-span-1">
            <Image src="/brand/novieri-isotipo-color-256px.png" alt="" width={38} height={39} />
            <p className="mt-4 max-w-[34ch] text-[14.5px] text-ink-muted">{t("description")}</p>
          </div>
          <nav aria-label={t("servicesTitle")}>
            <h2 className="idx-mono mb-3.5 lowercase text-gold-deep">·· {t("servicesTitle")}</h2>
            <ul className="grid gap-2.5 text-[14.5px]">
              {SERVICE_LINKS.map((s) => (
                <li key={s.key}>
                  <Link href={s.href} className="text-ink-muted transition-colors hover:text-ink">
                    {tp(`${s.key}.name`)}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <nav aria-label={t("companyTitle")}>
            <h2 className="idx-mono mb-3.5 lowercase text-gold-deep">·· {t("companyTitle")}</h2>
            <ul className="grid gap-2.5 text-[14.5px]">
              <li>
                <Link href="/about" className="text-ink-muted transition-colors hover:text-ink">
                  {tn("about")}
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-ink-muted transition-colors hover:text-ink">
                  {tn("contact")}
                </Link>
              </li>
            </ul>
          </nav>
          <div>
            <h2 className="idx-mono mb-3.5 lowercase text-gold-deep">·· {t("contactTitle")}</h2>
            <ul className="grid gap-2.5 text-[14.5px] text-ink-muted">
              <li>
                <a href={`mailto:${site.contactEmail}`} className="transition-colors hover:text-ink">
                  {site.contactEmail}
                </a>
              </li>
              {site.whatsappNumber && (
                <li>
                  <a
                    href={whatsappHref(tw("greeting"))}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="transition-colors hover:text-ink"
                  >
                    WhatsApp
                  </a>
                </li>
              )}
              <li>{t("location")}</li>
            </ul>
          </div>
        </div>
        <div className="idx-mono mt-14 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-6 text-ink-faint">
          <span>
            {site.razonSocial && site.nit
              ? t("legal", { year, razonSocial: site.razonSocial, nit: site.nit })
              : t("legalFallback", { year })}
          </span>
          {site.linkedinUrl && (
            <a
              href={site.linkedinUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={t("linkedinLabel")}
              className="transition-colors hover:text-ink"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.36V9h3.41v1.56h.05c.47-.9 1.63-1.85 3.36-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.56V9h3.56v11.45z" />
              </svg>
            </a>
          )}
          <span className="uppercase">{locale === "es" ? "es · Barranquilla" : "en · GMT-5"}</span>
        </div>
      </div>
    </footer>
  );
}
