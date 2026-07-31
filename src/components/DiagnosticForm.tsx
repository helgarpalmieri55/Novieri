"use client";

import { useMemo, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { site } from "@/config/site";

type Option = { v: string; w: number };
type Question = { id: string; q: string; options: Option[] };
type Stage = "quiz" | "gate" | "done";

type Report = {
  headline: string;
  summary: string;
  strengths: string[];
  risks: string[];
  priorities: { title: string; body: string }[];
  closing: string;
};

const LEVEL_KEYS = ["initial", "developing", "solid", "advanced"] as const;

/**
 * Ten questions, a local score the visitor sees immediately, then the gate:
 * the AI-written report and its PDF are produced by the backend once they
 * leave their contact details. The PDF arrives as base64 in the same
 * response, so there is no file to store or clean up on the server.
 */
export default function DiagnosticForm() {
  const t = useTranslations("diagnostic");
  const tc = useTranslations("common");
  const locale = useLocale();

  const questions = t.raw("questions") as Question[];
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [stage, setStage] = useState<Stage>("quiz");
  const [touched, setTouched] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<Report | null>(null);
  const [pdf, setPdf] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const topRef = useRef<HTMLDivElement>(null);

  const current = questions[step];
  const answered = answers[current?.id] !== undefined;

  const { pct, levelKey } = useMemo(() => {
    const max = questions.length * 3;
    const total = questions.reduce((sum, q) => sum + (answers[q.id] ?? 0), 0);
    const p = Math.round((total / max) * 100);
    const idx = p >= 80 ? 3 : p >= 55 ? 2 : p >= 30 ? 1 : 0;
    return { pct: p, levelKey: LEVEL_KEYS[idx] };
  }, [answers, questions]);

  function choose(w: number) {
    setAnswers((a) => ({ ...a, [current.id]: w }));
    setTouched(false);
  }

  function next() {
    if (!answered) {
      setTouched(true);
      return;
    }
    if (step < questions.length - 1) {
      setStep(step + 1);
    } else {
      setStage("gate");
    }
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries()) as Record<string, string>;

    const errs: Record<string, string> = {};
    if (!data.name?.trim()) errs.name = t("errors.name");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email ?? "")) errs.email = t("errors.email");
    if (!data.company?.trim()) errs.company = t("errors.company");
    if (!data.consent) errs.consent = t("errors.consent");
    setFormErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`${site.apiBase}/diagnose.php`, {
        method: "POST",
        credentials: "omit",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          locale,
          contact: {
            name: data.name,
            email: data.email,
            company: data.company,
            phone: data.phone ?? "",
          },
          website: data.website ?? "",
          score: { pct, level: t(`levels.${levelKey}`) },
          answers: questions.map((q) => ({
            question: q.q,
            answer: q.options.find((o) => o.w === answers[q.id])?.v ?? "",
          })),
        }),
      });
      const body = (await res.json()) as { report?: Report; pdf?: string; error?: string };
      if (!res.ok || !body.report) {
        setError(
          body.error === "not_configured"
            ? t("errors.notConfigured", { email: site.contactEmail })
            : t("errors.failed", { email: site.contactEmail }),
        );
        return;
      }
      setReport(body.report);
      setPdf(body.pdf ?? null);
      setStage("done");
      topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch {
      setError(t("errors.failed", { email: site.contactEmail }));
    } finally {
      setBusy(false);
    }
  }

  function download() {
    if (!pdf) return;
    const bytes = Uint8Array.from(atob(pdf), (c) => c.charCodeAt(0));
    const url = URL.createObjectURL(new Blob([bytes], { type: "application/pdf" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = locale === "es" ? "diagnostico-novieri.pdf" : "novieri-diagnostic.pdf";
    a.click();
    URL.revokeObjectURL(url);
  }

  const inputCls =
    "w-full rounded-lg border border-line bg-white px-4 py-3 text-[15.5px] text-ink placeholder:text-ink-faint focus:border-plum focus:outline-none focus:ring-2 focus:ring-plum/20 transition-colors";
  const labelCls = "mb-1.5 block text-[14px] font-medium";

  return (
    <div ref={topRef} className="scroll-mt-28">
      {/* ——— Quiz ——— */}
      {stage === "quiz" && (
        <div className="card-hairline p-7 sm:p-9">
          <div className="flex items-center justify-between gap-4">
            <span className="idx-mono uppercase tracking-[0.1em] text-ink-faint">
              {t("progress", { n: step + 1, total: questions.length })}
            </span>
            <span aria-hidden className="flex gap-1.5">
              {questions.map((q, i) => (
                <span
                  key={q.id}
                  className={`h-1.5 w-1.5 rounded-full transition-colors ${
                    i === step ? "bg-plum" : answers[q.id] !== undefined ? "bg-gold" : "bg-line"
                  }`}
                />
              ))}
            </span>
          </div>

          <fieldset className="mt-6">
            <legend className="font-display text-[clamp(1.25rem,2.4vw,1.6rem)] font-semibold leading-snug">
              {current.q}
            </legend>
            <div className="mt-6 grid gap-2.5">
              {current.options.map((o) => {
                const selected = answers[current.id] === o.w;
                return (
                  <label
                    key={o.v}
                    className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 text-[15.5px] transition-colors ${
                      selected ? "border-plum bg-plum-wash" : "border-line hover:border-plum/40"
                    }`}
                  >
                    <input
                      type="radio"
                      name={current.id}
                      checked={selected}
                      onChange={() => choose(o.w)}
                      className="mt-1 h-4 w-4 flex-none accent-[#4f3461]"
                    />
                    <span>{o.v}</span>
                  </label>
                );
              })}
            </div>
            {touched && !answered && (
              <p className="mt-3 text-[13.5px] text-[#b3261e]">{t("errors.required")}</p>
            )}
          </fieldset>

          <div className="mt-8 flex items-center gap-3">
            {step > 0 && (
              <button type="button" onClick={() => setStep(step - 1)} className="btn btn-ghost-light">
                {t("back")}
              </button>
            )}
            <button type="button" onClick={next} className="btn btn-primary ml-auto">
              {step === questions.length - 1 ? t("finish") : t("next")}
            </button>
          </div>
        </div>
      )}

      {/* ——— Score preview + contact gate ——— */}
      {stage === "gate" && (
        <div className="grid gap-4.5 lg:grid-cols-[3fr_4fr]">
          <div className="card-hairline p-7">
            <span className="eyebrow">{t("preview.title")}</span>
            <p className="mt-5 font-display text-[clamp(2rem,5vw,2.75rem)] font-semibold leading-none text-plum">
              {t(`levels.${levelKey}`)}
            </p>
            <p className="idx-mono mt-3 text-ink-faint">{pct} / 100</p>
            <span aria-hidden className="mt-4 block h-2 w-full overflow-hidden rounded-full bg-line">
              <span
                className="block h-full rounded-full bg-gradient-to-r from-teal to-plum transition-[width] duration-1000"
                style={{ width: `${pct}%` }}
              />
            </span>
            <p className="mt-5 text-[15px] text-ink-muted">{t("preview.body")}</p>
          </div>

          <form onSubmit={submit} noValidate className="card-hairline p-7">
            <h2 className="text-[1.4rem]">{t("gate.title")}</h2>
            <p className="mt-2.5 text-[15px] text-ink-muted">{t("gate.body")}</p>

            {/* honeypot */}
            <div aria-hidden className="absolute -left-[9999px] h-px w-px overflow-hidden">
              <label>
                website
                <input type="text" name="website" tabIndex={-1} autoComplete="off" />
              </label>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="dg-name" className={labelCls}>
                  {t("gate.name")}
                </label>
                <input id="dg-name" name="name" type="text" autoComplete="name" className={inputCls} />
                {formErrors.name && <p className="mt-1.5 text-[13.5px] text-[#b3261e]">{formErrors.name}</p>}
              </div>
              <div>
                <label htmlFor="dg-company" className={labelCls}>
                  {t("gate.company")}
                </label>
                <input id="dg-company" name="company" type="text" autoComplete="organization" className={inputCls} />
                {formErrors.company && (
                  <p className="mt-1.5 text-[13.5px] text-[#b3261e]">{formErrors.company}</p>
                )}
              </div>
              <div>
                <label htmlFor="dg-email" className={labelCls}>
                  {t("gate.email")}
                </label>
                <input id="dg-email" name="email" type="email" autoComplete="email" className={inputCls} />
                {formErrors.email && <p className="mt-1.5 text-[13.5px] text-[#b3261e]">{formErrors.email}</p>}
              </div>
              <div>
                <label htmlFor="dg-phone" className={labelCls}>
                  {t("gate.phone")}
                </label>
                <input id="dg-phone" name="phone" type="tel" autoComplete="tel" className={inputCls} />
              </div>
            </div>

            <label className="mt-5 flex items-start gap-2.5 text-[14px] text-ink-muted">
              <input type="checkbox" name="consent" className="mt-1 h-4 w-4 flex-none accent-[#4f3461]" />
              <span>
                {t("gate.consent")}{" "}
                <Link href="/legal/privacy" className="link-accent">
                  {t("gate.privacy")}
                </Link>
              </span>
            </label>
            {formErrors.consent && <p className="mt-1.5 text-[13.5px] text-[#b3261e]">{formErrors.consent}</p>}

            <button type="submit" disabled={busy} className="btn btn-primary mt-7 w-full disabled:opacity-60">
              {busy ? t("gate.sending") : t("gate.submit")}
            </button>

            <div aria-live="polite">
              {error && (
                <p className="mt-4 rounded-lg border border-[#eec4c0] bg-[#fdf3f2] px-4 py-3 text-[15px] text-[#a13b32]">
                  {error}
                </p>
              )}
            </div>
          </form>
        </div>
      )}

      {/* ——— Report ——— */}
      {stage === "done" && report && (
        <div className="card-hairline p-7 sm:p-10">
          <span className="eyebrow">{t("result.title")}</span>
          <h2 className="mt-4 text-[clamp(1.5rem,3vw,2rem)]">{report.headline}</h2>
          <p className="mt-4 max-w-[70ch] text-ink-muted">{report.summary}</p>

          <div className="mt-8 grid gap-8 md:grid-cols-2">
            {report.strengths?.length > 0 && (
              <div>
                <h3 className="text-[17px]">{locale === "es" ? "Lo que ya tienes" : "What you already have"}</h3>
                <ul className="dot-list mt-3.5 grid gap-2 text-[15px] text-ink-muted">
                  {report.strengths.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>
            )}
            {report.risks?.length > 0 && (
              <div>
                <h3 className="text-[17px]">{locale === "es" ? "Riesgos que vemos" : "Risks we see"}</h3>
                <ul className="dot-list mt-3.5 grid gap-2 text-[15px] text-ink-muted">
                  {report.risks.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {report.priorities?.length > 0 && (
            <div className="mt-10">
              <h3 className="text-[17px]">{locale === "es" ? "Qué haríamos primero" : "What we'd do first"}</h3>
              <ol className="mt-4 grid gap-4">
                {report.priorities.map((p, i) => (
                  <li key={i} className="rounded-xl bg-plum-wash p-5">
                    <span className="idx-mono text-gold-deep">··0{i + 1}</span>
                    <p className="mt-2 font-medium">{p.title}</p>
                    <p className="mt-1.5 text-[15px] text-ink-muted">{p.body}</p>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {report.closing && <p className="mt-8 max-w-[70ch] text-ink-muted">{report.closing}</p>}

          <div className="mt-9 flex flex-wrap items-center gap-3.5">
            {pdf && (
              <button type="button" onClick={download} className="btn btn-primary">
                {t("result.download")}
              </button>
            )}
            <Link href="/contact" className="btn btn-ghost-light">
              {t("result.cta")}
            </Link>
            <span className="idx-mono text-ink-faint">{t("result.emailed")}</span>
          </div>
          <p className="mt-6 text-[14px] text-ink-faint">
            <button
              type="button"
              onClick={() => {
                setAnswers({});
                setStep(0);
                setReport(null);
                setPdf(null);
                setStage("quiz");
              }}
              className="link-accent"
            >
              {t("result.again")}
            </button>
            {" · "}
            {tc("bookCall")}
          </p>
        </div>
      )}
    </div>
  );
}
