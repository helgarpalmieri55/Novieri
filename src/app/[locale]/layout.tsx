import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { clash, satoshi, jetbrainsMono } from "../fonts";
import { site } from "@/config/site";
import { JsonLd, organizationJsonLd } from "@/lib/seo";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import RevealInit from "@/components/RevealInit";
import WhatsAppFloat from "@/components/WhatsAppFloat";
import ChatWidget from "@/components/ChatWidget";
import CookieBanner from "@/components/CookieBanner";
import Analytics from "@/components/Analytics";
import "../globals.css";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  return {
    metadataBase: new URL(site.url),
    title: {
      default: t("home.title"),
      template: "%s",
    },
    description: t("home.description"),
  };
}

export const viewport: Viewport = {
  themeColor: "#0c0a10",
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <html lang={locale} className={`${clash.variable} ${satoshi.variable} ${jetbrainsMono.variable}`}>
      <body>
        {/* Opt into animations before first paint; content stays visible without JS */}
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }} />
        <NextIntlClientProvider messages={messages}>
          <Header />
          <main id="main">{children}</main>
          <Footer locale={locale} />
          {locale === "es" && <WhatsAppFloat />}
          <ChatWidget />
          <CookieBanner />
          <Analytics />
          <RevealInit />
        </NextIntlClientProvider>
        <JsonLd data={organizationJsonLd} />
      </body>
    </html>
  );
}
