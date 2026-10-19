"use client";

import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { Plus } from "lucide-react";
import {
  createRoadmap,
  deleteRoadmap,
  getRoadmapOverviews,
  updateRoadmap,
  type RoadmapOverview,
} from "@/lib/data";
import { EmptyState } from "@/components/ui/EmptyState";
import { RoadmapCard } from "./RoadmapCard";
import { RoadmapDialog, type RoadmapFormValues } from "./RoadmapDialog";

type DialogState = { mode: "create" } | { mode: "edit"; overview: RoadmapOverview };

export function RoadmapGrid() {
  const overviews = useLiveQuery(() => getRoadmapOverviews(), []);
  const [dialog, setDialog] = useState<DialogState | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const handleSubmit = async (values: RoadmapFormValues) => {
    if (dialog?.mode === "edit") {
      await updateRoadmap(dialog.overview.roadmap.id, values);
    } else {
      await createRoadmap(values);
    }

    setDialog(null);
  };

  const handleDelete = async ({ roadmap, topicCount, questionCount }: RoadmapOverview) => {
    const contents =
      topicCount === 0
        ? "It has no topics."
        : `This also deletes its ${topicCount} topic${topicCount === 1 ? "" : "s"} and ${questionCount} question${questionCount === 1 ? "" : "s"}.`;

    if (!window.confirm(`Delete “${roadmap.title}”? ${contents} This cannot be undone.`)) {
      return;
    }

    try {
      await deleteRoadmap(roadmap.id);
      setActionError(null);
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "The roadmap could not be deleted.",
      );
    }
  };

  return (
    <section className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-[28px] font-medium leading-9 text-fg">Roadmaps</h1>
          <p className="text-[16px] leading-6 text-muted">
            Pick a subject to study, review and test yourself.
          </p>
        </div>
        {overviews && overviews.length > 0 ? (
          <button
            type="button"
            onClick={() => setDialog({ mode: "create" })}
            className="inline-flex min-h-12 shrink-0 items-center gap-2 rounded-2xl bg-accent px-5 text-[16px] font-medium text-on-accent transition duration-200 ease-out hover:opacity-90 active:scale-[0.98]"
          >
            <Plus aria-hidden="true" className="h-5 w-5" strokeWidth={1.5} />
            <span className="hidden sm:inline">New roadmap</span>
            <span className="sm:hidden">New</span>
          </button>
        ) : null}
      </div>

      {actionError ? (
        <p role="alert" className="rounded-2xl bg-bad-bg px-4 py-3 text-[16px] leading-6 text-bad-fg">
          {actionError}
        </p>
      ) : null}

      {overviews === undefined ? (
        <div aria-busy="true" aria-label="Loading roadmaps" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((index) => (
            <div key={index} className="h-40 animate-pulse rounded-2xl bg-card" />
          ))}
        </div>
      ) : overviews.length === 0 ? (
        <EmptyState
          title="No roadmaps yet"
          description="Create one for each subject you study, like React, English or Electronics."
          actionLabel="Create roadmap"
          onAction={() => setDialog({ mode: "create" })}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {overviews.map((overview) => (
            <RoadmapCard
              key={overview.roadmap.id}
              overview={overview}
              onEdit={(selected) => setDialog({ mode: "edit", overview: selected })}
              onDelete={(selected) => void handleDelete(selected)}
            />
          ))}
          <button
            type="button"
            onClick={() => setDialog({ mode: "create" })}
            className="flex min-h-40 flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-card-hover bg-bg text-muted transition-colors hover:bg-card hover:text-fg"
          >
            <Plus aria-hidden="true" className="h-6 w-6" strokeWidth={1.5} />
            <span className="text-[16px] font-medium">New roadmap</span>
          </button>
        </div>
      )}

      {dialog ? (
        <RoadmapDialog
          roadmap={dialog.mode === "edit" ? dialog.overview.roadmap : undefined}
          onSubmit={handleSubmit}
          onClose={() => setDialog(null)}
        />
      ) : null}
    </section>
  );
}
