"use client";

import { Mic } from "lucide-react";
import { useEffect } from "react";

export function MicOrb({ onClick }: { onClick: () => void }) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.metaKey && e.shiftKey && e.code === "Space") {
        e.preventDefault();
        onClick();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClick]);

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Start standup recording (Cmd+Shift+Space)"
      aria-pressed={false}
      className="orb-breathe fixed bottom-8 left-1/2 -translate-x-1/2 inline-flex size-16 items-center justify-center rounded-full bg-(--color-signal) text-(--color-ink) shadow-[0_8px_40px_-12px_rgba(201,255,62,0.6)] transition-transform hover:scale-105 motion-reduce:animate-none"
    >
      <Mic size={22} strokeWidth={1.5} />
      <span className="sr-only">Start standup</span>
    </button>
  );
}
