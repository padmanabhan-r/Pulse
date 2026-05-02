"use client";

import { Search } from "lucide-react";
import Link from "next/link";

const members = [
  { handle: "maya", role: "eng", active: true },
  { handle: "ravi", role: "eng", active: true },
  { handle: "jules", role: "design", active: true },
  { handle: "san", role: "platform", active: false },
  { handle: "kim", role: "platform", active: true },
];

export function WorkspaceShell({
  onMic,
  children,
}: {
  onMic: () => void;
  children: React.ReactNode;
}) {
  void onMic; // mic launched from page; reserved for cmd-shift-space wiring

  return (
    <div className="grid min-h-svh grid-cols-12 gap-x-6 px-6 py-4">
      <aside className="col-span-12 lg:col-span-3 xl:col-span-2 space-y-8 lg:sticky lg:top-4 lg:h-[calc(100svh-2rem)]">
        <div className="flex items-baseline justify-between">
          <Link href="/" className="flex items-baseline gap-2">
            <span aria-hidden className="block size-2 rounded-full bg-(--color-signal)" />
            <span className="font-mono text-xs tracking-widest uppercase">Pulse</span>
          </Link>
          <span className="font-mono text-[10px] tracking-widest text-(--color-prose-mute) uppercase">
            ws · core
          </span>
        </div>

        <div>
          <p className="font-mono text-[10px] tracking-[0.18em] text-(--color-prose-mute) uppercase">
            ◉ workspace
          </p>
          <h2 className="font-display mt-2 text-3xl leading-tight font-light">
            Build with <em className="font-voice text-(--color-signal)">AI</em>
          </h2>
          <p className="mt-1 font-mono text-[10px] tracking-widest text-(--color-prose-mute) uppercase">
            5 members · 3 active
          </p>
        </div>

        <div className="space-y-3">
          <p className="font-mono text-[10px] tracking-[0.18em] text-(--color-prose-mute) uppercase">
            ⌥ members
          </p>
          <ul className="space-y-2">
            {members.map((m) => (
              <li key={m.handle} className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span
                    aria-hidden
                    className={`block size-1.5 rounded-full ${m.active ? "bg-(--color-signal)" : "bg-(--color-prose-mute)/40"}`}
                  />
                  <span className="font-mono text-xs">@{m.handle}</span>
                </div>
                <span className="font-mono text-[10px] tracking-widest text-(--color-prose-mute) uppercase">
                  {m.role}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-2">
          <button
            type="button"
            className="font-mono inline-flex w-full items-center gap-2 border border-(--color-rule) px-3 py-2 text-[11px] tracking-widest text-(--color-prose-mute) uppercase hover:border-(--color-signal) hover:text-(--color-signal)"
          >
            <Search size={12} strokeWidth={1.5} /> Search · ⌘K
          </button>
        </div>

        <div className="mt-auto pt-4">
          <span className="font-mono text-[10px] tracking-widest text-(--color-prose-mute) uppercase">
            demo mode
          </span>
        </div>
      </aside>

      <div className="col-span-12 lg:col-span-9 xl:col-span-10">
        <header className="flex items-baseline justify-between border-b border-(--color-rule) pb-3">
          <h1 className="font-mono text-[11px] tracking-[0.22em] text-(--color-prose-mute) uppercase">
            ◉ today · 02 may 2026 — Q2 / W18
          </h1>
          <span className="font-mono text-[10px] tracking-widest text-(--color-signal) uppercase">
            ● live
          </span>
        </header>
        {children}
      </div>
    </div>
  );
}
