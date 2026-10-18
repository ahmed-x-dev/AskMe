"use client";

import Link from "next/link";
import { Check, Ellipsis, FolderX, Pencil, Play, Trash2 } from "lucide-react";
import type { Dispatch, SetStateAction } from "react";
import type { QuizSet } from "@/types/quiz";

type SetCardProps = {
  set: QuizSet;
  isChoosingGroupMembers: boolean;
  canSelect: boolean;
  isSelected: boolean;
  isMenuOpen: boolean;
  setOpenSetMenuId: Dispatch<SetStateAction<string | null>>;
  toggleSelectedSet: (setId: string) => void;
  handleRenameSet: (setId: string, title: string) => Promise<void>;
  handleRemoveSetFromGroup: (setId: string, title: string) => Promise<void>;
  handleDeleteSet: (setId: string, title: string) => Promise<void>;
};

export function SetCard({
  set,
  isChoosingGroupMembers,
  canSelect,
  isSelected,
  isMenuOpen,
  setOpenSetMenuId,
  toggleSelectedSet,
  handleRenameSet,
  handleRemoveSetFromGroup,
  handleDeleteSet,
}: SetCardProps) {
  const activeQuestionCount = set.questions.filter(
    (question) => !question.deleted,
  ).length;

  return (
    <article
      onClick={() => {
        if (isChoosingGroupMembers && canSelect) toggleSelectedSet(set.id);
      }}
      className={`relative flex flex-col rounded-2xl bg-card p-4 transition-colors hover:bg-card-hover ${isMenuOpen ? "z-40" : ""} ${isSelected ? "ring-2 ring-accent ring-offset-2 ring-offset-bg" : ""}`}
    >
      <Link
        href={`/set/${set.id}`}
        aria-label={`Open ${set.title}`}
        onClick={(event) => {
          if (isChoosingGroupMembers && canSelect) event.preventDefault();
        }}
        className="absolute inset-0 z-10 rounded-2xl"
      />
      <div
        className={`pointer-events-none relative flex items-start justify-between gap-3 ${isMenuOpen ? "z-40" : "z-20"}`}
      >
        <div className="min-w-0 flex-1">
          <h3 className="wrap-break-word text-[22px] font-medium leading-7 text-fg">
            {set.title}
          </h3>
          <p className="mt-1 text-[16px] leading-6 text-muted tabular-nums">
            {activeQuestionCount} question{activeQuestionCount === 1 ? "" : "s"}{" "}
            · Updated{" "}
            {new Date(set.updatedAt).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
            })}
          </p>
        </div>
        {isChoosingGroupMembers && canSelect ? (
          <span
            aria-label={
              isSelected ? `${set.title} selected` : `${set.title} not selected`
            }
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] ${isSelected ? "bg-accent text-on-accent" : "bg-bg text-muted"}`}
          >
            {isSelected ? (
              <Check aria-hidden="true" className="h-5 w-5" strokeWidth={1.5} />
            ) : null}
          </span>
        ) : (
          <div className="pointer-events-auto relative shrink-0">
            <button
              type="button"
              onClick={() =>
                setOpenSetMenuId((current) =>
                  current === set.id ? null : set.id,
                )
              }
              aria-label={`Open actions for ${set.title}`}
              aria-expanded={isMenuOpen}
              aria-controls={`set-actions-${set.id}`}
              className="pointer-events-auto flex min-h-11 min-w-11 items-center justify-center rounded-[14px] bg-bg text-fg transition-colors hover:bg-card-hover"
            >
              <Ellipsis
                aria-hidden="true"
                className="h-5 w-5"
                strokeWidth={1.5}
              />
            </button>
            {isMenuOpen ? (
              <div
                id={`set-actions-${set.id}`}
                className="absolute inset-e-0 top-full z-50 mt-2 flex w-44 flex-col gap-1 rounded-2xl bg-card p-2 shadow-lg"
              >
                <button
                  type="button"
                  onClick={() => {
                    setOpenSetMenuId(null);
                    void handleRenameSet(set.id, set.title);
                  }}
                  className="flex min-h-11 items-center gap-3 rounded-[14px] px-3 text-start text-[16px] text-fg transition-colors hover:bg-card-hover"
                >
                  <Pencil
                    aria-hidden="true"
                    className="h-5 w-5"
                    strokeWidth={1.5}
                  />
                  Rename
                </button>
                {set.group ? (
                  <button
                    type="button"
                    onClick={() => {
                      setOpenSetMenuId(null);
                      void handleRemoveSetFromGroup(set.id, set.title);
                    }}
                    className="flex min-h-11 items-center gap-3 rounded-[14px] px-3 text-start text-[16px] text-fg transition-colors hover:bg-card-hover"
                  >
                    <FolderX
                      aria-hidden="true"
                      className="h-5 w-5"
                      strokeWidth={1.5}
                    />
                    Remove from group
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => {
                    setOpenSetMenuId(null);
                    void handleDeleteSet(set.id, set.title);
                  }}
                  className="flex min-h-11 items-center gap-3 rounded-[14px] px-3 text-start text-[16px] text-bad-fg transition-colors hover:bg-bad-bg"
                >
                  <Trash2
                    aria-hidden="true"
                    className="h-5 w-5"
                    strokeWidth={1.5}
                  />
                  Delete set
                </button>
              </div>
            ) : null}
          </div>
        )}
      </div>
      <div className="pointer-events-none relative z-10 mt-6 grid grid-cols-[minmax(0,1fr)_auto] gap-3">
        <Link
          href={`/set/${set.id}/quiz`}
          onClick={(event) => {
            if (isChoosingGroupMembers) event.preventDefault();
          }}
          className="pointer-events-auto flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-accent px-4 text-[16px] font-medium text-on-accent transition duration-200 ease-out hover:opacity-90 active:scale-[0.98]"
        >
          <Play aria-hidden="true" className="h-5 w-5" strokeWidth={1.5} />
          Start quiz
        </Link>
        <Link
          href={`/set/${set.id}`}
          className="pointer-events-auto flex min-h-12 items-center justify-center rounded-2xl bg-card px-4 text-[16px] font-medium text-fg transition-colors hover:bg-card-hover"
        >
          Open
        </Link>
      </div>
    </article>
  );
}
