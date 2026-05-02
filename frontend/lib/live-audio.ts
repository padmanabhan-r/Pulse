"use client";

import { auth } from "./firebase";

const WS_BASE = process.env.NEXT_PUBLIC_WS_BASE ?? "ws://localhost:8080";

export type LiveEvent =
  | { type: "caption"; text: string }
  | { type: "extraction"; data: unknown }
  | { type: "error"; detail: string };

export interface LiveSession {
  send(text: string): void;
  stop(): void;
  amplitude(): number;
}

/**
 * Open WebSocket to Pulse live-standup endpoint. Browser microphone capture is owned
 * by the page; this module forwards transcript chunks (or audio frames in future).
 */
export async function openStandup(
  workspaceId: string,
  onEvent: (e: LiveEvent) => void,
): Promise<LiveSession> {
  const user = auth().currentUser;
  if (!user) throw new Error("not_signed_in");
  const token = await user.getIdToken();
  const url = `${WS_BASE}/v1/live/standup/${encodeURIComponent(workspaceId)}?token=${encodeURIComponent(token)}`;
  const ws = new WebSocket(url);
  let amp = 0;

  ws.addEventListener("message", (e) => {
    try {
      onEvent(JSON.parse(e.data) as LiveEvent);
    } catch {
      /* ignore non-json */
    }
  });

  return {
    send(text: string) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: "transcript_chunk", text }));
      }
    },
    stop() {
      if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type: "stop" }));
      ws.close();
    },
    amplitude() {
      return amp;
    },
  };
}

/**
 * Capture mic, compute RMS amplitude into a CSS var.
 * Returns stop fn. Uses Web Speech API for transcript when available; falls back to silent.
 */
export function captureMic(
  onChunk: (text: string) => void,
  onAmp: (amp: number) => void,
): () => void {
  const SR = (typeof window !== "undefined" &&
    ((window as unknown as { SpeechRecognition?: typeof SpeechRecognition }).SpeechRecognition ??
      (window as unknown as { webkitSpeechRecognition?: typeof SpeechRecognition }).webkitSpeechRecognition));
  const stops: Array<() => void> = [];

  if (SR) {
    const r = new SR();
    r.continuous = true;
    r.interimResults = true;
    r.lang = "en-US";
    r.onresult = (ev: SpeechRecognitionEvent) => {
      const last = ev.results[ev.results.length - 1];
      if (last && last[0]) onChunk(last[0].transcript);
    };
    r.start();
    stops.push(() => r.stop());
  }

  // Amplitude meter via Web Audio
  let raf = 0;
  let ctx: AudioContext | null = null;
  let stream: MediaStream | null = null;
  navigator.mediaDevices
    .getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } })
    .then((s) => {
      stream = s;
      ctx = new AudioContext();
      const src = ctx.createMediaStreamSource(s);
      const an = ctx.createAnalyser();
      an.fftSize = 256;
      src.connect(an);
      const buf = new Uint8Array(an.frequencyBinCount);
      const tick = () => {
        an.getByteTimeDomainData(buf);
        let sum = 0;
        for (let i = 0; i < buf.length; i++) {
          const v = ((buf[i] ?? 128) - 128) / 128;
          sum += v * v;
        }
        const rms = Math.sqrt(sum / buf.length);
        onAmp(Math.min(1, rms * 4));
        raf = requestAnimationFrame(tick);
      };
      tick();
    })
    .catch(() => {
      /* mic denied — orb stays static */
    });

  stops.push(() => {
    cancelAnimationFrame(raf);
    stream?.getTracks().forEach((t) => t.stop());
    void ctx?.close();
  });

  return () => stops.forEach((fn) => fn());
}
