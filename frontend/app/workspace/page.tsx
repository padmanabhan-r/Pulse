"use client";

import { useState } from "react";
import { WorkspaceShell } from "@/components/layout/WorkspaceShell";
import { Ticker, type TickerEntry } from "@/components/ticker/Ticker";
import { KanbanBoard, type Card } from "@/components/kanban/KanbanBoard";
import { BlockerGraph } from "@/components/blockers/BlockerGraph";
import { MicOrb } from "@/components/standup/MicOrb";
import { StandupOverlay } from "@/components/standup/StandupOverlay";

const seedTicker: TickerEntry[] = [
  { time: "09:42", user: "maya", text: "shipping auth flow today, blocked on tokens", kind: "voice" },
  { time: "09:44", user: "ravi", text: "payments PR ready for review", kind: "voice" },
  { time: "09:51", user: "jules", text: "design review 3pm — need final copy", kind: "voice" },
  { time: "09:55", user: "san", text: "staging build failing on migration", kind: "blocker" },
  { time: "10:02", user: "kim", text: "API rate limits — escalating", kind: "voice" },
];

const seedCards: Card[] = [
  { id: "T-1041", title: "Wire Gemini Live token endpoint", assignee: "maya", priority: "high", status: "in_progress" },
  { id: "T-1042", title: "Kanban drag spring tuning", assignee: "ravi", priority: "low", status: "todo" },
  { id: "T-1043", title: "Slack signature unit tests", assignee: "san", priority: "medium", status: "todo" },
  { id: "T-1044", title: "Blocker graph d3 force layout", assignee: "jules", priority: "high", status: "blocked" },
  { id: "T-1045", title: "Cloud Run cold-start audit", assignee: "kim", priority: "medium", status: "done" },
];

const seedNodes = [
  { id: "maya", group: "eng" },
  { id: "ravi", group: "eng" },
  { id: "jules", group: "design" },
  { id: "san", group: "platform" },
  { id: "kim", group: "platform" },
];
const seedLinks = [
  { source: "maya", target: "san", blocked: true },
  { source: "ravi", target: "jules", blocked: false },
  { source: "jules", target: "kim", blocked: false },
  { source: "san", target: "kim", blocked: true },
];

export default function WorkspaceHome() {
  const [overlay, setOverlay] = useState(false);

  return (
    <WorkspaceShell onMic={() => setOverlay(true)}>
      <section aria-label="dashboard" className="grid grid-cols-12 gap-6 p-6">
        <div className="col-span-12 lg:col-span-8 space-y-6">
          <Ticker entries={seedTicker} />
          <KanbanBoard initialCards={seedCards} />
        </div>
        <aside className="col-span-12 lg:col-span-4 space-y-6">
          <BlockerGraph nodes={seedNodes} links={seedLinks} />
          <RiskCard score={62} />
        </aside>
      </section>
      <MicOrb onClick={() => setOverlay(true)} />
      {overlay && <StandupOverlay onClose={() => setOverlay(false)} />}
    </WorkspaceShell>
  );
}

function RiskCard({ score }: { score: number }) {
  return (
    <section
      aria-label="team risk score"
      className="border border-(--color-rule) bg-(--color-ink-2)/60 p-6 backdrop-blur-sm"
    >
      <p className="font-mono text-[10px] tracking-[0.2em] text-(--color-prose-mute) uppercase">
        ⌥ team risk
      </p>
      <p className="font-display mt-2 text-7xl leading-none font-light tracking-tight">
        {score}
        <span className="font-mono ml-1 align-top text-xs tracking-widest text-(--color-signal)">
          /100
        </span>
      </p>
      <p className="mt-3 text-sm text-(--color-prose-mute)">
        2 active blockers · 1 deadline at risk · trend{" "}
        <span className="text-(--color-signal)">↗</span>
      </p>
    </section>
  );
}
