"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useLiveQuery } from "dexie-react-hooks";
import {
  closestCenter,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  pointerWithin,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { FolderPlus, ListPlus, Play } from "lucide-react";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { NameDialog } from "@/components/ui/NameDialog";
import { buttonPrimary, buttonSecondary } from "@/components/ui/styles";
import { plural } from "@/lib/format";
import {
  applyTopicMove,
  buildSections,
  createGroup,
  createTopic,
  deleteGroup,
  deleteTopic,
  getProgress,
  getRoadmapPage,
  moveTopic,
  moveTopicToRoadmap,
  renameGroup,
  reorderGroups,
  setTopicStatus,
  updateTopic,
} from "@/lib/data";
import type { Group, Topic, TopicStatus, TopicTarget } from "@/types/study";
import { AddTopicForm } from "./AddTopicForm";
import { MoveTopicDialog, type MoveTopicValues } from "./MoveTopicDialog";
import { RoadmapIcon } from "./RoadmapIcon";
import { containerId, TopicGroupSection } from "./TopicGroupSection";
import { TopicRowPreview } from "./TopicRow";

type DialogState =
  | { kind: "new-group" }
  | { kind: "rename-group"; group: Group }
  | { kind: "rename-topic"; topic: Topic }
  | { kind: "move-topic"; topic: Topic }
  | { kind: "delete-topic"; topic: Topic }
  | { kind: "delete-group"; group: Group };

const ADD_TOPIC_INPUT_ID = "add-topic-input";

const CONTAINER_PREFIX = "container:";

/** Prefer the topic under the pointer, then a group's drop area, then the closest item (keyboard). */
const collisionDetection: CollisionDetection = (args) => {
  const underPointer = pointerWithin(args);

  if (underPointer.length > 0) {
    const topicHit = underPointer.find(
      (hit) => !String(hit.id).startsWith(CONTAINER_PREFIX),
    );
    return topicHit ? [topicHit] : underPointer;
  }

  return closestCenter(args);
};

export function TopicsPage() {
  const params = useParams<{ id: string }>();
  const roadmapId = typeof params.id === "string" ? params.id : "";
  const page = useLiveQuery(() => getRoadmapPage(roadmapId), [roadmapId]);

  const [dialog, setDialog] = useState<DialogState | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [activeId, setActiveId] = useState<string | null>(null);
  /** Topics after a drop, shown until the live query delivers a newer `page`. */
  const [pending, setPending] = useState<{
    base: typeof page;
    topics: Topic[];
  } | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const topics = useMemo(
    () =>
      (pending && pending.base === page ? pending.topics : page?.topics) ?? [],
    [pending, page],
  );
  const groups = useMemo(() => page?.groups ?? [], [page?.groups]);
  const isFlat = groups.length === 0;

  const sections = useMemo(() => {
    const built = buildSections(groups, topics);

    // With groups, always keep an "Ungrouped" drop area so topics can be dragged out of a group.
    if (!isFlat && !built.some((section) => section.group === null)) {
      built.push({ group: null, topics: [] });
    }

    return built;
  }, [groups, topics, isFlat]);

  const run = async (action: () => Promise<void>) => {
    try {
      await action();
      setActionError(null);
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "Something went wrong.",
      );
    }
  };

  if (page === undefined) {
    return (
      <div
        role="status"
        aria-busy="true"
        aria-label="Loading roadmap"
        className="flex w-full flex-col gap-4"
      >
        <div className="h-24 animate-pulse rounded-2xl bg-card" />
        <div className="h-16 animate-pulse rounded-2xl bg-card" />
        <div className="h-16 animate-pulse rounded-2xl bg-card" />
      </div>
    );
  }

  if (page === null) {
    return (
      <section className="mx-auto w-full max-w-xl rounded-2xl bg-card p-6 text-center">
        <h1 className="text-[22px] font-medium leading-7">Roadmap not found</h1>
        <p className="mt-2 text-[16px] leading-6 text-muted">
          It may have been deleted.
        </p>
        <Link
          href="/"
          className={`mt-6 ${buttonPrimary}`}
        >
          Back to roadmaps
        </Link>
      </section>
    );
  }

  const { roadmap, questionCounts } = page;
  const { completed, total } = getProgress(topics);
  const totalQuestions = Object.values(questionCounts).reduce(
    (sum, count) => sum + count,
    0,
  );
  const activeTopic = topics.find((topic) => topic.id === activeId);
  const activeSection = sections.find((section) =>
    section.topics.some((topic) => topic.id === activeId),
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);

    const { active, over } = event;

    if (!over) return;

    const topicId = String(active.id);
    const overId = String(over.id);
    const moving = topics.find((topic) => topic.id === topicId);

    if (!moving) return;

    let target: TopicTarget;

    if (overId.startsWith(CONTAINER_PREFIX)) {
      // Dropped on a group's empty area or header: append to the end of that group.
      const groupId =
        overId === containerId(null)
          ? null
          : overId.slice(CONTAINER_PREFIX.length);
      target = { groupId, index: Number.MAX_SAFE_INTEGER };
    } else {
      const overSection = sections.find((section) =>
        section.topics.some((topic) => topic.id === overId),
      );

      if (!overSection) return;

      const overIndex = overSection.topics.findIndex(
        (topic) => topic.id === overId,
      );
      const targetGroupId = overSection.group?.id ?? null;
      const isSameContainer = (moving.groupId ?? null) === targetGroupId;
      const translated = active.rect.current.translated;
      const isBelow =
        !isSameContainer &&
        translated !== null &&
        translated.top > over.rect.top + over.rect.height / 2;

      target = { groupId: targetGroupId, index: overIndex + (isBelow ? 1 : 0) };
    }

    const next = applyTopicMove(topics, topicId, target);
    const changed = next.some((topic, position) => {
      const before = topics[position];
      return topic.order !== before.order || topic.groupId !== before.groupId;
    });

    if (!changed) return;

    setPending({ base: page, topics: next });
    void moveTopic(topicId, target).then(
      () => setActionError(null),
      (error: unknown) => {
        setPending(null);
        setActionError(
          error instanceof Error ? error.message : "Could not move the topic.",
        );
      },
    );
  };

  const handleMoveTopic = async (topic: Topic, values: MoveTopicValues) => {
    if (values.roadmapId !== topic.roadmapId) {
      await moveTopicToRoadmap(topic.id, values.roadmapId, values.groupId);
    } else if ((topic.groupId ?? null) !== values.groupId) {
      await moveTopic(topic.id, {
        groupId: values.groupId,
        index: Number.MAX_SAFE_INTEGER,
      });
    }

    setDialog(null);
  };

  const deleteTopicMessage = (topic: Topic) => {
    const questionCount = questionCounts[topic.id] ?? 0;
    const contents =
      questionCount > 0
        ? ` This also deletes its ${plural(questionCount, "question")} and links.`
        : "";

    return `“${topic.title}” will be deleted.${contents} This cannot be undone.`;
  };

  const deleteGroupMessage = (group: Group) => {
    const count = topics.filter((topic) => topic.groupId === group.id).length;
    const contents =
      count > 0
        ? ` Its ${plural(count, "topic")} will stay in the roadmap, ungrouped.`
        : "";

    return `The group “${group.title}” will be deleted.${contents}`;
  };

  const handleMoveGroup = (group: Group, direction: -1 | 1) => {
    const ids = groups.map((item) => item.id);
    const from = ids.indexOf(group.id);
    const to = from + direction;

    if (to < 0 || to >= ids.length) return;

    [ids[from], ids[to]] = [ids[to], ids[from]];
    void run(() => reorderGroups(ids));
  };

  const toggleCollapsed = (groupId: string) => {
    setCollapsed((current) => {
      const next = new Set(current);

      if (next.has(groupId)) next.delete(groupId);
      else next.add(groupId);

      return next;
    });
  };

  const handleStatusChange = (topic: Topic, status: TopicStatus) => {
    void run(() => setTopicStatus(topic.id, status));
  };

  return (
    <section className="mx-auto flex w-full flex-col gap-6">
      <header className="flex flex-col gap-4">
        <div className="flex items-start gap-4">
          <RoadmapIcon roadmap={roadmap} />
          <div className="min-w-0 flex-1">
            <h1 className="wrap-break-word text-[22px] font-medium leading-7 text-fg">
              {roadmap.title}
            </h1>
            <p className="text-[16px] leading-6 text-muted tabular-nums">
              {plural(total, "topic")} · {plural(totalQuestions, "question")}
            </p>
          </div>
        </div>

        {total > 0 ? (
          <div>
            <ProgressBar
              label={`${roadmap.title} progress`}
              completed={completed}
              total={total}
              color={roadmap.color}
            />
            <p className="mt-2 text-[13px] leading-[18px] text-muted tabular-nums">
              {completed} / {total} done
            </p>
          </div>
        ) : null}

        <div className="flex flex-wrap gap-3">
          {totalQuestions > 0 ? (
            <Link
              href={`/roadmap/${roadmap.id}/quiz`}
              className={buttonPrimary}
            >
              <Play aria-hidden="true" className="h-5 w-5" strokeWidth={1.5} />
              Quiz all topics
            </Link>
          ) : null}
          <button
            type="button"
            onClick={() => setDialog({ kind: "new-group" })}
            className={buttonSecondary}
          >
            <FolderPlus
              aria-hidden="true"
              className="h-5 w-5"
              strokeWidth={1.5}
            />
            New group
          </button>
        </div>

        {totalQuestions === 0 ? (
          <p className="text-[13px] leading-[18px] text-muted">
            Add questions to your topics to unlock quizzes.
          </p>
        ) : null}
      </header>

      <AddTopicForm
        inputId={ADD_TOPIC_INPUT_ID}
        placeholder={isFlat ? "Add a topic" : "Add an ungrouped topic"}
        onAdd={async (title) => {
          await createTopic({ roadmapId, title });
        }}
      />

      {actionError ? <ErrorMessage>{actionError}</ErrorMessage> : null}

      {isFlat && total === 0 ? (
        <EmptyState
          icon={ListPlus}
          title="No topics yet"
          description="Add the first topic you want to study in this roadmap."
          actionLabel="Add a topic"
          onAction={() => document.getElementById(ADD_TOPIC_INPUT_ID)?.focus()}
        />
      ) : (
        <DndContext
          id="topics-dnd"
          sensors={sensors}
          collisionDetection={collisionDetection}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={() => setActiveId(null)}
        >
          <div className="flex flex-col gap-4">
            {sections.map((section) => {
              const groupIndex = section.group
                ? groups.findIndex((item) => item.id === section.group?.id)
                : -1;

              return (
                <TopicGroupSection
                  key={section.group?.id ?? "ungrouped"}
                  roadmapId={roadmapId}
                  section={section}
                  isFlat={isFlat}
                  questionCounts={questionCounts}
                  isCollapsed={
                    section.group ? collapsed.has(section.group.id) : false
                  }
                  isFirst={groupIndex === 0}
                  isLast={groupIndex === groups.length - 1}
                  onToggleCollapsed={toggleCollapsed}
                  onAddTopic={async (groupId, title) => {
                    await createTopic({ roadmapId, groupId, title });
                  }}
                  topicActions={{
                    onStatusChange: handleStatusChange,
                    onRename: (topic) =>
                      setDialog({ kind: "rename-topic", topic }),
                    onMove: (topic) => setDialog({ kind: "move-topic", topic }),
                    onDelete: (topic) => setDialog({ kind: "delete-topic", topic }),
                  }}
                  groupActions={{
                    onRename: (group) =>
                      setDialog({ kind: "rename-group", group }),
                    onDelete: (group) => setDialog({ kind: "delete-group", group }),
                    onMove: handleMoveGroup,
                  }}
                />
              );
            })}
          </div>

          <DragOverlay>
            {activeTopic ? (
              <TopicRowPreview
                topic={activeTopic}
                number={
                  (activeSection?.topics.findIndex(
                    (topic) => topic.id === activeTopic.id,
                  ) ?? 0) + 1
                }
              />
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      {dialog?.kind === "new-group" ? (
        <NameDialog
          title="New group"
          label="Group name"
          placeholder="Basics, Week 1, Chapter 2…"
          submitLabel="Create"
          onClose={() => setDialog(null)}
          onSubmit={async (name) => {
            await createGroup(roadmapId, name);
            setDialog(null);
          }}
        />
      ) : null}

      {dialog?.kind === "rename-group" ? (
        <NameDialog
          title="Rename group"
          label="Group name"
          initialValue={dialog.group.title}
          submitLabel="Save"
          onClose={() => setDialog(null)}
          onSubmit={async (name) => {
            await renameGroup(dialog.group.id, name);
            setDialog(null);
          }}
        />
      ) : null}

      {dialog?.kind === "rename-topic" ? (
        <NameDialog
          title="Rename topic"
          label="Topic name"
          initialValue={dialog.topic.title}
          submitLabel="Save"
          onClose={() => setDialog(null)}
          onSubmit={async (name) => {
            await updateTopic(dialog.topic.id, { title: name });
            setDialog(null);
          }}
        />
      ) : null}

      {dialog?.kind === "delete-topic" ? (
        <ConfirmDialog
          title="Delete topic?"
          message={deleteTopicMessage(dialog.topic)}
          confirmLabel="Delete topic"
          onClose={() => setDialog(null)}
          onConfirm={() => deleteTopic(dialog.topic.id)}
        />
      ) : null}

      {dialog?.kind === "delete-group" ? (
        <ConfirmDialog
          title="Delete group?"
          message={deleteGroupMessage(dialog.group)}
          confirmLabel="Delete group"
          onClose={() => setDialog(null)}
          onConfirm={() => deleteGroup(dialog.group.id)}
        />
      ) : null}

      {dialog?.kind === "move-topic" ? (
        <MoveTopicDialog
          topic={dialog.topic}
          roadmaps={page.roadmaps}
          currentGroups={groups}
          onClose={() => setDialog(null)}
          onSubmit={(values) => handleMoveTopic(dialog.topic, values)}
        />
      ) : null}
    </section>
  );
}
