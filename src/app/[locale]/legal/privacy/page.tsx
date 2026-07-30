import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import LegalPageTemplate from "@/components/LegalPageTemplate";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return pageMetadata(locale, "legalPrivacy", "/legal/privacy");
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return <LegalPageTemplate locale={locale} doc="privacy" />;
}
