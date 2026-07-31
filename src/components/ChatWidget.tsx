"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { site } from "@/config/site";

// `sig` is the server's HMAC over an assistant reply. It travels back with the
// next request so the backend can tell its own words from an injected turn.
type Msg = { role: "user" | "assistant"; content: string; sig?: string };

const MAX_CHARS = 1000;

export default function ChatWidget() {
  const t = useTranslations("chat");
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<null | "generic" | "limit">(null);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, busy]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim().slice(0, MAX_CHARS);
    if (!text || busy) return;
    setError(null);
    setInput("");
    const next: Msg[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setBusy(true);
    try {
      const res = await fetch(`${site.apiBase}/chat.php`, {
        // The backend is same-origin in production and cross-origin from a
        // preview deploy; never send cookies either way.
        credentials: "omit",
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: next.map((m) => ({ role: m.role, content: m.content, sig: m.sig })),
        }),
      });
      if (res.status === 429) {
        setError("limit");
        return;
      }
      if (!res.ok) throw new Error(String(res.status));
      const data = (await res.json()) as { reply: string; sig?: string };
      setMessages((m) => [...m, { role: "assistant", content: data.reply, sig: data.sig }]);
    } catch {
      setError("generic");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={open ? t("close") : t("open")}
        className="fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-plum text-white transition-transform duration-300 hover:scale-110"
      >
        {open ? (
          <svg aria-hidden width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M3 3l12 12M15 3L3 15" />
          </svg>
        ) : (
          <svg aria-hidden width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2 C13 8 16 11 22 12 C16 13 13 16 12 22 C11 16 8 13 2 12 C8 11 11 8 12 2 Z" />
          </svg>
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label={t("title")}
          className="fixed bottom-24 right-5 z-40 flex h-[min(70vh,540px)] w-[min(92vw,380px)] flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-[0_8px_40px_rgba(22,18,29,0.18)]"
        >
          <div className="dark-s relative flex items-center gap-3 px-5 py-4">
            <div aria-hidden className="seam absolute inset-x-0 top-0" />
            <span aria-hidden className="text-gold-bright">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2 C13 8 16 11 22 12 C16 13 13 16 12 22 C11 16 8 13 2 12 C8 11 11 8 12 2 Z" />
              </svg>
            </span>
            <div>
              <p className="text-small font-medium leading-tight">{t("title")}</p>
              <p className="idx-mono mt-0.5 lowercase text-on-dark-faint">·· novieri</p>
            </div>
          </div>

          <div ref={listRef} className="flex-1 overflow-y-auto px-4 py-4">
            <div className="mb-3 max-w-[85%] rounded-2xl rounded-tl-md bg-plum-wash px-4 py-2.5 text-small text-ink">
              {t("greeting")}
            </div>
            {messages.map((m, i) =>
              m.role === "user" ? (
                <div key={i} className="mb-3 ml-auto max-w-[85%] rounded-2xl rounded-tr-md bg-plum px-4 py-2.5 text-small text-white">
                  {m.content}
                </div>
              ) : (
                <div key={i} className="mb-3 max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-tl-md bg-plum-wash px-4 py-2.5 text-small text-ink">
                  {m.content}
                </div>
              ),
            )}
            {busy && (
              <div aria-live="polite" className="mb-3 flex w-16 items-center justify-center gap-1 rounded-2xl rounded-tl-md bg-plum-wash px-4 py-3">
                {[0, 1, 2].map((d) => (
                  <span
                    key={d}
                    className="dot-pulse h-1.5 w-1.5 rounded-full bg-plum"
                    style={{ ["--dd" as string]: `${d * 150}ms` }}
                  />
                ))}
              </div>
            )}
            {error && (
              <p className="mb-3 rounded-lg border border-[#eec4c0] bg-[#fdf3f2] px-3 py-2 text-caption text-[#a13b32]">
                {error === "limit" ? t("limit") : t("error")}
              </p>
            )}
          </div>

          <form onSubmit={send} className="flex items-center gap-2 border-t border-line p-3">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t("placeholder")}
              maxLength={MAX_CHARS}
              className="min-w-0 flex-1 rounded-lg border border-line px-3.5 py-2.5 text-small placeholder:text-ink-faint focus:border-plum focus:outline-none"
            />
            <button
              type="submit"
              disabled={busy || input.trim().length === 0}
              aria-label={t("send")}
              className="flex h-10 w-10 flex-none items-center justify-center rounded-lg bg-plum text-white transition-colors hover:bg-plum-deep disabled:opacity-40"
            >
              <svg aria-hidden width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2 7 9M14 2l-4.5 12.5L7 9 1.5 6.5 14 2z" />
              </svg>
            </button>
          </form>
        </div>
      )}
    </>
  );
}
