import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

const headlines = [
  { code: "01", label: "voice", text: "Speak it." },
  { code: "02", label: "task", text: "Ship it." },
  { code: "03", label: "see", text: "See it." },
];

export default function Landing() {
  return (
    <main className="relative min-h-svh overflow-hidden">
      {/* ambient mesh */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-80"
        style={{
          background:
            "radial-gradient(60% 50% at 18% 12%, rgba(201,255,62,0.12), transparent 60%), radial-gradient(50% 40% at 82% 88%, rgba(255,92,77,0.10), transparent 70%)",
        }}
      />

      {/* top bar */}
      <header className="flex items-center justify-between px-8 pt-8 sm:px-16">
        <div className="flex items-baseline gap-3">
          <span aria-hidden className="block size-2 rounded-full bg-(--color-signal)" />
          <span className="font-mono text-xs tracking-wider uppercase">Pulse / 0.1</span>
        </div>
        <nav className="flex items-center gap-6 font-mono text-xs tracking-wider uppercase">
          <Link href="#manifesto" className="text-(--color-prose-mute) hover:text-(--color-prose)">
            Manifesto
          </Link>
          <Link
            href="/workspace"
            className="inline-flex items-center gap-1.5 border border-(--color-signal) px-3 py-1.5 text-(--color-signal) hover:bg-(--color-signal-dim)"
          >
            Enter <ArrowUpRight size={12} strokeWidth={1.25} />
          </Link>
        </nav>
      </header>

      {/* hero */}
      <section className="grid grid-cols-12 gap-x-6 px-8 pt-24 pb-16 sm:px-16">
        <p className="font-mono col-span-12 mb-8 text-xs tracking-[0.18em] text-(--color-prose-mute) uppercase md:col-span-2">
          PromptWars · Build with AI
        </p>
        <h1 className="font-display col-span-12 text-[14vw] leading-[0.9] font-light tracking-tight text-balance md:col-span-10 md:text-[10vw]">
          {headlines.map((h, i) => (
            <span key={h.code} className="block">
              <em className="font-voice text-(--color-signal)">{h.text}</em>
              {i < headlines.length - 1 && <span className="text-(--color-prose-mute)">{" / "}</span>}
            </span>
          ))}
        </h1>
        <div className="col-span-12 mt-12 grid grid-cols-12 gap-x-6 md:col-start-3 md:col-span-9">
          <div className="col-span-12 md:col-span-7">
            <p className="text-lg leading-relaxed text-(--color-prose-mute)">
              Pulse turns scattered standups, slacks, and meetings into one live signal — tasks
              extracted as you speak, blockers surfaced before they bite, every team move visible
              on a single editorial dashboard.
            </p>
          </div>
          <div className="col-span-12 mt-8 flex items-center gap-4 md:col-span-5 md:mt-0 md:justify-end">
            <Link
              href="/workspace"
              className="font-mono inline-flex items-center gap-2 bg-(--color-signal) px-5 py-3 text-sm tracking-wider text-(--color-ink) uppercase hover:opacity-90"
            >
              Enter the Floor <ArrowUpRight size={14} strokeWidth={1.5} />
            </Link>
            <span className="font-mono text-xs text-(--color-prose-mute)">⌘ + ⇧ + Space</span>
          </div>
        </div>
      </section>

      {/* ticker preview */}
      <section
        aria-label="live signals"
        className="border-t border-b border-(--color-rule) bg-(--color-ink-2)/60 backdrop-blur-sm"
      >
        <div className="flex items-center gap-6 px-8 py-4 sm:px-16">
          <span className="font-mono shrink-0 text-[10px] tracking-[0.22em] text-(--color-signal) uppercase">
            ◉ live ticker
          </span>
          <div
            className="relative min-w-0 flex-1 overflow-hidden"
            style={{
              maskImage:
                "linear-gradient(to right, transparent 0, black 6%, black 94%, transparent 100%)",
              WebkitMaskImage:
                "linear-gradient(to right, transparent 0, black 6%, black 94%, transparent 100%)",
            }}
          >
            <ul
              className="font-mono flex w-max animate-[ticker-scroll_60s_linear_infinite] gap-12 text-xs whitespace-nowrap motion-reduce:animate-none"
              role="log"
              aria-live="off"
            >
              {[
                "09:42 › @maya › 'shipping the auth flow today, blocked on tokens'",
                "09:44 › @ravi › 'finished payments PR, ready for review'",
                "09:51 › @jules › 'design review at 3, need final copy'",
                "09:55 › @san › 'blocker: staging build failing on migration'",
                "10:02 › @kim › 'API rate limits — escalating to platform'",
              ]
                .concat([
                  "09:42 › @maya › 'shipping the auth flow today, blocked on tokens'",
                  "09:44 › @ravi › 'finished payments PR, ready for review'",
                  "09:51 › @jules › 'design review at 3, need final copy'",
                  "09:55 › @san › 'blocker: staging build failing on migration'",
                  "10:02 › @kim › 'API rate limits — escalating to platform'",
                ])
                .map((row, i) => (
                  <li key={i} className="text-(--color-prose-mute)">
                    {row}
                  </li>
                ))}
            </ul>
          </div>
        </div>
      </section>

      {/* manifesto */}
      <section id="manifesto" className="grid grid-cols-12 gap-x-6 px-8 py-24 sm:px-16">
        <p className="font-mono col-span-12 mb-6 text-xs tracking-[0.18em] text-(--color-prose-mute) uppercase md:col-span-3">
          ⌥ 01 / Manifesto
        </p>
        <h2 className="font-display col-span-12 text-4xl font-light text-balance md:col-span-9 md:text-6xl">
          Most team tools are{" "}
          <span className="font-voice text-(--color-prose-mute)">graveyards of intent.</span>{" "}
          Pulse is a <em className="font-voice text-(--color-signal)">heartbeat.</em>
        </h2>
      </section>

      {/* footer */}
      <footer className="flex items-end justify-between border-t border-(--color-rule) px-8 py-6 sm:px-16">
        <span className="font-mono text-[10px] tracking-[0.18em] text-(--color-prose-mute) uppercase">
          © 2026 Pulse · built on Gemini 3
        </span>
        <span className="font-mono text-[10px] text-(--color-prose-mute)">v0.1.0</span>
      </footer>
    </main>
  );
}
