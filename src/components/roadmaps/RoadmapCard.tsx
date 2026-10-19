"use client";

import Link from "next/link";
import { Download, Pencil, Trash2 } from "lucide-react";
import { ActionMenu } from "@/components/ui/ActionMenu";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { plural } from "@/lib/format";
import type { RoadmapOverview } from "@/lib/data";
import { RoadmapIcon } from "./RoadmapIcon";

type RoadmapCardProps = {
  overview: RoadmapOverview;
  onEdit: (overview: RoadmapOverview) => void;
  onExport: (overview: RoadmapOverview) => void;
  onDelete: (overview: RoadmapOverview) => void;
};

export function RoadmapCard({ overview, onEdit, onExport, onDelete }: RoadmapCardProps) {
  const { roadmap, topicCount, completedCount, questionCount, statusCounts, dueCount } = overview;

  return (
    <article className="relative flex flex-col gap-5 rounded-2xl bg-card p-4 transition-colors duration-150 hover:bg-card-hover">
      <Link
        href={`/roadmap/${roadmap.id}`}
        aria-label={`Open ${roadmap.title}`}
        className="absolute inset-0 z-10 rounded-2xl"
      />

      <div className="pointer-events-none relative z-20 flex items-start gap-3">
        <RoadmapIcon roadmap={roadmap} />

        <div className="min-w-0 flex-1">
          <h3 className="wrap-break-word text-[18px] font-medium leading-6 text-fg">
            {roadmap.title}
          </h3>
          <p className="mt-1 text-[16px] leading-6 text-muted tabular-nums">
            {plural(topicCount, "topic")} · {plural(questionCount, "question")}
          </p>
        </div>

        <div className="pointer-events-auto relative shrink-0">
          <ActionMenu
            label={`Open actions for ${roadmap.title}`}
            items={[
              { label: "Edit", icon: Pencil, onSelect: () => onEdit(overview) },
              { label: "Export", icon: Download, onSelect: () => onExport(overview) },
              {
                label: "Delete",
                icon: Trash2,
                danger: true,
                onSelect: () => onDelete(overview),
              },
            ]}
          />
        </div>
      </div>

      <div className="pointer-events-none relative z-20">
        {dueCount > 0 ? (
          <p className="mb-3 inline-flex rounded-full bg-bg px-2.5 py-0.5 text-[13px] font-medium leading-[18px] text-accent-text tabular-nums">
            {dueCount} due for review
          </p>
        ) : null}
        {topicCount === 0 ? (
          <p className="text-[16px] leading-6 text-muted">No topics yet</p>
        ) : (
          <>
            <ProgressBar
              label={`${roadmap.title} progress`}
              completed={completedCount}
              total={topicCount}
              color={roadmap.color}
              onCard
            />
            <p className="mt-2 text-[13px] leading-[18px] text-muted tabular-nums">
              {completedCount} / {topicCount} done
              {statusCounts.active > 0 ? ` · ${statusCounts.active} active` : ""}
              {statusCounts.todo > 0 ? ` · ${statusCounts.todo} to do` : ""}
            </p>
          </>
        )}
      </div>
    </article>
  );
}
