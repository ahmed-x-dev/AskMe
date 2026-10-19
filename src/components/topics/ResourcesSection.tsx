"use client";

import { useRef, useState, type FormEvent } from "react";
import {
  ArrowDown,
  ArrowUp,
  BookOpen,
  ExternalLink,
  FileText,
  Link as LinkIcon,
  Pencil,
  Plus,
  Trash2,
  Video,
  type LucideIcon,
} from "lucide-react";
import { ActionMenu } from "@/components/ui/ActionMenu";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { buttonPrimary, fieldOnCardClassName } from "@/components/ui/styles";
import { plural } from "@/lib/format";
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

const fieldInputClassName = `min-w-0 ${fieldOnCardClassName}`;
const RESOURCE_ICONS: Record<ResourceKind, LucideIcon> = {
  docs: BookOpen,
  video: Video,
  article: FileText,
  other: LinkIcon,
};

/** Learning links for one topic, each with a "done" checkbox. */
export function ResourcesSection({ topicId, resources }: ResourcesSectionProps) {
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [kind, setKind] = useState<ResourceKind>("docs");
  const [formError, setFormError] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const isAddingRef = useRef(false);
  const [editing, setEditing] = useState<Resource | null>(null);
  const [deleting, setDeleting] = useState<Resource | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

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

    if (isAddingRef.current || url.trim() === "") return;

    isAddingRef.current = true;
    setIsAdding(true);
    setFormError(null);

    try {
      await addResource({ topicId, url: withHttps(url), title, kind });
      setUrl("");
      setTitle("");
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Could not add the link.");
    } finally {
      isAddingRef.current = false;
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
    <section id="resources-section" aria-labelledby="resources-heading" className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 id="resources-heading" className="text-[18px] font-medium leading-[26px] text-fg">
            Learning resources
          </h2>
          <p className="text-[13px] leading-[18px] text-muted tabular-nums">
            {resources.length === 0
              ? "Use links to support your study."
              : plural(resources.length, "resource")}
          </p>
        </div>
      </div>

      {resources.length === 0 ? (
        <div className="rounded-2xl bg-card px-4 py-3 text-[13px] leading-[18px] text-muted">
          Add a course page, video, or article you want to use while studying this topic.
        </div>
      ) : null}

      <form onSubmit={handleAdd} className="flex flex-col gap-3 rounded-2xl bg-card p-4">
        <div className="grid min-w-0 gap-3 sm:grid-cols-2">
          <label className="flex min-w-0 flex-col gap-2 text-[13px] font-medium leading-[18px] text-fg">
            Resource link
            <input
              type="text"
              inputMode="url"
              value={url}
              onChange={(event) => {
                setUrl(event.target.value);
                setFormError(null);
              }}
              placeholder="Paste a website address"
              required
              aria-invalid={formError !== null}
              aria-describedby={`resource-url-hint${formError ? " resource-form-error" : ""}`}
              className={fieldInputClassName}
            />
            <span id="resource-url-hint" className="font-normal text-muted">
              We add https:// if you leave out the protocol.
            </span>
          </label>
          <label className="flex min-w-0 flex-col gap-2 text-[13px] font-medium leading-[18px] text-fg">
            Link title <span className="font-normal text-muted">(optional)</span>
            <input
              type="text"
              value={title}
              onChange={(event) => {
                setTitle(event.target.value);
                setFormError(null);
              }}
              maxLength={100}
              placeholder="For example, React documentation"
              aria-invalid={formError !== null}
              aria-describedby={`resource-title-hint${formError ? " resource-form-error" : ""}`}
              className={fieldInputClassName}
            />
            <span id="resource-title-hint" className="font-normal text-muted">
              Leave blank to use the website name.
            </span>
          </label>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <label className="flex flex-1 flex-col gap-2 text-[13px] font-medium leading-[18px] text-fg">
            Resource type
            <select
              value={kind}
              onChange={(event) => {
                setKind(event.target.value as ResourceKind);
                setFormError(null);
              }}
              className={fieldInputClassName}
            >
              {RESOURCE_KINDS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <button
            type="submit"
            disabled={isAdding || url.trim() === ""}
            aria-busy={isAdding}
            className={`${buttonPrimary} w-full sm:w-auto`}
          >
            <Plus aria-hidden="true" className="h-5 w-5" strokeWidth={1.5} />
            {isAdding ? "Adding…" : "Add resource"}
          </button>
        </div>
        {formError ? (
          <ErrorMessage variant="inline" id="resource-form-error">
            <span>{formError}</span>
          </ErrorMessage>
        ) : null}
      </form>

      {actionError ? <ErrorMessage>{actionError}</ErrorMessage> : null}

      {resources.length > 0 ? (
        <ul className="flex flex-col gap-3">
          {resources.map((resource, index) => {
            const ResourceIcon = RESOURCE_ICONS[resource.kind];
            const kindLabel = RESOURCE_KINDS.find((option) => option.value === resource.kind)?.label ?? "Other";

            return (
              <li key={resource.id} className="flex min-w-0 items-start gap-3 rounded-2xl bg-card p-3">
                <label className="flex h-12 w-12 shrink-0 cursor-pointer items-center justify-center">
                  <input
                    type="checkbox"
                    checked={resource.done}
                    onChange={(event) =>
                      void run(() => setResourceDone(resource.id, event.target.checked))
                    }
                    aria-label={
                      resource.done
                        ? `Mark “${resource.title}” as not done`
                        : `Mark “${resource.title}” as done`
                    }
                    className="h-5 w-5 accent-(--accent)"
                  />
                </label>

                <span
                  aria-hidden="true"
                  className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-bg text-muted"
                >
                  <ResourceIcon className="h-5 w-5" strokeWidth={1.5} />
                </span>

                <div className="min-w-0 flex-1">
                  {isSafeLink(resource.url) ? (
                    <a
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex min-w-0 items-start gap-2 text-[16px] font-medium leading-6 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-card ${
                        resource.done ? "text-muted line-through" : "text-fg"
                      }`}
                    >
                      <span className="min-w-0 flex-1 wrap-break-word">{resource.title}</span>
                      <ExternalLink aria-hidden="true" className="mt-1 h-4 w-4 shrink-0" strokeWidth={1.5} />
                    </a>
                  ) : (
                    <span className="block min-w-0 wrap-break-word text-[16px] font-medium leading-6 text-muted">
                      {resource.title}
                    </span>
                  )}
                  <p className="mt-1 text-[13px] leading-[18px] text-muted">
                    <span className="font-medium">{kindLabel}</span>
                    <span aria-hidden="true"> · </span>
                    <span className="break-all">{hostOf(resource.url)}</span>
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
            );
          })}
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
