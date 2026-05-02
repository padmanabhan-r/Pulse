"use client";

import { useEffect, useRef } from "react";

export interface TickerEntry {
  time: string;
  user: string;
  text: string;
  kind: "voice" | "task" | "blocker";
}

const KIND_TOKEN: Record<TickerEntry["kind"], string> = {
  voice: "voice",
  task: "task",
  blocker: "block",
};

export function Ticker({ entries }: { entries: TickerEntry[] }) {
  const ref = useRef<HTMLOListElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const li = ref.current.firstElementChild as HTMLElement | null;
    li?.animate(
      [
        { opacity: 0, transform: "translateY(6px)" },
        { opacity: 1, transform: "translateY(0)" },
      ],
      { duration: 320, easing: "cubic-bezier(0.16,1,0.3,1)" },
    );
  }, [entries]);

  return (
    <section
      aria-label="live team signal ticker"
      className="border border-(--color-rule) bg-(--color-ink-2)/60 backdrop-blur-sm"
    >
      <header className="flex items-baseline justify-between px-5 py-3">
        <p className="font-mono text-[10px] tracking-[0.22em] text-(--color-signal) uppercase">
          ◉ live ticker
        </p>
        <p className="font-mono text-[10px] tracking-[0.18em] text-(--color-prose-mute) uppercase">
          voice · task · blocker · realtime
        </p>
      </header>
      <div className="rule-signal" />
      <ol
        ref={ref}
        role="log"
        aria-live="polite"
        aria-relevant="additions"
        className="font-mono divide-y divide-(--color-rule)/60 text-xs"
      >
        {entries.map((e, i) => {
          const isBlocker = e.kind === "blocker";
          return (
            <li
              key={`${e.time}-${i}`}
              className="grid grid-cols-12 items-center gap-3 px-5 py-2.5 transition-colors hover:bg-(--color-ink-3)"
            >
              <span className="col-span-2 text-(--color-prose-mute) sm:col-span-1">{e.time}</span>
              <span className="col-span-2 sm:col-span-1">
                <KindBadge kind={e.kind} />
              </span>
              <span className="col-span-3 text-(--color-prose-mute) sm:col-span-2">@{e.user}</span>
              <span
                className={`font-voice col-span-12 sm:col-span-7 lg:col-span-7 text-base ${
                  isBlocker ? "text-(--color-alert)" : "text-(--color-prose)"
                }`}
              >
                “{e.text}”
              </span>
              <span className="font-mono col-span-12 hidden text-right text-(--color-prose-mute) lg:col-span-1 lg:block">
                {KIND_TOKEN[e.kind]}
              </span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function KindBadge({ kind }: { kind: TickerEntry["kind"] }) {
  const map = {
    voice: "border-(--color-rule) text-(--color-prose-mute)",
    task: "border-(--color-signal) text-(--color-signal)",
    blocker: "border-(--color-alert) text-(--color-alert)",
  } as const;
  return (
    <span
      className={`inline-block border px-1.5 py-px text-[9px] tracking-widest uppercase ${map[kind]}`}
    >
      {kind}
    </span>
  );
}
