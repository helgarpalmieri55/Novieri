import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { pageMetadata } from "@/lib/seo";
import ServicePageTemplate from "@/components/ServicePageTemplate";
import AgentSwarm, { type SwarmCopy } from "@/components/AgentSwarm";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return pageMetadata(locale, "software", "/services/custom-software");
}

export default async function CustomSoftwarePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("software");

  return (
    <ServicePageTemplate
      locale={locale}
      ns="software"
      pathname="/services/custom-software"
      illustration={<AgentSwarm copy={t.raw("swarm") as SwarmCopy} />}
    />
  );
}
