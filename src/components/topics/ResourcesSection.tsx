"use client";

import { useState, type FormEvent } from "react";
import { ArrowDown, ArrowUp, ExternalLink, Pencil, Plus, Trash2 } from "lucide-react";
import { ActionMenu } from "@/components/ui/ActionMenu";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { fieldClassName } from "@/components/ui/styles";
import {
  addResource,
  deleteResource,
  reorderResources,
  setResourceDone,
  updateResource,
} from "@/lib/data";
import { withHttps } from "@/lib/format";
import type { Resource, ResourceKind } from "@/types/study";
import { ResourceDialog, type ResourceFormValues } from "./ResourceDialog";
import { hostOf, isSafeLink, RESOURCE_KINDS } from "./resourceKinds";

type ResourcesSectionProps = {
  topicId: string;
  resources: Resource[];
};

const fieldInputClassName = `min-w-0 ${fieldClassName}`;

/** Learning links for one topic, each with a "done" checkbox. */
export function ResourcesSection({ topicId, resources }: ResourcesSectionProps) {
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [kind, setKind] = useState<ResourceKind>("docs");
  const [formError, setFormError] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [editing, setEditing] = useState<Resource | null>(null);
  const [deleting, setDeleting] = useState<Resource | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const completed = resources.filter((resource) => resource.done).length;

  const run = async (action: () => Promise<void>) => {
    try {
      await action();
      setActionError(null);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Something went wrong.");
    }
  };

  const handleAdd = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (url.trim() === "") return;

    setIsAdding(true);
    setFormError(null);

    try {
      await addResource({ topicId, url: withHttps(url), title, kind });
      setUrl("");
      setTitle("");
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Could not add the link.");
    } finally {
      setIsAdding(false);
    }
  };

  const handleMove = (resource: Resource, direction: -1 | 1) => {
    const ids = resources.map((item) => item.id);
    const from = ids.indexOf(resource.id);
    const to = from + direction;

    if (to < 0 || to >= ids.length) return;

    [ids[from], ids[to]] = [ids[to], ids[from]];
    void run(() => reorderResources(ids));
  };

  const handleEdit = async (resource: Resource, values: ResourceFormValues) => {
    await updateResource(resource.id, values);
    setEditing(null);
  };

  return (
    <section aria-labelledby="resources-heading" className="flex flex-col gap-4">
      <div>
        <h2 id="resources-heading" className="text-[16px] font-medium leading-6 text-fg">
          Resources
        </h2>
        <p className="text-[13px] leading-[18px] text-muted tabular-nums">
          {resources.length === 0 ? "No links yet" : `${completed} / ${resources.length} done`}
        </p>
      </div>

      {resources.length > 0 ? (
        <ProgressBar label="Resources done" completed={completed} total={resources.length} />
      ) : null}

      <form onSubmit={handleAdd} className="flex flex-col gap-2">
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            type="text"
            inputMode="url"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            placeholder="Paste a link"
            aria-label="Link"
            aria-invalid={formError !== null}
            aria-describedby={formError ? "resource-form-error" : undefined}
            className={`${fieldInputClassName} sm:flex-1`}
          />
          <input
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            maxLength={100}
            placeholder="Title (optional)"
            aria-label="Link title (optional)"
            className={`${fieldInputClassName} sm:flex-1`}
          />
        </div>
        <div className="flex gap-2">
          <select
            value={kind}
            onChange={(event) => setKind(event.target.value as ResourceKind)}
            aria-label="Kind of link"
            className={`${fieldInputClassName} flex-1 sm:w-auto sm:flex-none`}
          >
            {RESOURCE_KINDS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <button
            type="submit"
            disabled={isAdding || url.trim() === ""}
            aria-busy={isAdding}
            aria-label="Add link"
            className="flex min-h-12 min-w-12 items-center justify-center rounded-2xl bg-accent text-on-accent transition duration-150 ease-out hover:opacity-90 active:scale-[0.98] disabled:cursor-not-allowed"
          >
            <Plus aria-hidden="true" className="h-5 w-5" strokeWidth={1.5} />
          </button>
        </div>
        {formError ? (
          <ErrorMessage variant="inline" id="resource-form-error">
            {formError}
          </ErrorMessage>
        ) : null}
      </form>

      {actionError ? <ErrorMessage>{actionError}</ErrorMessage> : null}

      {resources.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {resources.map((resource, index) => (
            <li key={resource.id} className="flex items-center gap-2 rounded-2xl bg-card p-3">
              <label className="flex h-12 w-12 shrink-0 cursor-pointer items-center justify-center">
                <input
                  type="checkbox"
                  checked={resource.done}
                  onChange={(event) =>
                    void run(() => setResourceDone(resource.id, event.target.checked))
                  }
                  aria-label={`Mark “${resource.title}” as done`}
                  className="h-5 w-5 accent-(--accent)"
                />
              </label>

              <div className="min-w-0 flex-1">
                {isSafeLink(resource.url) ? (
                  <a
                    href={resource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`inline-flex max-w-full items-center gap-2 text-[16px] font-medium leading-6 hover:underline ${
                      resource.done ? "text-muted line-through" : "text-fg"
                    }`}
                  >
                    <span className="wrap-break-word">{resource.title}</span>
                    <ExternalLink aria-hidden="true" className="h-4 w-4 shrink-0" strokeWidth={1.5} />
                  </a>
                ) : (
                  <span className="wrap-break-word text-[16px] font-medium leading-6 text-muted">
                    {resource.title}
                  </span>
                )}
                <p className="truncate text-[13px] leading-[18px] text-muted">
                  {RESOURCE_KINDS.find((option) => option.value === resource.kind)?.label} ·{" "}
                  {hostOf(resource.url)}
                </p>
              </div>

              <ActionMenu
                label={`Actions for ${resource.title}`}
                items={[
                  { label: "Edit", icon: Pencil, onSelect: () => setEditing(resource) },
                  {
                    label: "Move up",
                    icon: ArrowUp,
                    disabled: index === 0,
                    onSelect: () => handleMove(resource, -1),
                  },
                  {
                    label: "Move down",
                    icon: ArrowDown,
                    disabled: index === resources.length - 1,
                    onSelect: () => handleMove(resource, 1),
                  },
                  {
                    label: "Delete",
                    icon: Trash2,
                    danger: true,
                    onSelect: () => setDeleting(resource),
                  },
                ]}
              />
            </li>
          ))}
        </ul>
      ) : null}

      {deleting ? (
        <ConfirmDialog
          title="Delete link?"
          message={`“${deleting.title}” will be removed from this topic.`}
          confirmLabel="Delete link"
          onClose={() => setDeleting(null)}
          onConfirm={() => deleteResource(deleting.id)}
        />
      ) : null}

      {editing ? (
        <ResourceDialog
          resource={editing}
          onSubmit={(values) => handleEdit(editing, values)}
          onClose={() => setEditing(null)}
        />
      ) : null}
    </section>
  );
}
