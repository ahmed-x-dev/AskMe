"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Modal } from "@/components/ui/Modal";
import { listGroups } from "@/lib/data";
import type { Group, Roadmap, Topic } from "@/types/study";

export type MoveTopicValues = {
  roadmapId: string;
  /** Null puts the topic in the roadmap's ungrouped list. */
  groupId: string | null;
};

type MoveTopicDialogProps = {
  topic: Topic;
  roadmaps: Roadmap[];
  /** Groups of the topic's current roadmap. */
  currentGroups: Group[];
  onSubmit: (values: MoveTopicValues) => Promise<void>;
  onClose: () => void;
};

const selectClassName =
  "min-h-12 rounded-2xl bg-bg px-4 text-[16px] font-normal text-fg";

export function MoveTopicDialog({
  topic,
  roadmaps,
  currentGroups,
  onSubmit,
  onClose,
}: MoveTopicDialogProps) {
  const [roadmapId, setRoadmapId] = useState(topic.roadmapId);
  const [groupId, setGroupId] = useState<string>(topic.groupId ?? "");
  const [loadedGroups, setLoadedGroups] = useState<Group[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const isSameRoadmap = roadmapId === topic.roadmapId;
  const groups = isSameRoadmap ? currentGroups : loadedGroups;

  useEffect(() => {
    if (isSameRoadmap) return;

    let isCurrent = true;

    void listGroups(roadmapId).then((nextGroups) => {
      if (isCurrent) setLoadedGroups(nextGroups);
    });

    return () => {
      isCurrent = false;
    };
  }, [roadmapId, isSameRoadmap]);

  const handleRoadmapChange = (nextRoadmapId: string) => {
    setRoadmapId(nextRoadmapId);
    setGroupId(nextRoadmapId === topic.roadmapId ? (topic.groupId ?? "") : "");
    setLoadedGroups([]);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    setError(null);

    try {
      await onSubmit({ roadmapId, groupId: groupId || null });
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Could not move the topic.");
      setIsSaving(false);
    }
  };

  return (
    <Modal titleId="move-topic-title" isBusy={isSaving} onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-5 p-6">
        <div>
          <h2 id="move-topic-title" className="text-[22px] font-medium leading-7">
            Move topic
          </h2>
          <p className="mt-1 wrap-break-word text-[16px] leading-6 text-muted">{topic.title}</p>
        </div>

        <label className="flex flex-col gap-2 text-[16px] font-medium leading-6">
          Roadmap
          <select
            value={roadmapId}
            onChange={(event) => handleRoadmapChange(event.target.value)}
            className={selectClassName}
          >
            {roadmaps.map((roadmap) => (
              <option key={roadmap.id} value={roadmap.id}>
                {roadmap.title}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-2 text-[16px] font-medium leading-6">
          Group
          <select
            value={groupId}
            onChange={(event) => setGroupId(event.target.value)}
            className={selectClassName}
          >
            <option value="">No group</option>
            {groups.map((group) => (
              <option key={group.id} value={group.id}>
                {group.title}
              </option>
            ))}
          </select>
        </label>

        {error ? (
          <p role="alert" className="rounded-2xl bg-bad-bg px-4 py-3 text-[16px] leading-6 text-bad-fg">
            {error}
          </p>
        ) : null}

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="min-h-12 rounded-2xl bg-bg px-5 text-[16px] font-medium text-fg transition-colors hover:bg-card-hover"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSaving}
            aria-busy={isSaving}
            className="min-h-12 rounded-2xl bg-accent px-5 text-[16px] font-medium text-on-accent transition duration-200 ease-out hover:opacity-90 active:scale-[0.98]"
          >
            Move
          </button>
        </div>
      </form>
    </Modal>
  );
}
