"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { Download, Ellipsis, Pencil, Trash2 } from "lucide-react";
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
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!isMenuOpen) return;

    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsMenuOpen(false);
    };

    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);

    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [isMenuOpen]);

  return (
    <article
      className={`relative flex flex-col gap-5 rounded-2xl bg-card p-4 transition-colors hover:bg-card-hover ${isMenuOpen ? "z-40" : ""}`}
    >
      <Link
        href={`/roadmap/${roadmap.id}`}
        aria-label={`Open ${roadmap.title}`}
        className="absolute inset-0 z-10 rounded-2xl"
      />

      <div className="pointer-events-none relative z-20 flex items-start gap-3">
        <RoadmapIcon roadmap={roadmap} />

        <div className="min-w-0 flex-1">
          <h3 className="wrap-break-word text-[22px] font-medium leading-7 text-fg">
            {roadmap.title}
          </h3>
          <p className="mt-1 text-[16px] leading-6 text-muted tabular-nums">
            {plural(topicCount, "topic")} · {plural(questionCount, "question")}
          </p>
        </div>

        <div ref={menuRef} className="pointer-events-auto relative shrink-0">
          <button
            type="button"
            onClick={() => setIsMenuOpen((current) => !current)}
            aria-label={`Open actions for ${roadmap.title}`}
            aria-expanded={isMenuOpen}
            aria-controls={menuId}
            className="flex min-h-11 min-w-11 items-center justify-center rounded-[14px] bg-bg text-fg transition-colors hover:bg-card-hover"
          >
            <Ellipsis aria-hidden="true" className="h-5 w-5" strokeWidth={1.5} />
          </button>

          {isMenuOpen ? (
            <div
              id={menuId}
              className="absolute inset-e-0 top-full z-50 mt-2 flex w-44 flex-col gap-1 rounded-2xl bg-bg p-2 ring-1 ring-card-hover"
            >
              <button
                type="button"
                onClick={() => {
                  setIsMenuOpen(false);
                  onEdit(overview);
                }}
                className="flex min-h-11 items-center gap-3 rounded-[14px] px-3 text-start text-[16px] text-fg transition-colors hover:bg-card-hover"
              >
                <Pencil aria-hidden="true" className="h-5 w-5" strokeWidth={1.5} />
                Edit
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsMenuOpen(false);
                  onExport(overview);
                }}
                className="flex min-h-11 items-center gap-3 rounded-[14px] px-3 text-start text-[16px] text-fg transition-colors hover:bg-card-hover"
              >
                <Download aria-hidden="true" className="h-5 w-5" strokeWidth={1.5} />
                Export
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsMenuOpen(false);
                  onDelete(overview);
                }}
                className="flex min-h-11 items-center gap-3 rounded-[14px] px-3 text-start text-[16px] text-bad-fg transition-colors hover:bg-bad-bg"
              >
                <Trash2 aria-hidden="true" className="h-5 w-5" strokeWidth={1.5} />
                Delete
              </button>
            </div>
          ) : null}
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
