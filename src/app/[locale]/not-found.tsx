import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export default async function NotFound() {
  const t = await getTranslations("notFound");

  return (
    <section className="relative flex min-h-screen items-center overflow-hidden bg-white">
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          backgroundImage: "radial-gradient(rgba(22,18,29,0.10) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
          maskImage: "radial-gradient(ellipse 85% 90% at 50% 0%, #000 0%, transparent 70%)",
        }}
      />
      <div className="container-site relative py-40">
        <span className="eyebrow">{t("eyebrow")}</span>
        <h1 className="mt-5 max-w-[16ch]">{t("title")}</h1>
        <p className="mt-5 max-w-[52ch] text-lg text-ink-muted">{t("body")}</p>
        <Link href="/" className="btn btn-primary mt-9">
          {t("cta")}
        </Link>
      </div>
    </section>
  );
}
