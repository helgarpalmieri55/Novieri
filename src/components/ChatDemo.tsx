"use client";

import { useEffect, useRef, useState } from "react";

export type ChatEntry =
  | { from: "guest" | "bot"; text: string; t: string }
  | { from: "guest"; kind: "voice"; duration: string; t: string }
  | { kind: "transcript"; label: string; text: string }
  | { kind: "action"; text: string };

export type Variant = "whatsapp" | "web";

function isBot(e: ChatEntry): boolean {
  return "from" in e && e.from === "bot";
}

const WAVE = [7, 12, 18, 9, 22, 14, 20, 11, 16, 8, 19, 13, 21, 10, 15, 9];

/** Channel skins: WhatsApp wears its own palette, the site widget wears ours. */
const THEME = {
  whatsapp: {
    shell: "bg-[#0b141a]",
    bar: "border-[#222d34] bg-[#202c33]",
    name: "text-[#e9edef]",
    status: "text-[#8696a0]",
    avatar: "bg-[#25D366] text-[#0b141a]",
    guest: "bg-[#005c4b] text-[#e9edef]",
    bot: "bg-[#202c33] text-[#e9edef]",
    meta: "text-[#8696a0]",
    system: "bg-[#182229] text-[#8696a0]",
    systemLabel: "text-[#7ea6b8]",
    wave: "bg-[#a5c6bd]",
    fade: "from-[#0b141a] via-[#0b141a]/85",
    composer: "border-[#222d34] bg-[#202c33]",
    field: "bg-[#2a3942] text-[#8696a0]",
    send: "bg-[#25D366] text-[#0b141a]",
    ticks: true,
  },
  web: {
    shell: "bg-[#12101a]",
    bar: "border-[#2b2536] bg-[#1c1728]",
    name: "text-on-dark",
    status: "text-on-dark-faint",
    avatar: "bg-plum-bright text-white",
    guest: "bg-plum text-white",
    bot: "bg-[#241f31] text-on-dark",
    meta: "text-on-dark-faint",
    system: "bg-[#1c1728] text-on-dark-faint",
    systemLabel: "text-plum-bright",
    wave: "bg-plum-bright",
    fade: "from-[#12101a] via-[#12101a]/85",
    composer: "border-[#2b2536] bg-[#1c1728]",
    field: "bg-[#241f31] text-on-dark-faint",
    send: "bg-plum-bright text-white",
    ticks: false,
  },
} as const;

/** Delivered/read ticks on the guest's own messages. */
function Ticks() {
  return (
    <svg aria-hidden width="16" height="11" viewBox="0 0 16 11" fill="none" className="translate-y-[1px]">
      <path d="M1 6.2l2.4 2.4L8.2 3.8" stroke="#53bdeb" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6.4 6.2l2.4 2.4L13.6 3.8" stroke="#53bdeb" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Bubble({ entry, theme }: { entry: ChatEntry; theme: (typeof THEME)[Variant] }) {
  // Centered system rows: what the assistant understood, and what it did.
  if ("kind" in entry && entry.kind === "transcript") {
    return (
      <div className="my-1 flex justify-center">
        <p className={`max-w-[85%] rounded-lg px-3 py-1.5 text-center text-[12.5px] leading-relaxed ${theme.system}`}>
          <span className={`idx-mono mr-1.5 uppercase tracking-[0.08em] ${theme.systemLabel}`}>{entry.label}</span>
          {entry.text}
        </p>
      </div>
    );
  }
  if ("kind" in entry && entry.kind === "action") {
    return (
      <div className="my-1 flex justify-center">
        <p className="flex max-w-[90%] items-center gap-2 rounded-lg border border-gold-deep/45 bg-[#1b1a16] px-3 py-1.5 text-center text-[12.5px] text-gold-bright">
          <svg aria-hidden width="12" height="12" viewBox="0 0 14 14" fill="none" className="flex-none">
            <path d="M2 7.5l3.2 3.2L12 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {entry.text}
        </p>
      </div>
    );
  }

  const bot = isBot(entry);
  const bubble = bot
    ? `mr-auto rounded-2xl rounded-tl-md ${theme.bot}`
    : `ml-auto rounded-2xl rounded-tr-md ${theme.guest}`;

  return (
    <div className={`mb-2 max-w-[85%] px-3 pb-1.5 pt-2 text-[14.5px] leading-[1.5] ${bubble}`}>
      {"kind" in entry && entry.kind === "voice" ? (
        <div className="flex items-center gap-2.5 py-0.5">
          <svg aria-hidden width="20" height="20" viewBox="0 0 20 20" fill="currentColor" className="flex-none opacity-90">
            <path d="M7 4.5v11l9-5.5-9-5.5z" />
          </svg>
          <span aria-hidden className="flex flex-none items-center gap-[2.5px]">
            {WAVE.map((h, i) => (
              <span key={i} className={`w-[2px] rounded-full ${theme.wave}`} style={{ height: `${h}px` }} />
            ))}
          </span>
        </div>
      ) : (
        <p className="whitespace-pre-wrap">{"text" in entry ? entry.text : ""}</p>
      )}
      <span className={`mt-0.5 flex items-center justify-end gap-1 text-[11px] ${theme.meta}`}>
        {"kind" in entry && entry.kind === "voice" && <span className="mr-auto text-[11px]">{entry.duration}</span>}
        {"t" in entry && entry.t}
        {!bot && theme.ticks && <Ticks />}
      </span>
    </div>
  );
}

function Typing({ theme }: { theme: (typeof THEME)[Variant] }) {
  return (
    <div className={`mb-2 mr-auto flex w-16 items-center justify-center gap-1 rounded-2xl rounded-tl-md px-4 py-3.5 ${theme.bot}`}>
      {[0, 1, 2].map((d) => (
        <span
          key={d}
          className={`dot-pulse h-1.5 w-1.5 rounded-full ${theme.wave}`}
          style={{ ["--dd" as string]: `${d * 150}ms` }}
        />
      ))}
    </div>
  );
}

/**
 * A real conversation with one of our assistants: the guest writes (and may
 * send a voice note), the assistant answers and acts — each action it
 * performs shows as a chip. Messages arrive on a loop, with a typing
 * indicator before every reply. Reduced motion / no JS renders the whole
 * conversation statically.
 *
 * `variant` switches channel: "whatsapp" wears WhatsApp's own palette;
 * "web" is the on-site chat widget, in brand colours.
 */
export default function ChatDemo({
  header,
  badge,
  entries,
  foot,
  inputHint,
  variant = "whatsapp",
}: {
  header: { name: string; status: string };
  badge: string;
  entries: ChatEntry[];
  foot: string[];
  inputHint: string;
  variant?: Variant;
}) {
  const [count, setCount] = useState(entries.length);
  const [typing, setTyping] = useState(false);
  const [animate, setAnimate] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    setAnimate(true);
    setCount(0);

    let i = 0;
    const schedule = (fn: () => void, ms: number) => {
      timer.current = setTimeout(fn, ms);
    };

    const next = () => {
      if (i >= entries.length) {
        // Hold the finished conversation, then replay it.
        schedule(() => {
          i = 0;
          setCount(0);
          schedule(next, 900);
        }, 7000);
        return;
      }
      const entry = entries[i];
      // The assistant "thinks" before answering; everything else lands at once.
      if (isBot(entry)) {
        setTyping(true);
        schedule(() => {
          setTyping(false);
          i += 1;
          setCount(i);
          schedule(next, 1100);
        }, 1000);
      } else {
        i += 1;
        setCount(i);
        schedule(next, "kind" in entry && entry.kind === "action" ? 1200 : 900);
      }
    };

    schedule(next, 700);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [entries]);

  const visible = animate ? entries.slice(0, count) : entries;
  const theme = THEME[variant];

  return (
    <div className="relative mx-auto w-full max-w-[440px]">
      <div
        aria-hidden
        className="absolute -inset-px rounded-[17px] bg-gradient-to-br from-teal-bright via-plum-bright to-gold-bright"
      />
      <div className={`relative overflow-hidden rounded-2xl ${theme.shell}`}>
        {/* Chat header */}
        <div className={`flex items-center gap-3 border-b px-4 py-3 ${theme.bar}`}>
          <span
            aria-hidden
            className={`flex h-9 w-9 flex-none items-center justify-center rounded-full ${theme.avatar}`}
          >
            {variant === "whatsapp" ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.64.07-.3-.15-1.26-.46-2.4-1.47-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.6.13-.14.3-.35.44-.53.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.5 0 1.47 1.07 2.9 1.22 3.1.15.2 2.1 3.2 5.1 4.49.71.3 1.27.49 1.7.63.72.23 1.37.2 1.88.12.58-.09 1.76-.72 2.01-1.42.25-.7.25-1.3.17-1.42-.07-.12-.27-.2-.57-.35zM12.05 21.79h-.01a9.87 9.87 0 0 1-5.03-1.38l-.36-.21-3.74.98 1-3.65-.24-.37a9.86 9.86 0 0 1-1.51-5.26c0-5.45 4.44-9.88 9.9-9.88a9.83 9.83 0 0 1 7 2.9 9.83 9.83 0 0 1 2.89 7c0 5.45-4.44 9.87-9.9 9.87zm8.42-18.3A11.8 11.8 0 0 0 12.05 0C5.5 0 .16 5.34.16 11.9c0 2.1.55 4.14 1.59 5.95L.06 24l6.3-1.65a11.9 11.9 0 0 0 5.68 1.45h.01c6.55 0 11.89-5.34 11.89-11.9a11.82 11.82 0 0 0-3.47-8.41z" />
              </svg>
            ) : (
              /* Site-widget mark: the brand's four-point star */
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2 C13 8 16 11 22 12 C16 13 13 16 12 22 C11 16 8 13 2 12 C8 11 11 8 12 2 Z" />
              </svg>
            )}
          </span>
          <div className="min-w-0">
            <p className={`truncate text-[14.5px] font-medium leading-tight ${theme.name}`}>{header.name}</p>
            <p className={`mt-0.5 truncate text-[12px] ${theme.status}`}>{header.status}</p>
          </div>
          <span className="ml-auto flex-none rounded-full border border-[#3a3145] px-2.5 py-0.5 text-[10.5px] tracking-[0.08em] text-gold-bright">
            {badge}
          </span>
        </div>

        {/* Conversation */}
        <div className="relative h-[clamp(360px,50vh,440px)]">
          <div
            aria-hidden
            className={`pointer-events-none absolute inset-x-0 top-0 z-10 h-16 bg-gradient-to-b to-transparent ${theme.fade}`}
          />
          <div className="flex h-full flex-col justify-end overflow-hidden px-3.5 pb-3 pt-4" aria-live="off">
            {visible.map((entry, i) => (
              <Bubble key={i} entry={entry} theme={theme} />
            ))}
            {typing && <Typing theme={theme} />}
          </div>
        </div>

        {/* Composer (decorative) */}
        <div className={`flex items-center gap-2.5 border-t px-3.5 py-3 ${theme.composer}`}>
          <span aria-hidden className={`flex-1 truncate rounded-full px-3.5 py-2 text-[13.5px] ${theme.field}`}>
            {inputHint}
          </span>
          <span
            aria-hidden
            className={`flex h-9 w-9 flex-none items-center justify-center rounded-full ${theme.send}`}
          >
            {variant === "whatsapp" ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 15a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.92V22h2v-3.08A7 7 0 0 0 19 12h-2z" />
              </svg>
            ) : (
              <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2 7 9M14 2l-4.5 12.5L7 9 1.5 6.5 14 2z" />
              </svg>
            )}
          </span>
        </div>

        {/* Capability strip */}
        <div className={`flex flex-wrap gap-x-5 gap-y-1 border-t px-4 py-3 text-[11.5px] tracking-[0.05em] text-on-dark-faint ${theme.composer}`}>
          {foot.map((item) => (
            <span key={item}>{item}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
