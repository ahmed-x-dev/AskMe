"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Folder, FolderPlus, FolderX, Folders, Pencil, Plus, Trash2 } from "lucide-react";

import {
  createSet,
  createSetGroup,
  importSetsFromJson,
  listSets,
  renameSetGroup,
  removeSetFromGroup,
  removeSetGroup,
  softDeleteSet,
  updateSetTitle,
} from "../data/repository";
import { parseSetJson } from "../data/importExport";
import {
  createLibraryArchive,
  readLibraryArchive,
} from "../data/libraryArchive";
import type { QuizSet } from "../types/quiz";

function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
}: {
  title: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
}) {
  return (
    <section className="mx-auto w-full rounded-2xl bg-card p-6 text-center lg:max-w-3xl">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-bg text-muted">
        <Plus aria-hidden="true" className="h-6 w-6" strokeWidth={1.5} />
      </div>
      <h2 className="mt-4 text-[16px] font-medium leading-6 text-fg">
        {title}
      </h2>
      <p className="mx-auto mt-2 max-w-70 text-[16px] leading-6 text-muted">
        {description}
      </p>
      <button
        type="button"
        onClick={onAction}
        className="mt-5 min-h-12 rounded-2xl bg-accent px-5 text-[16px] font-medium text-on-accent transition duration-200 ease-out hover:opacity-90 active:scale-[0.98]"
      >
        {actionLabel}
      </button>
    </section>
  );
}

export function SetsPage() {
  const router = useRouter();
  const [sets, setSets] = useState<QuizSet[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [isChoosingGroupMembers, setIsChoosingGroupMembers] = useState(false);
  const [selectedSetIds, setSelectedSetIds] = useState<Set<string>>(new Set());
  const [showGroupsOnly, setShowGroupsOnly] = useState(false);
  const [importFeedback, setImportFeedback] = useState<{
    kind: "error" | "success";
    message: string;
  } | null>(null);
  const importInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let isCurrent = true;

    listSets()
      .then((nextSets) => {
        if (isCurrent) {
          setSets(nextSets);
        }
      })
      .catch((error: unknown) => {
        if (isCurrent) {
          setLoadError(
            error instanceof Error
              ? error.message
              : "Could not load your sets.",
          );
        }
      });

    return () => {
      isCurrent = false;
    };
  }, []);

  const refreshSets = async () => {
    try {
      const nextSets = await listSets();
      setSets(nextSets);
      setLoadError(null);
    } catch (error) {
      setLoadError(
        error instanceof Error ? error.message : "Could not refresh your sets.",
      );
    }
  };

  const handleCreateSet = async () => {
    const created = await createSet(`Set ${(sets?.length ?? 0) + 1}`);
    await refreshSets();
    router.push(`/set/${created.id}`);
  };

  const handleImportLibrary = async (files: File[]) => {
    setIsImporting(true);
    setImportFeedback(null);

    try {
      const rawJsonFiles: string[] = [];

      for (const file of files) {
        const extension = file.name.toLowerCase().split(".").pop();

        if (extension === "zip") {
          rawJsonFiles.push(
            ...readLibraryArchive(new Uint8Array(await file.arrayBuffer())),
          );
        } else if (extension === "json") {
          rawJsonFiles.push(await file.text());
        } else {
          throw new Error(`“${file.name}” is not a ZIP archive or JSON file.`);
        }
      }

      const incomingSets = rawJsonFiles.map(parseSetJson);
      const existingIds = new Set(sets?.map((set) => set.id) ?? []);
      const replacementCount = incomingSets.filter((set) =>
        existingIds.has(set.id),
      ).length;

      if (
        replacementCount > 0 &&
        !window.confirm(
          `${replacementCount} imported set${replacementCount === 1 ? "" : "s"} ${
            replacementCount === 1 ? "matches" : "match"
          } existing IDs and will replace their current contents. Continue?`,
        )
      ) {
        return;
      }

      const result = await importSetsFromJson(rawJsonFiles);
      await refreshSets();
      setImportFeedback({
        kind: "success",
        message: `Imported ${result.sets.length} set${result.sets.length === 1 ? "" : "s"}${
          result.updatedCount > 0
            ? `; updated ${result.updatedCount} existing`
            : ""
        }.`,
      });
    } catch (error) {
      setImportFeedback({
        kind: "error",
        message:
          error instanceof Error
            ? error.message
            : "The library could not be imported.",
      });
    } finally {
      setIsImporting(false);
    }
  };

  const handleExportLibrary = async () => {
    setIsExporting(true);
    setImportFeedback(null);

    try {
      const activeSets = await listSets();
      if (activeSets.length === 0) {
        throw new Error(
          "Create or import a set before exporting your library.",
        );
      }

      const archive = createLibraryArchive(activeSets);
      const downloadUrl = URL.createObjectURL(
        new Blob([archive], { type: "application/zip" }),
      );
      const downloadLink = document.createElement("a");
      downloadLink.href = downloadUrl;
      downloadLink.download = `askme-library-${new Date().toISOString().slice(0, 10)}.zip`;
      document.body.append(downloadLink);
      downloadLink.click();
      downloadLink.remove();
      window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 0);

      setImportFeedback({
        kind: "success",
        message: `Exported ${activeSets.length} set${activeSets.length === 1 ? "" : "s"} to a ZIP archive.`,
      });
    } catch (error) {
      setImportFeedback({
        kind: "error",
        message:
          error instanceof Error
            ? error.message
            : "The library could not be exported.",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleRenameSet = async (setId: string, currentTitle: string) => {
    const nextTitle = window.prompt("Rename set", currentTitle);

    if (nextTitle === null) {
      return;
    }

    const trimmedTitle = nextTitle.trim();

    if (!trimmedTitle) {
      return;
    }

    const updated = await updateSetTitle(setId, trimmedTitle);

    if (updated) {
      await refreshSets();
    }
  };

  const handleDeleteSet = async (setId: string, title: string) => {
    const confirmed = window.confirm(
      `Delete “${title}”? This hides it from the app.`,
    );

    if (!confirmed) {
      return;
    }

    const deleted = await softDeleteSet(setId);

    if (deleted) {
      await refreshSets();
    }
  };

  const handleRenameGroup = async (groupId: string, currentName: string) => {
    const nextName = window.prompt("Rename group", currentName);

    if (nextName === null || !nextName.trim()) {
      return;
    }

    await renameSetGroup(groupId, nextName);
    await refreshSets();
  };

  const handleRemoveGroup = async (groupId: string, name: string) => {
    if (!window.confirm(`Remove the group “${name}”? Its sets will stay in your library.`)) {
      return;
    }

    await removeSetGroup(groupId);
    await refreshSets();
    setImportFeedback({ kind: "success", message: "Group removed; its sets are now ungrouped." });
  };

  const handleRemoveSetFromGroup = async (setId: string, title: string) => {
    await removeSetFromGroup(setId);
    await refreshSets();
    setImportFeedback({ kind: "success", message: `“${title}” is now ungrouped.` });
  };

  const handleCreateGroup = async () => {
    if (!isChoosingGroupMembers) {
      setIsChoosingGroupMembers(true);
      setSelectedSetIds(new Set());
      return;
    }

    if (selectedSetIds.size < 2) {
      setImportFeedback({ kind: "error", message: "Choose at least two sets for a group." });
      return;
    }

    const name = window.prompt("Name this group", "Untitled group");

    if (name === null) {
      return;
    }

    try {
      await createSetGroup([...selectedSetIds], name);
      await refreshSets();
      setIsChoosingGroupMembers(false);
      setSelectedSetIds(new Set());
      setImportFeedback({ kind: "success", message: "Group created." });
    } catch (error) {
      setImportFeedback({
        kind: "error",
        message: error instanceof Error ? error.message : "The group could not be created.",
      });
    }
  };

  const toggleSelectedSet = (setId: string) => {
    setSelectedSetIds((current) => {
      const next = new Set(current);
      if (next.has(setId)) {
        next.delete(setId);
      } else {
        next.add(setId);
      }
      return next;
    });
  };

  if (sets === null) {
    return (
      <section className="rounded-2xl bg-card p-5">
        {loadError ? (
          <>
            <h2 className="text-[18px] font-medium leading-7 text-fg">
              Could not load sets
            </h2>
            <p
              role="alert"
              className="mt-2 text-[13px] leading-4.5 text-bad-fg"
            >
              {loadError}
            </p>
          </>
        ) : (
          <p role="status" className="text-[16px] leading-6 text-muted">
            Loading your sets…
          </p>
        )}
      </section>
    );
  }

  const activeQuestionCount = sets.reduce(
    (total, set) =>
      total + set.questions.filter((question) => !question.deleted).length,
    0,
  );
  const filteredSets = sets.filter((set) =>
    set.title
      .toLocaleLowerCase()
      .includes(searchText.trim().toLocaleLowerCase()),
  );
  const groupedSets = new Map<string, { name: string; sets: QuizSet[] }>();
  const ungroupedSets: QuizSet[] = [];

  filteredSets.forEach((set) => {
    if (!set.group) {
      ungroupedSets.push(set);
      return;
    }

    const existing = groupedSets.get(set.group.id);
    if (existing) {
      existing.sets.push(set);
    } else {
      groupedSets.set(set.group.id, { name: set.group.name, sets: [set] });
    }
  });
  const noVisibleSets = filteredSets.length === 0 || (showGroupsOnly && groupedSets.size === 0);

  const renderSetCard = (set: QuizSet) => {
    const activeQuestionCount = set.questions.filter(
      (question) => !question.deleted,
    ).length;
    const isSelected = selectedSetIds.has(set.id);

    return (
      <article
        key={set.id}
        onClick={() => {
          if (isChoosingGroupMembers) {
            toggleSelectedSet(set.id);
          }
        }}
        className={`relative flex flex-col rounded-2xl bg-card p-4 transition-colors hover:bg-card-hover ${
          isSelected ? "ring-2 ring-accent ring-offset-2 ring-offset-bg" : ""
        }`}
      >
        <Link
          href={`/set/${set.id}`}
          aria-label={`Open ${set.title}`}
          onClick={(event) => {
            if (isChoosingGroupMembers) {
              event.preventDefault();
            }
          }}
          className="absolute inset-0 z-10 rounded-2xl"
        />
        <div className="pointer-events-none relative z-20 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1">
            <span className="inline-flex rounded-full bg-bg px-3 py-1 text-[13px] leading-4.5 text-muted tabular-nums">
              {activeQuestionCount} question
              {activeQuestionCount === 1 ? "" : "s"}
            </span>
            <h3 className="mt-3 wrap-break-word text-[16px] font-medium leading-6 text-fg">
              {set.title}
            </h3>
          </div>

          {isChoosingGroupMembers ? (
            <span
              aria-label={isSelected ? `${set.title} selected` : `${set.title} not selected`}
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] ${
                isSelected ? "bg-accent text-on-accent" : "bg-bg text-muted"
              }`}
            >
              {isSelected ? <Check aria-hidden="true" className="h-5 w-5" strokeWidth={1.5} /> : null}
            </span>
          ) : (
            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={() => void handleRenameSet(set.id, set.title)}
                aria-label={`Rename ${set.title}`}
                title="Rename set"
                className="pointer-events-auto flex min-h-11 min-w-11 items-center justify-center rounded-[14px] bg-bg text-fg transition-colors hover:bg-card-hover"
              >
                <Pencil aria-hidden="true" className="h-5 w-5" strokeWidth={1.5} />
              </button>
              {set.group ? (
                <button
                  type="button"
                  onClick={() => void handleRemoveSetFromGroup(set.id, set.title)}
                  aria-label={`Remove ${set.title} from ${set.group.name}`}
                  title="Remove from group"
                  className="pointer-events-auto flex min-h-11 min-w-11 items-center justify-center rounded-[14px] bg-bg text-fg transition-colors hover:bg-card-hover"
                >
                  <FolderX aria-hidden="true" className="h-5 w-5" strokeWidth={1.5} />
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => void handleDeleteSet(set.id, set.title)}
                aria-label={`Delete ${set.title}`}
                title="Delete set"
                className="pointer-events-auto flex min-h-11 min-w-11 items-center justify-center rounded-[14px] bg-bg text-bad-fg transition-colors hover:bg-bad-bg"
              >
                <Trash2 aria-hidden="true" className="h-5 w-5" strokeWidth={1.5} />
              </button>
            </div>
          )}
        </div>

        <div className="pointer-events-none relative z-20 mt-4 flex items-center gap-2">
          <span className="text-[13px] leading-4.5 text-muted">
            Updated {new Date(set.updatedAt).toLocaleDateString()}
          </span>
        </div>
      </article>
    );
  };

  return (
    <>
      {loadError ? (
        <p role="alert" className="text-[13px] leading-4.5 text-bad-fg">
          {loadError}
        </p>
      ) : null}
      <section className="flex flex-col gap-5 rounded-2xl bg-card p-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="text-[13px] leading-4.5 text-accent-text">
            Your study library
          </p>
          <h2 className="mt-2 text-[22px] font-medium leading-7 text-fg">
            Make every study session count.
          </h2>
          <p className="mt-2 max-w-105 text-[16px] leading-6 text-muted lg:max-w-150">
            Keep your questions organized and pick up where you left off.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void handleCreateSet()}
          className="min-h-12 shrink-0 rounded-2xl bg-accent px-5 text-[16px] font-medium text-on-accent transition duration-200 ease-out hover:opacity-90 active:scale-[0.98]"
        >
          Create a set
        </button>
      </section>

      <section aria-label="Library overview" className="grid grid-cols-2 gap-3">
        <article className="rounded-2xl bg-card p-4">
          <p className="text-[13px] leading-4.5 text-muted">Study sets</p>
          <p className="mt-1 text-[22px] font-medium leading-7 text-fg tabular-nums">
            {sets.length}
          </p>
        </article>
        <article className="rounded-2xl bg-card p-4">
          <p className="text-[13px] leading-4.5 text-muted">Questions ready</p>
          <p className="mt-1 text-[22px] font-medium leading-7 text-fg tabular-nums">
            {activeQuestionCount}
          </p>
        </article>
      </section>

      <section aria-label="Library tools" className="rounded-2xl bg-card p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <label className="min-w-0 flex-1">
            <span className="sr-only">Search your sets</span>
            <input
              type="search"
              value={searchText}
              onChange={(event) => setSearchText(event.currentTarget.value)}
              placeholder="Search your sets"
              className="min-h-12 w-full rounded-[14px] bg-card px-4 text-[16px] leading-6 text-fg placeholder:text-muted"
            />
          </label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={() => setShowGroupsOnly((current) => !current)}
              aria-pressed={showGroupsOnly}
              className="flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-card-hover bg-card px-4 text-[16px] font-medium text-fg transition duration-200 ease-out hover:bg-card-hover"
            >
              <Folders aria-hidden="true" className="h-5 w-5" strokeWidth={1.5} />
              {showGroupsOnly ? "Show all sets" : "Groups only"}
            </button>
            <button
              type="button"
              onClick={() => void handleCreateGroup()}
              disabled={isImporting || isExporting}
              className="flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-card-hover bg-card px-4 text-[16px] font-medium text-fg transition duration-200 ease-out hover:bg-card-hover disabled:cursor-not-allowed disabled:opacity-60"
            >
              <FolderPlus aria-hidden="true" className="h-5 w-5" strokeWidth={1.5} />
              {isChoosingGroupMembers
                ? `Create group (${selectedSetIds.size})`
                : "Create group"}
            </button>
            <button
              type="button"
              onClick={() => importInputRef.current?.click()}
              disabled={isImporting || isExporting}
              aria-busy={isImporting || undefined}
              className="min-h-12 rounded-2xl bg-card px-4 text-[16px] font-medium text-fg transition duration-200 ease-out hover:bg-card-hover disabled:cursor-wait disabled:opacity-70"
            >
              {isImporting ? "Importing…" : "Import to library"}
            </button>
            <button
              type="button"
              onClick={() => void handleExportLibrary()}
              disabled={isImporting || isExporting || sets.length === 0}
              aria-busy={isExporting || undefined}
              className="min-h-12 rounded-2xl bg-card px-4 text-[16px] font-medium text-fg transition duration-200 ease-out hover:bg-card-hover disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isExporting ? "Exporting…" : "Export library"}
            </button>
          </div>
        </div>
        <p className="mt-3 text-[13px] leading-4.5 text-muted">
          {isChoosingGroupMembers
            ? "Select at least two set cards, then create the group."
            : "Create a group manually to organize related sets."}
        </p>
        <input
          ref={importInputRef}
          type="file"
          accept=".zip,.json,application/zip,application/json"
          multiple
          className="hidden"
          aria-label="Choose a ZIP archive or multiple set JSON files"
          onChange={(event) => {
            const files = Array.from(event.currentTarget.files ?? []);
            event.currentTarget.value = "";

            if (files.length > 0) {
              void handleImportLibrary(files);
            }
          }}
        />
      </section>

      {importFeedback ? (
        <p
          role={importFeedback.kind === "error" ? "alert" : "status"}
          className={`text-[13px] leading-4.5 ${
            importFeedback.kind === "error" ? "text-bad-fg" : "text-accent-text"
          }`}
        >
          {importFeedback.message}
        </p>
      ) : null}

      {sets.length === 0 ? (
        <EmptyState
          title="No sets yet"
          description="Create your first set and start building a habit of revision."
          actionLabel="Create set"
          onAction={() => void handleCreateSet()}
        />
      ) : noVisibleSets ? (
        <section className="rounded-2xl bg-card p-5 text-center">
          <h2 className="text-[16px] font-medium leading-6 text-fg">
            {showGroupsOnly ? "No matching groups" : "No matching sets"}
          </h2>
          <p className="mt-2 text-[16px] leading-6 text-muted">
            {showGroupsOnly
              ? "Switch to all sets or create a group to see it here."
              : "Try another search or clear the search field."}
          </p>
          <button
            type="button"
            onClick={() => {
              if (showGroupsOnly) {
                setShowGroupsOnly(false);
              } else {
                setSearchText("");
              }
            }}
            className="mt-4 min-h-12 rounded-2xl bg-card px-4 text-[16px] font-medium text-fg transition-colors hover:bg-card-hover"
          >
            {showGroupsOnly ? "Show all sets" : "Clear search"}
          </button>
        </section>
      ) : (
        <section className="space-y-6">
          {[...groupedSets.entries()].map(([groupId, group]) => (
            <section key={groupId} aria-label={group.name}>
              <div className="mb-3 flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2 text-fg">
                  <Folder aria-hidden="true" className="h-5 w-5 shrink-0 text-accent-text" strokeWidth={1.5} />
                  <h2 className="truncate text-[16px] font-medium leading-6">{group.name}</h2>
                  <span className="text-[13px] leading-4.5 text-muted tabular-nums">{group.sets.length}</span>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button
                    type="button"
                    onClick={() => void handleRenameGroup(groupId, group.name)}
                    aria-label={`Rename ${group.name}`}
                    className="flex min-h-11 min-w-11 items-center justify-center rounded-[14px] bg-card text-fg transition-colors hover:bg-card-hover"
                  >
                    <Pencil aria-hidden="true" className="h-5 w-5" strokeWidth={1.5} />
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleRemoveGroup(groupId, group.name)}
                    aria-label={`Remove ${group.name}`}
                    title="Remove group"
                    className="flex min-h-11 min-w-11 items-center justify-center rounded-[14px] bg-card text-bad-fg transition-colors hover:bg-bad-bg"
                  >
                    <Trash2 aria-hidden="true" className="h-5 w-5" strokeWidth={1.5} />
                  </button>
                </div>
              </div>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">{group.sets.map(renderSetCard)}</div>
            </section>
          ))}
          {!showGroupsOnly && ungroupedSets.length > 0 ? (
            <section aria-label="Ungrouped sets">
              <h2 className="mb-3 text-[16px] font-medium leading-6 text-fg">Ungrouped sets</h2>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">{ungroupedSets.map(renderSetCard)}</div>
            </section>
          ) : null}
        </section>
      )}
    </>
  );
}
