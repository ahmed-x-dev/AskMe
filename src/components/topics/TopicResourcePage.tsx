"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useLiveQuery } from "dexie-react-hooks";
import { ArrowLeft, Download, ExternalLink } from "lucide-react";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { Markdown } from "@/components/ui/Markdown";
import {
  buttonPrimary,
  buttonSecondary,
  buttonSecondaryCompact,
  fieldClassName,
} from "@/components/ui/styles";
import { getTopicLessonResource, updateLessonResource } from "@/lib/data";
import {
  downloadLessonFile,
  isMarkdownLessonFile,
  prepareLessonFile,
  readLessonMarkdown,
} from "@/lib/lessonFiles";
import type { LessonResource } from "@/types/study";
import { isSafeLink, videoEmbedUrl } from "./resourceKinds";

type Mode = "edit" | "preview";

/** A dedicated page for reading a Markdown lesson resource or watching a video link. */
export function TopicResourcePage() {
  const params = useParams<{ id: string; resourceId: string }>();
  const topicId = typeof params.id === "string" ? params.id : "";
  const resourceId =
    typeof params.resourceId === "string" ? params.resourceId : "";
  const data = useLiveQuery(
    () => getTopicLessonResource(topicId, resourceId),
    [topicId, resourceId],
  );

  if (data === undefined) {
    return (
      <div
        role="status"
        aria-busy="true"
        aria-label="Loading resource"
        className="mx-auto w-full max-w-5xl"
      >
        <div className="h-12 w-48 animate-pulse rounded-2xl bg-card" />
        <div className="mt-6 aspect-video animate-pulse rounded-2xl bg-card" />
      </div>
    );
  }

  if (!data) {
    return (
      <section className="mx-auto flex w-full max-w-xl flex-col items-start gap-4 rounded-2xl bg-card p-6">
        <h1 className="text-[22px] font-medium leading-7">
          Resource not found
        </h1>
        <p className="text-base leading-6 text-muted">
          It may have been removed from this topic.
        </p>
        <Link
          href={topicId ? `/topic/${topicId}` : "/"}
          className={buttonSecondaryCompact}
        >
          <ArrowLeft aria-hidden="true" className="h-5 w-5" strokeWidth={1.5} />
          Back to topic
        </Link>
      </section>
    );
  }

  const { topic, lesson, resource } = data;

  return (
    <section className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <Link href={`/topic/${topic.id}`} className={buttonSecondaryCompact}>
        <ArrowLeft
          aria-hidden="true"
          className="h-5 w-5 rtl:rotate-180"
          strokeWidth={1.5}
        />
        Back to topic
      </Link>

      {resource.source === "file" ? (
        isMarkdownLessonFile(resource) ? (
          <MarkdownResource
            key={resource.id}
            lessonId={lesson.id}
            resource={resource}
          />
        ) : (
          <section className="flex flex-col items-start gap-4 rounded-2xl bg-card p-5">
            <div>
              <h1 className="wrap-break-word text-[22px] font-medium leading-7">
                {resource.title}
              </h1>
              <p className="mt-1 text-sm leading-5 text-muted">
                {lesson.title} · {resource.fileName}
              </p>
            </div>
            <button
              type="button"
              onClick={() => downloadLessonFile(resource)}
              className={buttonSecondary}
            >
              <Download
                aria-hidden="true"
                className="h-5 w-5"
                strokeWidth={1.5}
              />
              Download document
            </button>
          </section>
        )
      ) : resource.kind === "video" ? (
        <VideoResource resource={resource} lessonTitle={lesson.title} />
      ) : (
        <section className="flex flex-col items-start gap-4 rounded-2xl bg-card p-5">
          <h1 className="wrap-break-word text-[22px] font-medium leading-7">
            {resource.title}
          </h1>
          {isSafeLink(resource.url) ? (
            <a
              href={resource.url}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonSecondary}
            >
              <ExternalLink
                aria-hidden="true"
                className="h-5 w-5"
                strokeWidth={1.5}
              />
              Open link
            </a>
          ) : null}
        </section>
      )}
    </section>
  );
}

function VideoResource({
  resource,
  lessonTitle,
}: {
  resource: Extract<LessonResource, { source: "link" }>;
  lessonTitle: string;
}) {
  const embedUrl = videoEmbedUrl(resource.url);

  return (
    <div className="flex flex-col gap-5">
      <header>
        <h1 className="wrap-break-word text-[22px] font-medium leading-7">
          {resource.title}
        </h1>
        <p className="mt-1 text-sm leading-5 text-muted">{lessonTitle}</p>
      </header>
      {embedUrl ? (
        <div className="aspect-video w-full overflow-hidden rounded-2xl bg-card">
          <iframe
            src={embedUrl}
            title={resource.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
            className="h-full w-full border-0"
          />
        </div>
      ) : (
        <div className="flex flex-col items-start gap-3 rounded-2xl bg-card p-5">
          <p className="text-base leading-6 text-muted">
            This video host does not support in-app playback.
          </p>
          {isSafeLink(resource.url) ? (
            <a
              href={resource.url}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonSecondary}
            >
              <ExternalLink
                aria-hidden="true"
                className="h-5 w-5"
                strokeWidth={1.5}
              />
              Open video externally
            </a>
          ) : null}
        </div>
      )}
    </div>
  );
}

function MarkdownResource({
  lessonId,
  resource,
}: {
  lessonId: string;
  resource: Extract<LessonResource, { source: "file" }>;
}) {
  const [saved, setSaved] = useState(() => readLessonMarkdown(resource));
  const [draft, setDraft] = useState(saved);
  const [mode, setMode] = useState<Mode>("preview");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isDirty = draft !== saved;

  const save = async () => {
    if (!isDirty || isSaving) return;
    setIsSaving(true);
    setError(null);

    try {
      const file = new File([draft], resource.fileName, {
        type: resource.mimeType,
      });
      const input = await prepareLessonFile(file, resource.title);
      await updateLessonResource(lessonId, resource.id, input);
      setSaved(draft);
      setMode("preview");
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Could not save this document.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="flex flex-col gap-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="wrap-break-word text-[22px] font-medium leading-7">
            {resource.title}
          </h1>
          <p className="mt-1 wrap-break-word text-sm leading-5 text-muted">
            {resource.fileName}
          </p>
        </div>
        <div
          role="group"
          aria-label="Document view"
          className="flex gap-1 rounded-[14px] bg-card p-0.75"
        >
          {(["edit", "preview"] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setMode(value)}
              aria-pressed={mode === value}
              className={`min-h-12 rounded-[11px] px-3 text-[13px] font-medium leading-4.5 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-card ${
                mode === value
                  ? "bg-accent text-on-accent active:scale-98"
                  : "text-muted hover:bg-card-hover hover:text-fg active:scale-98"
              }`}
            >
              {value === "edit" ? "Edit" : "Preview"}
            </button>
          ))}
        </div>
      </header>

      {mode === "edit" ? (
        <textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          aria-label={`${resource.title} (Markdown)`}
          className={`min-h-[65vh] w-full resize-y py-3 ${fieldClassName}`}
        />
      ) : (
        <div className="min-h-24 w-full ">
          {draft.trim() ? (
            <Markdown>{draft}</Markdown>
          ) : (
            <p className="text-base leading-6 text-muted">
              This document is empty.
            </p>
          )}
        </div>
      )}

      {error ? <ErrorMessage>{error}</ErrorMessage> : null}
      {mode === "edit" ? (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => void save()}
            disabled={!isDirty || isSaving}
            aria-busy={isSaving}
            className={buttonPrimary}
          >
            {isSaving ? "Saving…" : "Save changes"}
          </button>
        </div>
      ) : null}
    </section>
  );
}
