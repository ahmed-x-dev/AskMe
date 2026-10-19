"use client";

import { useRef, useState, type FormEvent } from "react";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { Modal } from "@/components/ui/Modal";
import { buttonGhost, buttonPrimary, fieldClassName } from "@/components/ui/styles";
import { withHttps } from "@/lib/format";
import type { Resource, ResourceKind } from "@/types/study";
import { RESOURCE_KINDS } from "./resourceKinds";

export type ResourceFormValues = {
  title: string;
  url: string;
  kind: ResourceKind;
};

type ResourceDialogProps = {
  resource: Resource;
  onSubmit: (values: ResourceFormValues) => Promise<void>;
  onClose: () => void;
};

const inputClassName = `${fieldClassName} font-normal`;

/** Edits the title, link and kind of one resource. */
export function ResourceDialog({ resource, onSubmit, onClose }: ResourceDialogProps) {
  const [title, setTitle] = useState(resource.title);
  const [url, setUrl] = useState(resource.url);
  const [kind, setKind] = useState<ResourceKind>(resource.kind);
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
      await onSubmit({ title, url: withHttps(url), kind });
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Could not save the link.");
      isSavingRef.current = false;
      setIsSaving(false);
    }
  };

  return (
    <Modal titleId="resource-dialog-title" isBusy={isSaving} onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-5 p-5 sm:gap-6 sm:p-6">
        <h2 id="resource-dialog-title" className="text-[22px] font-medium leading-7">
          Edit learning resource
        </h2>

        <label className="flex flex-col gap-2 text-[16px] font-medium leading-6">
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
            aria-invalid={error ? true : undefined}
            aria-describedby={`resource-title-help${error ? " resource-dialog-error" : ""}`}
            className={inputClassName}
          />
          <span id="resource-title-help" className="text-[13px] font-normal leading-[18px] text-muted">
            Up to 100 characters. This is shown in your resource list.
          </span>
        </label>

        <label className="flex flex-col gap-2 text-[16px] font-medium leading-6">
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
            aria-invalid={error ? true : undefined}
            aria-describedby={`resource-url-help${error ? " resource-dialog-error" : ""}`}
            className={inputClassName}
          />
          <span id="resource-url-help" className="text-[13px] font-normal leading-[18px] text-muted">
            Enter a website address. We add https:// if it is missing.
          </span>
        </label>

        <label className="flex flex-col gap-2 text-[16px] font-medium leading-6">
          Kind
          <select
            value={kind}
            onChange={(event) => {
              setKind(event.target.value as ResourceKind);
              setError(null);
            }}
            className={inputClassName}
          >
            {RESOURCE_KINDS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        {error ? <ErrorMessage id="resource-dialog-error">{error}</ErrorMessage> : null}

        <div className="flex flex-wrap justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className={buttonGhost}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSaving}
            aria-busy={isSaving}
            className={buttonPrimary}
          >
            {isSaving ? "Saving…" : "Save"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
