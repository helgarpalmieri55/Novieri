import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { pageMetadata } from "@/lib/seo";
import ServicePageTemplate from "@/components/ServicePageTemplate";
import { AuditCard } from "@/components/illustrations";

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
  const es = locale === "es";

  return (
    <ServicePageTemplate
      locale={locale}
      ns="security"
      pathname="/services/cybersecurity-compliance"
      illustration={
        <AuditCard
          title={es ? "novieri · revisión soc 2 — controles" : "novieri · soc 2 review — controls"}
          rows={[
            {
              label: es ? "MFA en todas las cuentas" : "MFA on every account",
              status: "ok",
              statusLabel: es ? "cumplido" : "passing",
            },
            {
              label: es ? "cifrado en reposo y tránsito" : "encryption at rest & in transit",
              status: "ok",
              statusLabel: es ? "cumplido" : "passing",
            },
            {
              label: es ? "gestión de vulnerabilidades" : "vulnerability management",
              status: "ok",
              statusLabel: es ? "cumplido" : "passing",
            },
            {
              label: es ? "plan de respuesta a incidentes" : "incident response plan",
              status: "progress",
              statusLabel: es ? "en remediación" : "remediating",
            },
            {
              label: es ? "evidencia de restauración de backups" : "backup restore evidence",
              status: "progress",
              statusLabel: es ? "en remediación" : "remediating",
            },
            {
              label: es ? "entrenamiento de concientización" : "awareness training",
              status: "todo",
              statusLabel: es ? "planificado" : "planned",
            },
          ]}
        />
      }
    />
  );
}
