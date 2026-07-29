import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { pageMetadata } from "@/lib/seo";
import ServicePageTemplate from "@/components/ServicePageTemplate";
import { UptimeCard } from "@/components/illustrations";

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
  const es = locale === "es";

  return (
    <ServicePageTemplate
      locale={locale}
      ns="managedIt"
      pathname="/services/managed-it"
      illustration={
        <UptimeCard
          title={es ? "novieri · operación mensual" : "novieri · monthly operations"}
          rows={[
            { label: es ? "tickets dentro del acuerdo" : "tickets within SLA", value: "98%", pct: 98 },
            { label: "uptime", value: "99.97%", pct: 99 },
            { label: es ? "parches aplicados a tiempo" : "patches applied on time", value: "100%", pct: 100 },
            {
              label: es ? "backups verificados (restauración real)" : "backups verified (real restore)",
              value: "31/31",
              pct: 100,
            },
          ]}
        />
      }
    />
  );
}
