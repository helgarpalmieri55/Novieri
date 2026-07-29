"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { AppPathname } from "@/i18n/routing";
import LocaleSwitcher from "./LocaleSwitcher";

const PILLARS: { key: string; href: AppPathname }[] = [
  { key: "ai", href: "/services/ai-automation" },
  { key: "managedIt", href: "/services/managed-it" },
  { key: "security", href: "/services/cybersecurity-compliance" },
  { key: "software", href: "/services/custom-software" },
];

const SOLUTIONS: { key: string; href: AppPathname }[] = [
  { key: "aiAssistant", href: "/solutions/ai-virtual-assistant" },
  { key: "whatsapp", href: "/solutions/whatsapp-ai-assistant" },
  { key: "itSuite", href: "/solutions/it-management-rmm" },
  { key: "monitoring", href: "/solutions/systems-monitoring" },
  { key: "visitorIntel", href: "/solutions/visitor-intelligence" },
  { key: "sentinel", href: "/solutions/vulnerability-management" },
  { key: "ventia", href: "/solutions/ventia" },
  { key: "matterFlow", href: "/solutions/matter-flow" },
  { key: "webDev", href: "/solutions/ai-websites" },
];

type Menu = "services" | "solutions" | null;

export default function Header() {
  const t = useTranslations("nav");
  const tp = useTranslations("pillars");
  const tso = useTranslations("solutions.items");
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState<Menu>(null);
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    onScroll();
    addEventListener("scroll", onScroll, { passive: true });
    return () => removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!openMenu) return;
    const onDown = (e: PointerEvent) => {
      if (!navRef.current?.contains(e.target as Node)) setOpenMenu(null);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenMenu(null);
    };
    addEventListener("pointerdown", onDown);
    addEventListener("keydown", onKey);
    return () => {
      removeEventListener("pointerdown", onDown);
      removeEventListener("keydown", onKey);
    };
  }, [openMenu]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const closeAll = () => {
    setMenuOpen(false);
    setOpenMenu(null);
  };

  const Chevron = ({ open }: { open: boolean }) => (
    <svg
      aria-hidden
      width="10"
      height="6"
      viewBox="0 0 10 6"
      fill="none"
      className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}
    >
      <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );

  return (
    <header
      className={`fixed inset-x-0 top-0 z-40 transition-colors duration-300 ${
        scrolled || menuOpen
          ? "border-b border-line bg-white/85 backdrop-blur-xl"
          : "border-b border-transparent bg-gradient-to-b from-white/80 to-transparent"
      }`}
    >
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-white focus:px-4 focus:py-2 focus:text-ink"
      >
        {t("skipToContent")}
      </a>
      <div className="container-site flex h-[72px] items-center gap-6">
        <Link href="/" aria-label={t("homeLink")} onClick={closeAll} className="mr-auto flex items-center gap-2.5">
          <Image src="/brand/novieri-isotipo-color-256px.png" alt="" width={32} height={33} priority />
          <span className="font-display text-[21px] font-semibold leading-none text-ink">novieri</span>
        </Link>

        <nav ref={navRef} className="hidden items-center gap-6 md:flex" aria-label={t("services")}>
          {/* Solutions dropdown */}
          <div className="relative">
            <button
              type="button"
              aria-expanded={openMenu === "solutions"}
              onClick={() => setOpenMenu((m) => (m === "solutions" ? null : "solutions"))}
              className="flex items-center gap-1.5 text-[15px] font-medium text-ink-muted transition-colors hover:text-ink"
            >
              {t("solutions")}
              <Chevron open={openMenu === "solutions"} />
            </button>
            {openMenu === "solutions" && (
              <div className="absolute left-1/2 top-full z-50 mt-4 max-h-[70vh] w-[320px] -translate-x-1/2 overflow-y-auto rounded-2xl border border-line bg-white p-2">
                {SOLUTIONS.map((s) => (
                  <Link
                    key={s.key}
                    href={s.href}
                    onClick={closeAll}
                    className="block rounded-xl px-4 py-2.5 transition-colors hover:bg-plum-wash"
                  >
                    <span className="block text-[15px] font-medium text-ink">{tso(`${s.key}.name`)}</span>
                    <span className="mt-0.5 block text-[12.5px] text-ink-muted">{tso(`${s.key}.tagline`)}</span>
                  </Link>
                ))}
                <Link
                  href="/solutions"
                  onClick={closeAll}
                  className="mt-1 block border-t border-line px-4 py-3 text-[13.5px] font-medium text-plum transition-colors hover:text-plum-deep"
                >
                  {t("solutionsMenuLabel")} →
                </Link>
              </div>
            )}
          </div>

          {/* Services dropdown */}
          <div className="relative">
            <button
              type="button"
              aria-expanded={openMenu === "services"}
              onClick={() => setOpenMenu((m) => (m === "services" ? null : "services"))}
              className="flex items-center gap-1.5 text-[15px] font-medium text-ink-muted transition-colors hover:text-ink"
            >
              {t("services")}
              <Chevron open={openMenu === "services"} />
            </button>
            {openMenu === "services" && (
              <div className="absolute left-1/2 top-full z-50 mt-4 w-[300px] -translate-x-1/2 rounded-2xl border border-line bg-white p-2">
                {PILLARS.map((p) => (
                  <Link
                    key={p.key}
                    href={p.href}
                    onClick={closeAll}
                    className="block rounded-xl px-4 py-3 transition-colors hover:bg-plum-wash"
                  >
                    <span className="block text-[15px] font-medium text-ink">{tp(`${p.key}.name`)}</span>
                    <span className="mt-0.5 block text-[13px] text-ink-muted">{tp(`${p.key}.tagline`)}</span>
                  </Link>
                ))}
                <Link
                  href="/services"
                  onClick={closeAll}
                  className="mt-1 block border-t border-line px-4 py-3 text-[13.5px] font-medium text-plum transition-colors hover:text-plum-deep"
                >
                  {t("servicesMenuLabel")} →
                </Link>
              </div>
            )}
          </div>

          <Link href="/about" className="text-[15px] font-medium text-ink-muted transition-colors hover:text-ink">
            {t("about")}
          </Link>
          <Link href="/contact" className="text-[15px] font-medium text-ink-muted transition-colors hover:text-ink">
            {t("contact")}
          </Link>
        </nav>

        <div className="hidden md:block">
          <LocaleSwitcher label={t("localeSwitcherLabel")} />
        </div>

        <Link href="/contact" className="btn btn-primary hidden !px-4.5 !py-2.5 !text-[15px] md:inline-flex">
          {t("bookCall")}
        </Link>

        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-line text-ink md:hidden"
          aria-expanded={menuOpen}
          aria-label={menuOpen ? t("closeMenu") : t("openMenu")}
          onClick={() => setMenuOpen((v) => !v)}
        >
          <svg aria-hidden width="18" height="14" viewBox="0 0 18 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
            {menuOpen ? (
              <path d="M2 2l14 10M16 2L2 12" />
            ) : (
              <path d="M1 1h16M1 7h16M1 13h16" />
            )}
          </svg>
        </button>
      </div>

      {menuOpen && (
        <div className="fixed inset-x-0 bottom-0 top-[72px] z-40 overflow-y-auto bg-white md:hidden">
          <nav className="container-site flex flex-col gap-1 py-6">
            <span className="idx-mono px-2 pb-1 lowercase text-gold-deep">·· {t("solutions")}</span>
            {SOLUTIONS.map((s) => (
              <Link
                key={s.key}
                href={s.href}
                onClick={closeAll}
                className="rounded-xl px-2 py-2.5 text-[17px] font-medium text-ink"
              >
                {tso(`${s.key}.name`)}
              </Link>
            ))}
            <div className="my-3 h-px bg-line" />
            <span className="idx-mono px-2 pb-1 lowercase text-gold-deep">·· {t("services")}</span>
            {PILLARS.map((p) => (
              <Link
                key={p.key}
                href={p.href}
                onClick={closeAll}
                className="rounded-xl px-2 py-2.5 text-[17px] font-medium text-ink"
              >
                {tp(`${p.key}.name`)}
              </Link>
            ))}
            <div className="my-3 h-px bg-line" />
            <Link href="/about" onClick={closeAll} className="rounded-xl px-2 py-3 text-[17px] font-medium text-ink">
              {t("about")}
            </Link>
            <Link href="/contact" onClick={closeAll} className="rounded-xl px-2 py-3 text-[17px] font-medium text-ink">
              {t("contact")}
            </Link>
            <div className="mt-6 flex items-center justify-between gap-4 px-2">
              <LocaleSwitcher label={t("localeSwitcherLabel")} />
              <Link href="/contact" onClick={closeAll} className="btn btn-primary">
                {t("bookCall")}
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
