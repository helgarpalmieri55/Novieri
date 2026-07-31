"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { site } from "@/config/site";
import { trackingContext } from "@/lib/hubspot";

type Status = "idle" | "sending" | "success" | "error";

export default function ContactForm() {
  const t = useTranslations("contact.form");
  const locale = useLocale();
  const [status, setStatus] = useState<Status>("idle");
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries()) as Record<string, string>;

    const nextErrors: Record<string, string> = {};
    if (!data.name?.trim()) nextErrors.name = t("validation.name");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email ?? "")) nextErrors.email = t("validation.email");
    if (!data.message?.trim()) nextErrors.message = t("validation.message");
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setStatus("sending");
    try {
      const res = await fetch(`${site.apiBase}/contact.php`, {
        credentials: "omit",
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          locale,
          ...trackingContext(),
          consentText: t("consentNote"),
        }),
      });
      if (!res.ok) throw new Error(String(res.status));
      setStatus("success");
      form.reset();
    } catch {
      setStatus("error");
    }
  }

  const inputCls =
    "w-full rounded-lg border border-line bg-white px-4 py-3 text-[15.5px] text-ink placeholder:text-ink-faint focus:border-plum focus:outline-none focus:ring-2 focus:ring-plum/20 transition-colors";
  const labelCls = "mb-1.5 block text-[14px] font-medium";

  return (
    <form onSubmit={onSubmit} noValidate>
      {/* honeypot — invisible to humans, tempting to bots */}
      <div aria-hidden className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label>
          website
          <input type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="cf-name" className={labelCls}>
            {t("name")}
          </label>
          <input
            id="cf-name"
            name="name"
            type="text"
            autoComplete="name"
            placeholder={t("namePlaceholder")}
            className={inputCls}
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? "cf-name-err" : undefined}
          />
          {errors.name && (
            <p id="cf-name-err" className="mt-1.5 text-[13.5px] text-[#b3261e]">
              {errors.name}
            </p>
          )}
        </div>
        <div>
          <label htmlFor="cf-company" className={labelCls}>
            {t("company")}
          </label>
          <input
            id="cf-company"
            name="company"
            type="text"
            autoComplete="organization"
            placeholder={t("companyPlaceholder")}
            className={inputCls}
          />
        </div>
      </div>

      <div className="mt-5">
        <label htmlFor="cf-email" className={labelCls}>
          {t("email")}
        </label>
        <input
          id="cf-email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder={t("emailPlaceholder")}
          className={inputCls}
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? "cf-email-err" : undefined}
        />
        {errors.email && (
          <p id="cf-email-err" className="mt-1.5 text-[13.5px] text-[#b3261e]">
            {errors.email}
          </p>
        )}
      </div>

      <div className="mt-5">
        <label htmlFor="cf-service" className={labelCls}>
          {t("service")}
        </label>
        <select id="cf-service" name="service" className={inputCls} defaultValue="ai">
          <option value="ai">{t("serviceOptions.ai")}</option>
          <option value="managedIt">{t("serviceOptions.managedIt")}</option>
          <option value="security">{t("serviceOptions.security")}</option>
          <option value="software">{t("serviceOptions.software")}</option>
          <option value="other">{t("serviceOptions.other")}</option>
        </select>
      </div>

      <div className="mt-5">
        <label htmlFor="cf-message" className={labelCls}>
          {t("message")}
        </label>
        <textarea
          id="cf-message"
          name="message"
          rows={5}
          placeholder={t("messagePlaceholder")}
          className={inputCls}
          aria-invalid={!!errors.message}
          aria-describedby={errors.message ? "cf-message-err" : undefined}
        />
        {errors.message && (
          <p id="cf-message-err" className="mt-1.5 text-[13.5px] text-[#b3261e]">
            {errors.message}
          </p>
        )}
      </div>

      <div className="mt-7 flex flex-wrap items-center gap-4">
        <button type="submit" disabled={status === "sending"} className="btn btn-primary disabled:opacity-60">
          {status === "sending" ? t("sending") : t("submit")}
        </button>
      </div>

      <p className="mt-4 max-w-[62ch] text-[13.5px] text-ink-faint">{t("consentNote")}</p>

      <div aria-live="polite">
        {status === "success" && (
          <p className="mt-4 rounded-lg border border-[#bfe3c8] bg-[#f0faf2] px-4 py-3 text-[15px] text-[#1a6b32]">
            {t("success")}
          </p>
        )}
        {status === "error" && (
          <p className="mt-4 rounded-lg border border-[#eec4c0] bg-[#fdf3f2] px-4 py-3 text-[15px] text-[#a13b32]">
            {t("error", { email: site.contactEmail })}
          </p>
        )}
      </div>
    </form>
  );
}
