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
import { BackupReminder } from "@/components/backup/BackupReminder";
import { ImportRoadmapButton } from "@/components/backup/ImportRoadmapButton";
import { TodayCard } from "@/components/progress/TodayCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { buttonPrimary, buttonSecondary } from "@/components/ui/styles";
import { downloadRoadmap } from "@/lib/backupActions";
import { RoadmapCard } from "./RoadmapCard";
import { RoadmapDialog, type RoadmapFormValues } from "./RoadmapDialog";

type DialogState = { mode: "create" } | { mode: "edit"; overview: RoadmapOverview };

/**
 * Column count for the roadmap grid. Responsive to viewport width:
 * - 1 column on mobile (< 640px)
 * - 2 columns on small screens (640px - 1024px)
 * - 3 columns on laptops (1024px - 1280px)
 * - 4 columns on wide screens (1280px+)
 */
function gridClassName(): string {
  return "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4";
}

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

  const handleExport = async ({ roadmap }: RoadmapOverview) => {
    try {
      await downloadRoadmap(roadmap.id);
      setActionError(null);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "The roadmap could not be exported.");
    }
  };

  const oldestDataAt = overviews && overviews.length > 0
    ? overviews.reduce((oldest, { roadmap }) => (roadmap.createdAt < oldest ? roadmap.createdAt : oldest), overviews[0].roadmap.createdAt)
    : null;

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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <h1 className="text-[clamp(1.75rem,3.5vw,2.125rem)] font-medium leading-tight text-fg">
            Your roadmaps
          </h1>
          <p className="mt-2 text-[16px] leading-6 text-muted">
            Create roadmaps for each subject, add topics, and track your progress as you study.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <ImportRoadmapButton
            className={buttonSecondary}
            onImported={() => setActionError(null)}
            onError={setActionError}
          >
            <span className="hidden sm:inline">Import</span>
          </ImportRoadmapButton>
          {overviews && overviews.length > 0 ? (
            <button
              type="button"
              onClick={() => setDialog({ mode: "create" })}
              className={buttonPrimary}
            >
              <Plus aria-hidden="true" className="h-5 w-5" strokeWidth={1.5} />
              <span className="hidden sm:inline">New roadmap</span>
              <span className="sm:hidden">New</span>
            </button>
          ) : null}
        </div>
      </div>

      {overviews && overviews.length > 0 ? (
        <>
          <BackupReminder oldestDataAt={oldestDataAt} />
          <TodayCard />
        </>
      ) : null}

      {actionError ? <ErrorMessage>{actionError}</ErrorMessage> : null}

      {overviews === undefined ? (
        <div
          aria-busy="true"
          aria-label="Loading roadmaps"
          className={gridClassName()}
        >
          {[0, 1, 2].map((index) => (
            <div key={index} className="h-40 animate-pulse rounded-2xl bg-card" />
          ))}
        </div>
      ) : overviews.length === 0 ? (
        <EmptyState
          title="Create your first roadmap"
          description="Start by adding a roadmap for a subject you're studying. Inside each roadmap, you'll add topics and questions to practice."
          actionLabel="Create roadmap"
          onAction={() => setDialog({ mode: "create" })}
        />
      ) : (
        <div className={gridClassName()}>
          {overviews.map((overview) => (
            <RoadmapCard
              key={overview.roadmap.id}
              overview={overview}
              onEdit={(selected) => setDialog({ mode: "edit", overview: selected })}
              onExport={(selected) => void handleExport(selected)}
              onDelete={(selected) => void handleDelete(selected)}
            />
          ))}
          <button
            type="button"
            onClick={() => setDialog({ mode: "create" })}
            className="flex min-h-40 flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-line bg-bg text-muted transition-colors duration-150 hover:border-accent hover:bg-card hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
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
