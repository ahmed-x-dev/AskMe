"use client";

import Link from "next/link";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { ArrowDown, ArrowUp, ChevronDown, ChevronRight, Pencil, Play, Trash2 } from "lucide-react";
import { ActionMenu, type ActionMenuItem } from "@/components/ui/ActionMenu";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { plural } from "@/lib/format";
import { getProgress, type TopicSection } from "@/lib/data";
import type { Group } from "@/types/study";
import { AddTopicForm } from "./AddTopicForm";
import { TopicRow, type TopicRowActions } from "./TopicRow";

export const UNGROUPED_CONTAINER_ID = "container:ungrouped";

/** Id of the drop area for a group, or for the ungrouped list when `groupId` is null. */
export function containerId(groupId: string | null): string {
  return groupId ? `container:${groupId}` : UNGROUPED_CONTAINER_ID;
}

export type GroupActions = {
  onRename: (group: Group) => void;
  onDelete: (group: Group) => void;
  onMove: (group: Group, direction: -1 | 1) => void;
};

type TopicGroupSectionProps = {
  roadmapId: string;
  section: TopicSection;
  /** True when the roadmap has no groups, so the list is shown flat with no header. */
  isFlat: boolean;
  questionCounts: Record<string, number>;
  isCollapsed: boolean;
  isFirst: boolean;
  isLast: boolean;
  onToggleCollapsed: (groupId: string) => void;
  onAddTopic: (groupId: string | undefined, title: string) => Promise<void>;
  topicActions: TopicRowActions;
  groupActions: GroupActions;
};

export function TopicGroupSection({
  roadmapId,
  section,
  isFlat,
  questionCounts,
  isCollapsed,
  isFirst,
  isLast,
  onToggleCollapsed,
  onAddTopic,
  topicActions,
  groupActions,
}: TopicGroupSectionProps) {
  const { group, topics } = section;
  const { setNodeRef, isOver } = useDroppable({ id: containerId(group?.id ?? null) });
  const { completed, total } = getProgress(topics);
  const groupQuestionCount = topics.reduce((sum, topic) => sum + (questionCounts[topic.id] ?? 0), 0);
  const heading = group?.title ?? (isFlat ? "Topics" : "Ungrouped");

  const menuItems: ActionMenuItem[] = group
    ? [
        { label: "Rename", icon: Pencil, onSelect: () => groupActions.onRename(group) },
        { label: "Move up", icon: ArrowUp, disabled: isFirst, onSelect: () => groupActions.onMove(group, -1) },
        { label: "Move down", icon: ArrowDown, disabled: isLast, onSelect: () => groupActions.onMove(group, 1) },
        { label: "Delete group", icon: Trash2, danger: true, onSelect: () => groupActions.onDelete(group) },
      ]
    : [];

  return (
    <section
      ref={setNodeRef}
      aria-label={heading}
      className={`flex flex-col gap-3 rounded-2xl ${isFlat ? "" : "bg-bg p-1"} ${isOver ? "ring-2 ring-accent" : ""}`}
    >
      {isFlat ? null : (
        <header className="flex items-center gap-2">
          {group ? (
            <button
              type="button"
              onClick={() => onToggleCollapsed(group.id)}
              aria-expanded={!isCollapsed}
              aria-label={`${isCollapsed ? "Expand" : "Collapse"} ${group.title}`}
              className="flex min-h-11 min-w-11 items-center justify-center rounded-[14px] bg-card text-fg transition-colors hover:bg-card-hover"
            >
              {isCollapsed ? (
                <ChevronRight aria-hidden="true" className="h-5 w-5" strokeWidth={1.5} />
              ) : (
                <ChevronDown aria-hidden="true" className="h-5 w-5" strokeWidth={1.5} />
              )}
            </button>
          ) : null}

          <div className="min-w-0 flex-1">
            <h2 className="wrap-break-word text-[16px] font-medium leading-6 text-fg">{heading}</h2>
            <p className="text-[13px] leading-5 text-muted tabular-nums">
              {total === 0 ? "No topics" : `${completed} / ${total} done`}
            </p>
          </div>

          {group ? (
            groupQuestionCount > 0 ? (
              <Link
                href={`/roadmap/${roadmapId}/quiz?group=${group.id}`}
                className="inline-flex min-h-11 items-center gap-2 rounded-[14px] bg-card px-3 text-[13px] font-medium text-fg transition-colors hover:bg-card-hover"
              >
                <Play aria-hidden="true" className="h-4 w-4" strokeWidth={1.5} />
                Quiz group
              </Link>
            ) : (
              <span
                title="Add questions to this group's topics first"
                className="inline-flex min-h-11 items-center gap-2 rounded-[14px] bg-card px-3 text-[13px] font-medium text-muted opacity-60"
              >
                <Play aria-hidden="true" className="h-4 w-4" strokeWidth={1.5} />
                Quiz group
              </span>
            )
          ) : null}

          {group ? <ActionMenu label={`Actions for ${group.title}`} items={menuItems} /> : null}
        </header>
      )}

      {!isFlat && total > 0 && !isCollapsed ? (
        <div className="px-1">
          <ProgressBar label={`${heading} progress`} completed={completed} total={total} />
        </div>
      ) : null}

      {isCollapsed ? (
        <p className="px-3 pb-2 text-[13px] leading-5 text-muted">
          {plural(topics.length, "topic")} hidden
        </p>
      ) : (
        <>
          <SortableContext items={topics.map((topic) => topic.id)} strategy={verticalListSortingStrategy}>
            <ol className={`flex flex-col gap-2 ${topics.length === 0 ? "min-h-4" : ""}`}>
              {topics.map((topic, index) => (
                <TopicRow
                  key={topic.id}
                  topic={topic}
                  number={index + 1}
                  questionCount={questionCounts[topic.id] ?? 0}
                  actions={topicActions}
                />
              ))}
            </ol>
          </SortableContext>

          {topics.length === 0 && !isFlat ? (
            <p className="rounded-2xl border-2 border-dashed border-card-hover px-4 py-3 text-center text-[13px] leading-5 text-muted">
              {group ? "Drop a topic here, or add one below." : "Drop a topic here to remove it from its group."}
            </p>
          ) : null}

          {group ? (
            <div className="px-1 pb-1">
              <AddTopicForm
                placeholder={`Add a topic to ${group.title}`}
                onAdd={(title) => onAddTopic(group.id, title)}
              />
            </div>
          ) : null}
        </>
      )}
    </section>
  );
}
