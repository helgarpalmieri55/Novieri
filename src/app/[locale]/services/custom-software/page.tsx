import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { pageMetadata } from "@/lib/seo";
import ServicePageTemplate from "@/components/ServicePageTemplate";
import { CodeCard } from "@/components/illustrations";

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

  return (
    <ServicePageTemplate
      locale={locale}
      ns="software"
      pathname="/services/custom-software"
      illustration={<CodeCard title="novieri · orders-api · main.py" />}
    />
  );
}
