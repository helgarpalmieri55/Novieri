import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { pageMetadata } from "@/lib/seo";
import ServicePageTemplate from "@/components/ServicePageTemplate";
import AgentConsole, { type ConsoleLine } from "@/components/AgentConsole";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return pageMetadata(locale, "ai", "/services/ai-automation");
}

export default async function AiAutomationPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("home.console");

  return (
    <ServicePageTemplate
      locale={locale}
      ns="ai"
      pathname="/services/ai-automation"
      illustration={
        <AgentConsole
          barTitle={t("barTitle")}
          badge={t("badge")}
          lines={t.raw("lines") as ConsoleLine[]}
          foot={{
            state: t("footState"),
            stateValue: t("footStateValue"),
            uptime: t("footUptime"),
            saved: t("footSaved"),
          }}
        />
      }
    />
  );
}
