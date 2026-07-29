import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { pageMetadata } from "@/lib/seo";
import SolutionPageTemplate from "@/components/SolutionPageTemplate";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return pageMetadata(locale, "sol_aiAssistant", "/solutions/ai-virtual-assistant");
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <SolutionPageTemplate locale={locale} solution="aiAssistant" pathname="/solutions/ai-virtual-assistant" />;
}
