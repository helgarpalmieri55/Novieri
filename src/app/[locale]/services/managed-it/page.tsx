import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { pageMetadata } from "@/lib/seo";
import ServicePageTemplate from "@/components/ServicePageTemplate";
import RmmConsole, { type RmmCopy } from "@/components/RmmConsole";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return pageMetadata(locale, "managedIt", "/services/managed-it");
}

export default async function ManagedItPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("managedIt");

  return (
    <ServicePageTemplate
      locale={locale}
      ns="managedIt"
      pathname="/services/managed-it"
      illustration={<RmmConsole copy={t.raw("rmm") as RmmCopy} />}
    />
  );
}
