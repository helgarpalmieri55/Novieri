import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { pageMetadata } from "@/lib/seo";
import ServicePageTemplate from "@/components/ServicePageTemplate";
import ChatDemo, { type ChatEntry } from "@/components/ChatDemo";

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
  // The WhatsApp flow is the same conversation the home page shows, read from
  // the same copy — one assistant, two channels.
  const tw = await getTranslations("home.liveChat");
  const t = await getTranslations("ai");

  const labels = t.raw("demoLabels") as { whatsapp: string; web: string };

  return (
    <ServicePageTemplate
      locale={locale}
      ns="ai"
      pathname="/services/ai-automation"
      illustrationWide={
        <div className="grid gap-[clamp(2rem,4vw,3rem)] lg:grid-cols-2">
          <div>
            <p className="idx-mono mb-4 text-center lowercase tracking-[0.1em] text-on-dark-faint">
              ·· {labels.whatsapp}
            </p>
            <ChatDemo
              variant="whatsapp"
              header={tw.raw("header") as { name: string; status: string }}
              badge={tw("badge")}
              entries={tw.raw("entries") as ChatEntry[]}
              foot={tw.raw("foot") as string[]}
              inputHint={tw("inputHint")}
            />
          </div>
          <div>
            <p className="idx-mono mb-4 text-center lowercase tracking-[0.1em] text-on-dark-faint">
              ·· {labels.web}
            </p>
            <ChatDemo
              variant="web"
              header={t.raw("webChat.header") as { name: string; status: string }}
              badge={t("webChat.badge")}
              entries={t.raw("webChat.entries") as ChatEntry[]}
              foot={t.raw("webChat.foot") as string[]}
              inputHint={t("webChat.inputHint")}
            />
          </div>
        </div>
      }
    />
  );
}
