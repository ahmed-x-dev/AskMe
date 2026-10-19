"use client";

import Link from "next/link";
import { Download, Pencil, Trash2, AlertCircle } from "lucide-react";
import { ActionMenu } from "@/components/ui/ActionMenu";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { plural } from "@/lib/format";
import type { RoadmapOverview } from "@/lib/data";
import { RoadmapIcon } from "./RoadmapIcon";
import { focusRing } from "@/components/ui/styles";

type RoadmapCardProps = {
  overview: RoadmapOverview;
  onEdit: (overview: RoadmapOverview) => void;
  onExport: (overview: RoadmapOverview) => void;
  onDelete: (overview: RoadmapOverview) => void;
};

export function RoadmapCard({ overview, onEdit, onExport, onDelete }: RoadmapCardProps) {
  const { roadmap, topicCount, completedCount, questionCount, statusCounts, dueCount } = overview;

  return (
    <article className="group relative flex flex-col gap-4 rounded-2xl bg-card p-4 transition-all duration-150 hover:bg-card-hover active:scale-[0.99] overflow-visible">
      <Link
        href={`/roadmap/${roadmap.id}`}
        aria-label={`Open ${roadmap.title}`}
        className={`absolute inset-0 z-10 rounded-2xl ${focusRing}`}
      />

      <div className="pointer-events-none relative z-20 flex items-start gap-3">
        <RoadmapIcon roadmap={roadmap} />

        <div className="min-w-0 flex-1">
          <h2 className="wrap-break-word text-[18px] font-medium leading-6 text-fg group-hover:text-fg">
            {roadmap.title}
          </h2>
          <p className="mt-1 text-[13px] leading-[18px] text-muted tabular-nums">
            {plural(topicCount, "topic")} · {plural(questionCount, "question")}
          </p>
        </div>

        <div className="pointer-events-auto relative shrink-0 z-30">
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

      <div className="pointer-events-none relative z-20 flex flex-col gap-3">
        {dueCount > 0 ? (
          <div className="flex items-center gap-2 rounded-xl bg-bg px-3 py-2">
            <AlertCircle aria-hidden="true" className="h-4 w-4 shrink-0 text-accent-text" strokeWidth={1.5} />
            <span className="text-[13px] font-medium leading-[18px] text-accent-text tabular-nums">
              {dueCount} due for review
            </span>
          </div>
        ) : null}
        {topicCount === 0 ? (
          <p className="text-[13px] leading-[18px] text-muted">No topics yet — add your first topic to get started</p>
        ) : (
          <>
            <ProgressBar
              label={`${roadmap.title} progress`}
              completed={completedCount}
              total={topicCount}
              color={roadmap.color}
              onCard
            />
            <div className="flex items-center justify-between text-[13px] leading-[18px]">
              <span className="text-muted tabular-nums">
                {completedCount} / {topicCount} done
              </span>
              <span className="text-muted tabular-nums">
                {statusCounts.active > 0 ? `${statusCounts.active} active` : ""}
                {statusCounts.active > 0 && statusCounts.todo > 0 ? " · " : ""}
                {statusCounts.todo > 0 ? `${statusCounts.todo} to do` : ""}
              </span>
            </div>
          </>
        )}
      </div>
    </article>
  );
}
