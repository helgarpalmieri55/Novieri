import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { pageMetadata } from "@/lib/seo";
import PageHero from "@/components/PageHero";
import DiagnosticForm from "@/components/DiagnosticForm";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return pageMetadata(locale, "diagnostic", "/diagnostic");
}

export default async function DiagnosticPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("diagnostic");

  return (
    <>
      <PageHero eyebrow={t("eyebrow")} title={t("title")} intro={t("intro")} />
      <div aria-hidden className="seam" />
      <section className="section-pad-tight">
        <div className="container-site max-w-[62rem]">
          <DiagnosticForm />
        </div>
      </section>
    </>
  );
}
