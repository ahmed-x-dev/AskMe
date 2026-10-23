"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowDown,
  ArrowUp,
  BookOpen,
  Download,
  ExternalLink,
  FileText,
  Link as LinkIcon,
  Pencil,
  Plus,
  Sparkles,
  Trash2,
  Video,
  type LucideIcon,
} from "lucide-react";
import { ActionMenu } from "@/components/ui/ActionMenu";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { NameDialog } from "@/components/ui/NameDialog";
import {
  buttonPrimary,
  buttonSecondaryCompact,
} from "@/components/ui/styles";
import {
  addLesson,
  addLessonResource,
  deleteLesson,
  deleteLessonResource,
  reorderLessons,
  setLessonDone,
  updateLesson,
  updateLessonResource,
  type LessonResourceInput,
} from "@/lib/data";
import {
  downloadLessonFile,
  formatFileSize,
  isMarkdownLessonFile,
  openLessonFile,
} from "@/lib/lessonFiles";
import { plural } from "@/lib/format";
import type {
  Lesson,
  LessonResource,
  Question,
  ResourceKind,
} from "@/types/study";
import {
  GenerateQuestionsDialog,
  type GenerationContext,
} from "./GenerateQuestionsDialog";
import { LessonResourceDialog } from "./LessonResourceDialog";
import { hostOf, isSafeLink, RESOURCE_KINDS } from "./resourceKinds";

type LessonsSectionProps = {
  topicId: string;
  lessons: Lesson[];
  questions: Question[];
  topicContext: Pick<
    GenerationContext,
    "topicTitle" | "roadmapTitle" | "groupTitle" | "notes"
  >;
};

const RESOURCE_ICONS: Record<ResourceKind, LucideIcon> = {
  docs: BookOpen,
  video: Video,
  article: FileText,
  other: LinkIcon,
};

/** Lessons in one topic, with multiple links or locally saved documents per lesson. */
export function LessonsSection({
  topicId,
  lessons,
  questions,
  topicContext,
}: LessonsSectionProps) {
  const [isAddingLesson, setIsAddingLesson] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [deletingLesson, setDeletingLesson] = useState<Lesson | null>(null);
  const [resourceDialog, setResourceDialog] = useState<{
    lesson: Lesson;
    resource?: LessonResource;
  } | null>(null);
  const [deletingResource, setDeletingResource] = useState<{
    lesson: Lesson;
    resource: LessonResource;
  } | null>(null);
  const [generatingLesson, setGeneratingLesson] = useState<Lesson | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const addingRef = useRef(false);

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

  const createLesson = async (title: string) => {
    if (addingRef.current) return;
    addingRef.current = true;
    try {
      await addLesson(topicId, title);
      setIsAddingLesson(false);
    } finally {
      addingRef.current = false;
    }
  };

  const saveResource = async (input: LessonResourceInput) => {
    if (!resourceDialog) return;
    if (resourceDialog.resource) {
      await updateLessonResource(
        resourceDialog.lesson.id,
        resourceDialog.resource.id,
        input,
      );
    } else {
      await addLessonResource(resourceDialog.lesson.id, input);
    }
    setResourceDialog(null);
  };

  const moveLesson = (lesson: Lesson, direction: -1 | 1) => {
    const ids = lessons.map((item) => item.id);
    const from = ids.indexOf(lesson.id);
    const to = from + direction;
    if (to < 0 || to >= ids.length) return;
    [ids[from], ids[to]] = [ids[to], ids[from]];
    void run(() => reorderLessons(ids));
  };

  return (
    <section
      id="lessons-section"
      aria-labelledby="lessons-heading"
      className="flex flex-col gap-4"
    >
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2
            id="lessons-heading"
            className="text-lg font-medium leading-6.5 text-fg"
          >
            Lessons
          </h2>
          <p className="text-[13px] leading-4.5 text-muted tabular-nums">
            {lessons.length === 0
              ? "Break this topic into study sessions."
              : plural(lessons.length, "lesson")}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsAddingLesson(true)}
          className={buttonPrimary}
        >
          <Plus aria-hidden="true" className="h-5 w-5" strokeWidth={1.5} />
          Add lesson
        </button>
      </div>

      {actionError ? <ErrorMessage>{actionError}</ErrorMessage> : null}

      {lessons.length === 0 ? (
        <div className="rounded-2xl bg-card px-4 py-3 text-[13px] leading-4.5 text-muted">
          Add a lesson, then attach videos, articles, links, or documents from
          your device.
        </div>
      ) : (
        <ol className="flex flex-col gap-3">
          {lessons.map((lesson, index) => {
            const lessonQuestions = questions.filter(
              (question) => question.lessonId === lesson.id,
            );

            return (
              <li key={lesson.id} className="min-w-0 rounded-2xl bg-card p-4">
              <div className="flex min-w-0 items-start gap-3">
                <label className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center">
                  <input
                    type="checkbox"
                    checked={lesson.done}
                    onChange={(event) =>
                      void run(() =>
                        setLessonDone(lesson.id, event.target.checked),
                      )
                    }
                    aria-label={
                      lesson.done
                        ? `Mark “${lesson.title}” as not done`
                        : `Mark “${lesson.title}” as done`
                    }
                    className="h-5 w-5 accent-(--accent)"
                  />
                </label>
                <div className="min-w-0 flex-1">
                  <h3
                    className={`wrap-break-word text-base font-medium leading-6 ${
                      lesson.done ? "text-muted line-through" : "text-fg"
                    }`}
                  >
                    {lesson.title}
                  </h3>
                  <p className="text-[13px] leading-4.5 text-muted">
                    {plural(lesson.resources.length, "resource")} ·{" "}
                    {plural(lessonQuestions.length, "question")}
                  </p>
                </div>
                <ActionMenu
                  label={`Actions for ${lesson.title}`}
                  items={[
                    {
                      label: "Edit lesson",
                      icon: Pencil,
                      onSelect: () => setEditingLesson(lesson),
                    },
                    {
                      label: "Move up",
                      icon: ArrowUp,
                      disabled: index === 0,
                      onSelect: () => moveLesson(lesson, -1),
                    },
                    {
                      label: "Move down",
                      icon: ArrowDown,
                      disabled: index === lessons.length - 1,
                      onSelect: () => moveLesson(lesson, 1),
                    },
                    {
                      label: "Delete lesson",
                      icon: Trash2,
                      danger: true,
                      onSelect: () => setDeletingLesson(lesson),
                    },
                  ]}
                />
              </div>

              {lessonQuestions.length > 0 ? (
                <ul
                  aria-label={`Questions for ${lesson.title}`}
                  className="ms-[52px] mt-3 flex flex-col gap-2"
                >
                  {lessonQuestions.map((question) => (
                    <li key={question.id}>
                      <Link
                        href={`/topic/${topicId}/q/${question.id}`}
                        className="block min-w-0 wrap-break-word rounded-xl bg-bg p-3 text-sm leading-5 text-fg hover:bg-card-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                      >
                        {question.text}
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : null}

              <div className="ms-[52px] mt-3 flex flex-wrap gap-2">
                <Link
                  href={`/topic/${topicId}/q/new?lessonId=${lesson.id}`}
                  className="inline-flex min-h-12 items-center gap-2 rounded-xl px-3 text-[13px] font-medium leading-4.5 text-accent-text hover:bg-card-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  <Plus
                    aria-hidden="true"
                    className="h-4 w-4"
                    strokeWidth={1.5}
                  />
                  Add lesson question
                </Link>
                <button
                  type="button"
                  onClick={() => setGeneratingLesson(lesson)}
                  aria-label={`Generate questions for ${lesson.title} with AI`}
                  className={buttonSecondaryCompact}
                >
                  <Sparkles
                    aria-hidden="true"
                    className="h-4 w-4"
                    strokeWidth={1.5}
                  />
                  Generate with AI
                </button>
              </div>

              {lesson.resources.length > 0 ? (
                <ul className="ms-[52px] mt-3 flex flex-col gap-2">
                  {lesson.resources.map((resource) => {
                    const ResourceIcon = RESOURCE_ICONS[resource.kind];
                    const kindLabel =
                      RESOURCE_KINDS.find(
                        (option) => option.value === resource.kind,
                      )?.label ?? "Other";

                    return (
                      <li
                        key={resource.id}
                        className="flex min-w-0 items-start gap-2 rounded-xl bg-bg p-3"
                      >
                        <span
                          aria-hidden="true"
                          className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-card text-muted"
                        >
                          <ResourceIcon className="h-4 w-4" strokeWidth={1.5} />
                        </span>
                        <div className="min-w-0 flex-1">
                          {resource.source === "link" ? (
                            isSafeLink(resource.url) ? (
                              resource.kind === "video" ? (
                                <Link
                                  href={`/topic/${topicId}/resource/${resource.id}`}
                                  className="min-w-0 wrap-break-word text-sm font-medium leading-5 text-fg hover:underline"
                                >
                                  {resource.title}
                                </Link>
                              ) : (
                                <a
                                  href={resource.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex min-w-0 items-start gap-2 wrap-break-word text-sm font-medium leading-5 text-fg hover:underline"
                                >
                                  <span className="min-w-0 flex-1 wrap-break-word">
                                    {resource.title}
                                  </span>
                                  <ExternalLink
                                    aria-hidden="true"
                                    className="mt-0.5 h-4 w-4 shrink-0"
                                    strokeWidth={1.5}
                                  />
                                </a>
                              )
                            ) : (
                              <span className="wrap-break-word text-sm font-medium leading-5 text-muted">
                                {resource.title}
                              </span>
                            )
                          ) : (
                            <div className="flex items-start gap-2">
                              {isMarkdownLessonFile(resource) ? (
                                <Link
                                  href={`/topic/${topicId}/resource/${resource.id}`}
                                  className="min-w-0 wrap-break-word text-sm font-medium leading-5 text-fg hover:underline"
                                >
                                  {resource.title}
                                </Link>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() =>
                                    void run(async () =>
                                      openLessonFile(resource),
                                    )
                                  }
                                  className="min-w-0 wrap-break-word text-start text-sm font-medium leading-5 text-fg hover:underline"
                                >
                                  {resource.title}
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() =>
                                  void run(async () =>
                                    downloadLessonFile(resource),
                                  )
                                }
                                aria-label={`Download “${resource.title}”`}
                                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted hover:bg-card-hover hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                              >
                                <Download
                                  aria-hidden="true"
                                  className="h-4 w-4"
                                  strokeWidth={1.5}
                                />
                              </button>
                            </div>
                          )}
                          <p className="mt-1 text-[13px] leading-4.5 text-muted">
                            <span className="font-medium">{kindLabel}</span>
                            {resource.source === "link" ? (
                              <>
                                <span aria-hidden="true"> · </span>
                                <span className="break-all">
                                  {hostOf(resource.url)}
                                </span>
                              </>
                            ) : (
                              <>
                                <span aria-hidden="true"> · </span>
                                <span>{resource.fileName}</span>
                                <span aria-hidden="true"> · </span>
                                <span>{formatFileSize(resource.size)}</span>
                              </>
                            )}
                          </p>
                        </div>
                        <ActionMenu
                          label={`Actions for ${resource.title}`}
                          items={[
                            {
                              label: "Edit resource",
                              icon: Pencil,
                              onSelect: () =>
                                setResourceDialog({ lesson, resource }),
                            },
                            {
                              label: "Delete resource",
                              icon: Trash2,
                              danger: true,
                              onSelect: () =>
                                setDeletingResource({ lesson, resource }),
                            },
                          ]}
                        />
                      </li>
                    );
                  })}
                </ul>
              ) : null}

              <button
                type="button"
                onClick={() => setResourceDialog({ lesson })}
                className="ms-[52px] mt-3 inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-[13px] font-medium leading-4.5 text-accent-text hover:bg-card-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                <Plus
                  aria-hidden="true"
                  className="h-4 w-4"
                  strokeWidth={1.5}
                />
                Add resource
              </button>
                </li>
              );
            })}
        </ol>
      )}

      {isAddingLesson ? (
        <NameDialog
          title="Add lesson"
          label="Lesson title"
          placeholder="For example, Read about component state"
          submitLabel="Add lesson"
          onSubmit={createLesson}
          onClose={() => setIsAddingLesson(false)}
        />
      ) : null}
      {editingLesson ? (
        <NameDialog
          title="Edit lesson"
          label="Lesson title"
          initialValue={editingLesson.title}
          submitLabel="Save lesson"
          onSubmit={async (title) => {
            await updateLesson(editingLesson.id, title);
            setEditingLesson(null);
          }}
          onClose={() => setEditingLesson(null)}
        />
      ) : null}
      {resourceDialog ? (
        <LessonResourceDialog
          resource={resourceDialog.resource}
          onSubmit={saveResource}
          onClose={() => setResourceDialog(null)}
        />
      ) : null}
      {deletingLesson ? (
        <ConfirmDialog
          title="Delete lesson?"
          message={`“${deletingLesson.title}” and its ${plural(deletingLesson.resources.length, "resource")} will be deleted. ${plural(questions.filter((question) => question.lessonId === deletingLesson.id).length, "question")} will stay in the topic question list. This cannot be undone.`}
          confirmLabel="Delete lesson"
          onClose={() => setDeletingLesson(null)}
          onConfirm={() => deleteLesson(deletingLesson.id)}
        />
      ) : null}
      {deletingResource ? (
        <ConfirmDialog
          title="Delete resource?"
          message={`“${deletingResource.resource.title}” will be removed from this lesson.`}
          confirmLabel="Delete resource"
          onClose={() => setDeletingResource(null)}
          onConfirm={() =>
            deleteLessonResource(
              deletingResource.lesson.id,
              deletingResource.resource.id,
            )
          }
        />
      ) : null}
      {generatingLesson ? (
        <GenerateQuestionsDialog
          context={{
            ...topicContext,
            topicId,
            lessonId: generatingLesson.id,
            lessonTitle: generatingLesson.title,
            existingQuestions: questions.map((question) => question.text),
          }}
          onClose={() => setGeneratingLesson(null)}
        />
      ) : null}
    </section>
  );
}
