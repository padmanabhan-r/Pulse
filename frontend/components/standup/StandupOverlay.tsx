"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2, Square, X } from "lucide-react";
import { captureMic } from "@/lib/live-audio";

interface ChipDraft {
  id: string;
  title: string;
  source: "draft" | "gemini";
  priority?: string;
  confidence?: number;
}

export interface ExtractedTaskOut {
  title: string;
  priority: string;
  confidence: number;
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8080";

export function StandupOverlay({
  onClose,
  onExtracted,
}: {
  onClose: () => void;
  onExtracted?: (tasks: ExtractedTaskOut[]) => void;
}) {
  const [transcript, setTranscript] = useState("");
  const [chips, setChips] = useState<ChipDraft[]>([]);
  const [amp, setAmp] = useState(0);
  const [extracting, setExtracting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const stopRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const stop = captureMic(
      (chunk) => setTranscript((prev) => (prev ? `${prev} ${chunk}` : chunk)),
      (a) => setAmp(a),
    );
    stopRef.current = stop;
    return () => stop();
  }, []);

  // Naive client-side chip "draft" preview while user speaks
  useEffect(() => {
    const match = /(?:need to|will|should|going to|todo:?)\s+([^.!?\n]{6,80})/i.exec(transcript);
    if (match?.[1] && !chips.some((c) => c.title === match[1])) {
      const next: ChipDraft = {
        id: `D-${chips.length + 1}`,
        title: match[1]!,
        source: "draft",
      };
      setChips((prev) => [...prev, next].slice(-5));
    }
  }, [transcript, chips]);

  async function extractAndStop() {
    stopRef.current?.();
    if (!transcript.trim()) {
      onClose();
      return;
    }
    setExtracting(true);
    setError(null);
    try {
      const resp = await fetch(`${API_BASE}/v1/demo/extract`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript }),
      });
      if (!resp.ok) throw new Error(`extract ${resp.status}`);
      const data = (await resp.json()) as { tasks: ExtractedTaskOut[] };
      const fresh: ChipDraft[] = data.tasks.map((t, i) => ({
        id: `T-${1100 + i}`,
        title: t.title,
        source: "gemini",
        priority: t.priority,
        confidence: t.confidence,
      }));
      setChips(fresh.length ? fresh : chips);
      if (data.tasks.length > 0) onExtracted?.(data.tasks);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setExtracting(false);
    }
  }

  function dismiss() {
    stopRef.current?.();
    onClose();
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Standup capture"
      className="fixed inset-0 z-50 grid grid-cols-12 bg-(--color-ink)/95 px-6 py-6 backdrop-blur-md"
    >
      <header className="col-span-12 flex items-baseline justify-between border-b border-(--color-rule) pb-3">
        <p className="font-mono text-[11px] tracking-[0.22em] text-(--color-signal) uppercase">
          ◉ recording · live
        </p>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Close standup"
          className="font-mono inline-flex items-center gap-2 text-[11px] tracking-widest text-(--color-prose-mute) uppercase hover:text-(--color-prose)"
        >
          <X size={14} strokeWidth={1.5} /> Esc
        </button>
      </header>

      <section className="col-span-12 flex flex-col items-center justify-center py-12 lg:col-span-7">
        <Waveform amp={amp} />
        <TranscriptPane text={transcript} />
        <button
          type="button"
          onClick={extractAndStop}
          disabled={extracting}
          className="font-mono mt-12 inline-flex items-center gap-2 border border-(--color-alert) px-5 py-3 text-xs tracking-widest text-(--color-alert) uppercase hover:bg-(--color-alert) hover:text-(--color-ink) disabled:opacity-40"
        >
          {extracting ? (
            <Loader2 size={12} strokeWidth={1.5} className="animate-spin" />
          ) : (
            <Square size={12} strokeWidth={1.5} fill="currentColor" />
          )}
          {extracting ? "Extracting…" : "Stop & extract"}
        </button>
        {error && (
          <p
            role="alert"
            aria-live="assertive"
            className="font-mono mt-3 text-[11px] tracking-wider text-(--color-alert)"
          >
            {error}
          </p>
        )}
      </section>

      <aside className="col-span-12 lg:col-span-5 lg:border-l lg:border-(--color-rule) lg:pl-6">
        <p className="font-mono text-[10px] tracking-[0.22em] text-(--color-signal) uppercase">
          ⌥ extracted tasks · gemini 3 flash
        </p>
        <ul className="mt-4 max-h-[60vh] space-y-2 overflow-y-auto pr-1">
          {chips.length === 0 && (
            <li className="font-mono text-xs text-(--color-prose-mute)">
              tasks materialise as you speak…
            </li>
          )}
          {chips.map((c) => {
            const verified = c.source === "gemini";
            return (
              <li
                key={c.id}
                className={`border border-dashed p-3 ${
                  verified
                    ? "border-(--color-signal) bg-(--color-signal-dim)"
                    : "border-(--color-rule) bg-(--color-ink-2)/50"
                }`}
              >
                <div className="flex items-baseline justify-between">
                  <span className="font-mono text-[10px] tracking-widest text-(--color-prose-mute)">
                    {c.id} · {verified ? `gemini · ${c.priority ?? "medium"}` : "draft"}
                  </span>
                  <span
                    className={`font-mono text-[10px] tracking-widest uppercase ${
                      verified ? "text-(--color-signal)" : "text-(--color-prose-mute)"
                    }`}
                  >
                    {verified ? `◉ ${(c.confidence ?? 0).toFixed(2)}` : "draft"}
                  </span>
                </div>
                <p className="font-display mt-2 text-base leading-snug font-light text-balance">
                  {c.title}
                </p>
              </li>
            );
          })}
        </ul>
      </aside>
    </div>
  );
}

function TranscriptPane({ text }: { text: string }) {
  // Show only the tail of the transcript so the overlay never overflows.
  const TAIL_CHARS = 320;
  const visible = useMemo(() => {
    if (!text) return "";
    if (text.length <= TAIL_CHARS) return text;
    const sliced = text.slice(-TAIL_CHARS);
    const firstSpace = sliced.indexOf(" ");
    return "… " + (firstSpace > 0 ? sliced.slice(firstSpace + 1) : sliced);
  }, [text]);

  return (
    <div
      aria-live="polite"
      className="mx-auto mt-10 flex max-h-[34vh] w-full max-w-3xl items-end overflow-hidden px-4"
      style={{
        maskImage: "linear-gradient(to bottom, transparent 0, black 18%, black 100%)",
        WebkitMaskImage: "linear-gradient(to bottom, transparent 0, black 18%, black 100%)",
      }}
    >
      <p className="font-voice w-full text-balance text-2xl leading-snug md:text-4xl">
        {visible || (
          <span className="text-(--color-prose-mute)">Speak. Pulse is listening.</span>
        )}
      </p>
    </div>
  );
}

function Waveform({ amp }: { amp: number }) {
  const bars = 48;
  return (
    <div
      aria-hidden
      className="flex h-24 w-full max-w-2xl items-center justify-center gap-[3px]"
    >
      {Array.from({ length: bars }).map((_, i) => {
        const phase = Math.sin((i / bars) * Math.PI * 2 + amp * 16);
        const h = 12 + Math.abs(phase) * (12 + amp * 80);
        return (
          <span
            key={i}
            style={{ height: `${h}px` }}
            className="block w-[3px] bg-(--color-signal) opacity-80 transition-[height] duration-75"
          />
        );
      })}
    </div>
  );
}
