"use client";

import {
  DndContext,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

export type Status = "todo" | "in_progress" | "blocked" | "done";
export type Priority = "low" | "medium" | "high" | "urgent";

export interface Card {
  id: string;
  title: string;
  assignee: string;
  priority: Priority;
  status: Status;
}

const COLUMNS: { id: Status; label: string; code: string }[] = [
  { id: "todo", label: "To do", code: "01" },
  { id: "in_progress", label: "In progress", code: "02" },
  { id: "blocked", label: "Blocked", code: "03" },
  { id: "done", label: "Done", code: "04" },
];

export function KanbanBoard({
  cards,
  setCards,
}: {
  cards: Card[];
  setCards: React.Dispatch<React.SetStateAction<Card[]>>;
}) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  function handleDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over) return;
    const overId = String(over.id);
    const activeId = String(active.id);

    // overId is either a column id or a card id (when dropped on another card)
    let targetStatus: Status | null =
      (COLUMNS.find((c) => c.id === overId)?.id as Status | undefined) ?? null;
    if (!targetStatus) {
      const overCard = cards.find((c) => c.id === overId);
      if (overCard) targetStatus = overCard.status;
    }
    if (!targetStatus) return;

    setCards((prev) =>
      prev.map((c) => (c.id === activeId ? { ...c, status: targetStatus! } : c)),
    );
  }

  return (
    <section
      aria-label="task board"
      className="border border-(--color-rule) bg-(--color-ink-2)/60 backdrop-blur-sm"
    >
      <header className="flex items-baseline justify-between px-5 py-3">
        <p className="font-mono text-[10px] tracking-[0.22em] text-(--color-signal) uppercase">
          ⌥ board
        </p>
        <p className="font-mono text-[10px] tracking-[0.18em] text-(--color-prose-mute) uppercase">
          {cards.length} tasks · drag to move
        </p>
      </header>
      <div className="rule-signal" />
      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 divide-(--color-rule)/60 sm:grid-cols-2 sm:divide-x lg:grid-cols-4">
          {COLUMNS.map((col) => (
            <Column key={col.id} col={col} cards={cards.filter((c) => c.status === col.id)} />
          ))}
        </div>
      </DndContext>
    </section>
  );
}

function Column({ col, cards }: { col: { id: Status; label: string; code: string }; cards: Card[] }) {
  const { setNodeRef, isOver } = useDroppable({ id: col.id });
  return (
    <div
      ref={setNodeRef}
      data-droppable={col.id}
      className={`min-h-48 px-5 py-4 transition-colors ${
        isOver ? "bg-(--color-signal-dim)" : ""
      }`}
      id={col.id}
    >
      <div className="mb-3 flex items-baseline justify-between">
        <span className="font-mono text-[10px] tracking-[0.2em] uppercase">
          <span className="text-(--color-prose-mute)">{col.code} ·</span>{" "}
          <span className={col.id === "blocked" ? "text-(--color-alert)" : "text-(--color-prose)"}>
            {col.label}
          </span>
        </span>
        <span className="font-mono text-[10px] text-(--color-prose-mute)">{cards.length}</span>
      </div>
      <SortableContext items={cards.map((c) => c.id)} strategy={verticalListSortingStrategy}>
        <ul className="space-y-2">
          {cards.map((c) => (
            <SortableCard key={c.id} card={c} />
          ))}
        </ul>
      </SortableContext>
    </div>
  );
}

const PRIO_TAG: Record<Priority, string> = {
  low: "low",
  medium: "med",
  high: "high",
  urgent: "urg",
};

function SortableCard({ card }: { card: Card }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: card.id,
  });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    rotate: isDragging ? "1.5deg" : "0deg",
  };
  return (
    <li
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      tabIndex={0}
      aria-grabbed={isDragging}
      className={`cursor-grab border border-dashed border-(--color-rule) bg-(--color-ink) p-3 transition-colors active:cursor-grabbing ${
        isDragging ? "border-(--color-signal) shadow-[0_0_24px_rgba(201,255,62,0.18)]" : "hover:border-(--color-signal)"
      }`}
    >
      <div className="flex items-baseline justify-between">
        <span className="font-mono text-[10px] tracking-widest text-(--color-prose-mute)">
          {card.id}
        </span>
        <span className="font-mono text-[9px] tracking-widest text-(--color-signal) uppercase">
          {PRIO_TAG[card.priority]}
        </span>
      </div>
      <p className="font-display mt-2 text-base leading-snug font-light text-balance">
        {card.title}
      </p>
      <div className="mt-3 flex items-center justify-between">
        <span className="font-mono text-[10px] text-(--color-prose-mute)">@{card.assignee}</span>
        <span className="font-mono text-[10px] tracking-widest text-(--color-prose-mute) uppercase">
          {card.status.replace("_", " ")}
        </span>
      </div>
    </li>
  );
}
