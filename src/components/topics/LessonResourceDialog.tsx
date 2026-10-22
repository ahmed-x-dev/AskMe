"use client";

import { useRef, useState, type FormEvent } from "react";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { Modal } from "@/components/ui/Modal";
import { buttonGhost, buttonPrimary, fieldClassName } from "@/components/ui/styles";
import { prepareLessonFile } from "@/lib/lessonFiles";
import { withHttps } from "@/lib/format";
import type { LessonResource, ResourceKind } from "@/types/study";
import type { LessonResourceInput } from "@/lib/data/lessons";
import { RESOURCE_KINDS } from "./resourceKinds";

type LessonResourceDialogProps = {
  resource?: LessonResource;
  onSubmit: (values: LessonResourceInput) => Promise<void>;
  onClose: () => void;
};

const inputClassName = `${fieldClassName} font-normal`;

/** Adds or edits one link or document in a lesson. */
export function LessonResourceDialog({ resource, onSubmit, onClose }: LessonResourceDialogProps) {
  const [title, setTitle] = useState(resource?.title ?? "");
  const [source, setSource] = useState<"link" | "file">(resource?.source ?? "link");
  const [url, setUrl] = useState(resource?.source === "link" ? resource.url : "");
  const [kind, setKind] = useState<ResourceKind>(
    resource?.source === "link" ? resource.kind : "docs",
  );
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const isSavingRef = useRef(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSavingRef.current) return;
    isSavingRef.current = true;
    setIsSaving(true);
    setError(null);

    try {
      if (source === "link") {
        await onSubmit({ source, title, kind, url: withHttps(url) });
      } else if (file) {
        await onSubmit(await prepareLessonFile(file, title || file.name));
      } else if (resource?.source === "file") {
        await onSubmit({ ...resource, title });
      } else {
        throw new Error("Choose a document to attach.");
      }
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : "Could not save this resource.",
      );
      isSavingRef.current = false;
      setIsSaving(false);
    }
  };

  return (
    <Modal titleId="lesson-resource-dialog-title" isBusy={isSaving} onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-5 p-5 sm:gap-6 sm:p-6">
        <h2 id="lesson-resource-dialog-title" className="text-[22px] font-medium leading-7">
          {resource ? "Edit lesson resource" : "Add lesson resource"}
        </h2>

        <label className="flex flex-col gap-2 text-base font-medium leading-6">
          Resource type
          <select
            value={source}
            onChange={(event) => {
              setSource(event.target.value as "link" | "file");
              setError(null);
            }}
            className={inputClassName}
          >
            <option value="link">Website link</option>
            <option value="file">Document from this device</option>
          </select>
        </label>

        <label className="flex flex-col gap-2 text-base font-medium leading-6">
          Resource title
          <input
            type="text"
            value={title}
            onChange={(event) => {
              setTitle(event.target.value);
              setError(null);
            }}
            required
            maxLength={100}
            autoFocus
            className={inputClassName}
          />
        </label>

        {source === "link" ? (
          <>
            <label className="flex flex-col gap-2 text-base font-medium leading-6">
              Resource link
              <input
                type="text"
                inputMode="url"
                value={url}
                onChange={(event) => {
                  setUrl(event.target.value);
                  setError(null);
                }}
                required
                className={inputClassName}
              />
            </label>
            <label className="flex flex-col gap-2 text-base font-medium leading-6">
              Kind
              <select
                value={kind}
                onChange={(event) => setKind(event.target.value as ResourceKind)}
                className={inputClassName}
              >
                {RESOURCE_KINDS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </>
        ) : (
          <label className="flex flex-col gap-2 text-base font-medium leading-6">
            {resource?.source === "file" ? "Replace document (optional)" : "Choose document"}
            <input
              type="file"
              accept=".pdf,.txt,.md,.markdown,.doc,.docx"
              required={resource?.source !== "file"}
              onChange={(event) => {
                const selected = event.target.files?.[0] ?? null;
                setFile(selected);
                if (selected && !title) setTitle(selected.name);
                setError(null);
              }}
              className={inputClassName}
            />
            <span className="text-[13px] font-normal leading-4.5 text-muted">
              PDF, TXT, Markdown, or Word documents. Maximum 20 MB.
              {resource?.source === "file" ? ` Current file: ${resource.fileName}.` : ""}
            </span>
          </label>
        )}

        {error ? <ErrorMessage id="lesson-resource-dialog-error">{error}</ErrorMessage> : null}

        <div className="flex flex-wrap justify-end gap-3">
          <button type="button" onClick={onClose} disabled={isSaving} className={buttonGhost}>
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSaving || title.trim() === ""}
            aria-busy={isSaving}
            className={buttonPrimary}
          >
            {isSaving ? "Saving…" : "Save resource"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
