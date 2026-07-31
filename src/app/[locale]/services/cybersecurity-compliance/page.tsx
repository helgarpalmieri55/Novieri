import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { pageMetadata } from "@/lib/seo";
import ServicePageTemplate from "@/components/ServicePageTemplate";
import AuditConsole, { type AuditCopy } from "@/components/AuditConsole";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return pageMetadata(locale, "security", "/services/cybersecurity-compliance");
}

export default async function SecurityPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("security");

  return (
    <ServicePageTemplate
      locale={locale}
      ns="security"
      pathname="/services/cybersecurity-compliance"
      illustration={<AuditConsole copy={t.raw("audit") as AuditCopy} />}
    />
  );
}
