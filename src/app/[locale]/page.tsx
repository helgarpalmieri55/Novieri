import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { AppPathname } from "@/i18n/routing";
import { pageMetadata } from "@/lib/seo";
import GemStage from "@/components/GemStage";
import PillarTicker from "@/components/PillarTicker";
import AgentConsole, { type ConsoleLine } from "@/components/AgentConsole";
import Marquee from "@/components/Marquee";
import CtaBand from "@/components/CtaBand";

const PILLARS: { key: string; href: AppPathname; accent: string }[] = [
  { key: "ai", href: "/services/ai-automation", accent: "text-plum" },
  { key: "managedIt", href: "/services/managed-it", accent: "text-teal" },
  { key: "security", href: "/services/cybersecurity-compliance", accent: "text-gold-deep" },
  { key: "software", href: "/services/custom-software", accent: "text-ink-muted" },
];

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return pageMetadata(locale, "home", "/");
}

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("home");
  const tp = await getTranslations("pillars");
  const tc = await getTranslations("common");

  const proofItems = t.raw("proof.items") as { value: string; label: string }[];
  const whyPoints = t.raw("why.points") as { title: string; body: string }[];
  const howSteps = t.raw("how.steps") as { title: string; body: string }[];
  const trustItems = t.raw("trust.items") as string[];
  const consoleLines = t.raw("console.lines") as ConsoleLine[];
  const proofColors = ["text-plum", "text-teal", "text-gold-deep", "text-ink"];

  return (
    <>
      {/* 1 · Hero — la gema viva, en blanco */}
      <section className="relative overflow-hidden bg-white pb-[clamp(3.5rem,8vh,5.5rem)] pt-[clamp(7.5rem,16vh,10rem)]">
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            backgroundImage: "radial-gradient(rgba(22,18,29,0.10) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
            maskImage: "radial-gradient(ellipse 75% 85% at 72% 30%, #000 0%, transparent 68%)",
          }}
        />
        <div className="container-site relative grid items-center gap-[clamp(2.5rem,5vw,4.5rem)] lg:grid-cols-[6fr_5fr]">
          <div>
            <div className="rise">
              <PillarTicker
                items={[
                  { name: tp("ai.name"), cls: "text-plum" },
                  { name: tp("managedIt.name"), cls: "text-teal" },
                  { name: tp("security.name"), cls: "text-gold-deep" },
                  { name: tp("software.name"), cls: "text-ink-muted" },
                ]}
              />
            </div>
            <h1 className="mt-5 max-w-[15ch]">
              <span className="rise block" style={{ ["--d" as string]: "100ms" }}>
                {t("hero.titleA")}
              </span>
              <span className="rise block text-plum" style={{ ["--d" as string]: "220ms" }}>
                {t("hero.titleB")}
              </span>
            </h1>
            <p
              className="rise mt-6 max-w-[50ch] text-[18.5px] text-ink-muted"
              style={{ ["--d" as string]: "340ms" }}
            >
              {t("hero.subtitle")}
            </p>
            <div className="rise mt-9 flex flex-wrap gap-3.5" style={{ ["--d" as string]: "460ms" }}>
              <Link href="/contact" className="btn btn-primary">
                {tc("bookCall")}
              </Link>
              <Link href="/services" className="btn btn-ghost-light">
                {tc("seeServices")}
              </Link>
            </div>
            <p
              className="rise idx-mono mt-11 tracking-[0.07em] text-ink-faint"
              style={{ ["--d" as string]: "580ms" }}
            >
              {t("hero.meta")}
            </p>
          </div>
          <div className="rise relative mx-auto w-[min(62vw,280px)] lg:w-full lg:max-w-[420px]" style={{ ["--d" as string]: "200ms" }}>
            <GemStage ringText={t("hero.ringText")} />
          </div>
        </div>
      </section>

      {/* 2 · Trust marquee */}
      <Marquee items={trustItems} label="Stack" />

      {/* 3 · Proof strip */}
      <div className="border-b border-line bg-white">
        <div className="container-site grid grid-cols-2 md:grid-cols-4">
          {proofItems.map((p, i) => (
            <div
              key={i}
              className="reveal border-line px-2 py-7 md:border-r md:px-6 md:last:border-r-0"
              style={{ ["--rd" as string]: `${i * 70}ms` }}
            >
              <div className={`font-display text-[clamp(1.75rem,3vw,2.125rem)] font-medium ${proofColors[i]}`}>
                {p.value}
              </div>
              <div className="idx-mono mt-1.5 text-ink-faint">{p.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 4 · Services */}
      <section className="section-pad">
        <div className="container-site">
          <div className="reveal mb-[clamp(2.5rem,6vh,4rem)] max-w-2xl">
            <span className="eyebrow">{t("services.eyebrow")}</span>
            <h2 className="mt-4">{t("services.title")}</h2>
          </div>
          <div className="grid grid-cols-1 gap-4.5 sm:grid-cols-2 xl:grid-cols-4">
            {PILLARS.map((p, i) => (
              <Link
                key={p.key}
                href={p.href}
                className="card-hairline reveal group flex flex-col gap-3.5 p-8 pb-7"
                style={{ ["--rd" as string]: `${i * 70}ms` }}
              >
                <span aria-hidden className={`text-[22px] font-bold leading-[0.5] tracking-[0.1em] ${p.accent}`}>
                  ··
                </span>
                <h3>{tp(`${p.key}.name`)}</h3>
                <p className="grow text-[15px] text-ink-muted">{tp(`${p.key}.tagline`)}</p>
                <span className="flex flex-wrap gap-1.5">
                  {(tp.raw(`${p.key}.tags`) as string[]).map((tag) => (
                    <span key={tag} className="tag-mono">
                      {tag}
                    </span>
                  ))}
                </span>
                <span className="mt-1 inline-flex items-center gap-1.5 text-[15px] font-medium text-plum transition-[gap] duration-200 group-hover:gap-3">
                  {tc("learnMore")} <span aria-hidden>→</span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 5 · Console — la consola en vivo */}
      <section className="dark-s relative overflow-hidden">
        <div aria-hidden className="seam absolute inset-x-0 top-0" />
        <div className="container-site section-pad grid items-center gap-[clamp(2.5rem,5vw,5rem)] lg:grid-cols-[5fr_6fr]">
          <div className="reveal">
            <span className="eyebrow">{t("console.eyebrow")}</span>
            <h2 className="mt-4">{t("console.title")}</h2>
            <p className="mt-5 max-w-[52ch] text-on-dark-muted">{t("console.body")}</p>
            <Link
              href="/services/ai-automation"
              className="mt-7 inline-flex items-center gap-2 font-medium text-gold-bright transition-[gap] duration-200 hover:gap-3.5"
            >
              {t("console.cta")} <span aria-hidden>→</span>
            </Link>
          </div>
          <div className="reveal" style={{ ["--rd" as string]: "120ms" }}>
            <AgentConsole
              barTitle={t("console.barTitle")}
              badge={t("console.badge")}
              lines={consoleLines}
              foot={{
                state: t("console.footState"),
                stateValue: t("console.footStateValue"),
                uptime: t("console.footUptime"),
                saved: t("console.footSaved"),
              }}
            />
          </div>
        </div>
      </section>

      {/* 6 · Why Novieri */}
      <section className="section-pad">
        <div className="container-site grid gap-[clamp(2.5rem,6vw,5.5rem)] lg:grid-cols-[5fr_7fr]">
          <div className="reveal">
            <span className="eyebrow">{t("why.eyebrow")}</span>
            <h2 className="mt-4">{t("why.title")}</h2>
            <div className="mt-11 border-t border-line pt-7">
              <div className="font-display text-[clamp(4rem,8vw,6rem)] font-medium leading-none tracking-tight text-gold-deep">
                {t("why.stat.value")}
              </div>
              <div className="idx-mono mt-2.5 text-ink-muted">{t("why.stat.label")}</div>
            </div>
          </div>
          <div>
            {whyPoints.map((p, i) => (
              <div
                key={i}
                className="reveal border-b border-line py-6 last:border-b-0"
                style={{ ["--rd" as string]: `${i * 70}ms` }}
              >
                <h3 className="relative pl-7 before:absolute before:left-0 before:top-0 before:font-sans before:text-[20px] before:font-bold before:tracking-[0.1em] before:text-gold before:content-['··']">
                  {p.title}
                </h3>
                <p className="mt-2 max-w-[58ch] pl-7 text-[15.5px] text-ink-muted">{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7 · How we work */}
      <section className="section-pad border-t border-line">
        <div className="container-site">
          <div className="reveal mb-[clamp(2.5rem,6vh,4rem)] max-w-2xl">
            <span className="eyebrow">{t("how.eyebrow")}</span>
            <h2 className="mt-4">{t("how.title")}</h2>
          </div>
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 xl:grid-cols-4">
            {howSteps.map((s, i) => (
              <div
                key={i}
                className="tick-grow reveal relative border-t border-line pt-5 before:absolute before:-top-px before:left-0 before:h-0.5 before:w-11 before:bg-gold before:content-['']"
                style={{ ["--rd" as string]: `${i * 90}ms` }}
              >
                <span className="idx-mono text-gold-deep">0{i + 1}</span>
                <h3 className="mt-2.5 text-[19px]">{s.title}</h3>
                <p className="mt-2 text-[15px] text-ink-muted">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8 · Founders — the fusion moment */}
      <section className="border-y border-line bg-plum-wash py-[clamp(5rem,13vh,7.5rem)]">
        <div className="container-site">
          <div className="reveal max-w-[720px]">
            <span className="eyebrow">{t("founders.eyebrow")}</span>
            <div
              aria-hidden
              className="mt-5 font-display text-[clamp(3.75rem,9vw,7.375rem)] font-semibold leading-none tracking-tight"
            >
              <span className="text-plum">nov</span>
              <span className="text-gold-deep">ieri</span>
            </div>
            <h2 className="sr-only">{t("founders.title")}</h2>
            <p className="mt-4 max-w-[54ch] text-ink-muted">{t("founders.body")}</p>
          </div>
          <Link
            href="/about"
            className="reveal mt-8 inline-flex items-center gap-2 font-medium text-plum transition-[gap] duration-200 hover:gap-3.5"
            style={{ ["--rd" as string]: "120ms" }}
          >
            {t("founders.link")} <span aria-hidden>→</span>
          </Link>
        </div>
      </section>

      {/* 9 · Final CTA */}
      <CtaBand title={t("cta.title")} subtitle={t("cta.subtitle")} button={t("cta.button")} />
    </>
  );
}
