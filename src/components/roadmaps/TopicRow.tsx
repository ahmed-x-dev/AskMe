"use client";

import Link from "next/link";
import { useSortable } from "@dnd-kit/sortable";
import { ChevronDown, FolderInput, GripVertical, Pencil, Trash2 } from "lucide-react";
import { ActionMenu } from "@/components/ui/ActionMenu";
import { plural } from "@/lib/format";
import type { Topic, TopicStatus } from "@/types/study";

export const STATUS_OPTIONS: { value: TopicStatus; label: string; className: string }[] = [
  { value: "todo", label: "To do", className: "bg-bg text-muted" },
  { value: "active", label: "In progress", className: "bg-warn-bg text-warn-fg" },
  { value: "done", label: "Done", className: "bg-ok-bg text-ok-fg" },
  { value: "known", label: "Already known", className: "bg-essay-bg text-essay-fg" },
];

export type TopicRowActions = {
  onStatusChange: (topic: Topic, status: TopicStatus) => void;
  onRename: (topic: Topic) => void;
  onMove: (topic: Topic) => void;
  onDelete: (topic: Topic) => void;
};

type TopicRowProps = {
  topic: Topic;
  /** Position inside its group (or the ungrouped list), starting at 1. */
  number: number;
  questionCount: number;
  actions: TopicRowActions;
};

/**
 * A status chip that is also a select. The visible chip keeps the 13px chip look, while the
 * invisible native select covers a 44px-tall area so it is easy to tap.
 */
export function StatusSelect({ topic, onChange }: { topic: Topic; onChange: (status: TopicStatus) => void }) {
  const current = STATUS_OPTIONS.find((option) => option.value === topic.status) ?? STATUS_OPTIONS[0];

  return (
    <span className="relative inline-flex min-h-11 items-center rounded-full has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent">
      <span
        aria-hidden="true"
        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[13px] font-medium leading-[18px] ${current.className}`}
      >
        {current.label}
        <ChevronDown className="h-4 w-4" strokeWidth={1.5} />
      </span>
      <select
        aria-label={`Status of ${topic.title}`}
        value={topic.status}
        onChange={(event) => onChange(event.target.value as TopicStatus)}
        className="absolute inset-0 h-full w-full cursor-pointer appearance-none opacity-0 outline-none"
      >
        {STATUS_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </span>
  );
}

/** Shows a topic's row without drag behavior, used for the drag overlay. */
export function TopicRowPreview({ topic, number }: { topic: Topic; number: number }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-card-hover p-3 ring-2 ring-accent">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center text-muted">
        <GripVertical aria-hidden="true" className="h-5 w-5" strokeWidth={1.5} />
      </span>
      <span className="w-6 text-center text-[16px] text-muted tabular-nums">{number}</span>
      <span className="min-w-0 flex-1 truncate text-[16px] font-medium leading-6 text-fg">
        {topic.title}
      </span>
    </div>
  );
}

export function TopicRow({ topic, number, questionCount, actions }: TopicRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: topic.id });

  return (
    <li
      ref={setNodeRef}
      style={{
        transform: transform
          ? `translate3d(${Math.round(transform.x)}px, ${Math.round(transform.y)}px, 0)`
          : undefined,
        transition,
      }}
      className={`flex items-center gap-3 rounded-2xl bg-card p-3 ${isDragging ? "opacity-40" : ""}`}
    >
      <button
        type="button"
        ref={setActivatorNodeRef}
        {...attributes}
        {...listeners}
        aria-label={`Reorder ${topic.title}`}
        className="flex h-11 w-11 shrink-0 cursor-grab touch-none items-center justify-center rounded-[14px] bg-bg text-muted transition-colors hover:text-fg active:cursor-grabbing"
      >
        <GripVertical aria-hidden="true" className="h-5 w-5" strokeWidth={1.5} />
      </button>

      <span className="w-6 shrink-0 text-center text-[16px] text-muted tabular-nums">{number}</span>

      <div className="min-w-0 flex-1">
        <Link
          href={`/topic/${topic.id}`}
          className="block wrap-break-word text-[16px] font-medium leading-6 text-fg hover:underline"
        >
          {topic.title}
        </Link>
        <div className="flex flex-wrap items-center gap-x-3">
          <StatusSelect topic={topic} onChange={(status) => actions.onStatusChange(topic, status)} />
          <span className="text-[13px] leading-[18px] text-muted tabular-nums">
            {plural(questionCount, "question")}
          </span>
        </div>
      </div>

      <ActionMenu
        label={`Actions for ${topic.title}`}
        items={[
          { label: "Rename", icon: Pencil, onSelect: () => actions.onRename(topic) },
          { label: "Move…", icon: FolderInput, onSelect: () => actions.onMove(topic) },
          { label: "Delete", icon: Trash2, danger: true, onSelect: () => actions.onDelete(topic) },
        ]}
      />
    </li>
  );
}
