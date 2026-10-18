"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Ellipsis, Folder, FolderPlus, Pencil, Trash2 } from "lucide-react";

import {
  createSet,
  createSetGroup,
  addSetsToGroup,
  importSetsFromJson,
  listSets,
  renameSetGroup,
  removeSetFromGroup,
  removeSetGroup,
  softDeleteSet,
  updateSetTitle,
} from "@/lib/repository";
import { parseSetJson } from "@/lib/importExport";
import {
  createLibraryArchive,
  readLibraryArchive,
} from "@/lib/libraryArchive";
import type { QuizSet } from "@/types/quiz";
import { EmptyState } from "@/components/ui/EmptyState";
import { SetCard } from "./SetCard";

export function SetsPage() {
  const router = useRouter();
  const [sets, setSets] = useState<QuizSet[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [isChoosingGroupMembers, setIsChoosingGroupMembers] = useState(false);
  const [targetGroup, setTargetGroup] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [selectedSetIds, setSelectedSetIds] = useState<Set<string>>(new Set());
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [openGroupMenuId, setOpenGroupMenuId] = useState<string | null>(null);
  const [openSetMenuId, setOpenSetMenuId] = useState<string | null>(null);
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
    if (
      !window.confirm(
        `Remove the group “${name}”? Its sets will stay in your library.`,
      )
    ) {
      return;
    }

    await removeSetGroup(groupId);
    await refreshSets();
    setImportFeedback({
      kind: "success",
      message: "Group removed; its sets are now ungrouped.",
    });
  };

  const handleRemoveSetFromGroup = async (setId: string, title: string) => {
    await removeSetFromGroup(setId);
    await refreshSets();
    setImportFeedback({
      kind: "success",
      message: `“${title}” is now ungrouped.`,
    });
  };

  const handleCreateGroup = async () => {
    if (!isChoosingGroupMembers) {
      setIsChoosingGroupMembers(true);
      setTargetGroup(null);
      setSelectedSetIds(new Set());
      setSelectedGroupId(null);
      return;
    }

    if (selectedSetIds.size === 0) {
      setImportFeedback({
        kind: "error",
        message: targetGroup
          ? "Choose at least one ungrouped set to add."
          : "Choose at least one set for a group.",
      });
      return;
    }

    if (targetGroup) {
      try {
        await addSetsToGroup(targetGroup.id, [...selectedSetIds]);
        await refreshSets();
        setIsChoosingGroupMembers(false);
        setTargetGroup(null);
        setSelectedSetIds(new Set());
        setImportFeedback({
          kind: "success",
          message: `Sets added to ${targetGroup.name}.`,
        });
      } catch (error) {
        setImportFeedback({
          kind: "error",
          message:
            error instanceof Error
              ? error.message
              : "The sets could not be added to the group.",
        });
      }
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
        message:
          error instanceof Error
            ? error.message
            : "The group could not be created.",
      });
    }
  };

  const handleAddSetsToGroup = (group: { id: string; name: string }) => {
    setTargetGroup(group);
    setIsChoosingGroupMembers(true);
    setSelectedSetIds(new Set());
    setSelectedGroupId(null);
    setOpenGroupMenuId(null);
  };

  const cancelGroupSelection = () => {
    setIsChoosingGroupMembers(false);
    setTargetGroup(null);
    setSelectedSetIds(new Set());
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
  const filteredSets = sets.filter(
    (set) =>
      set.title
        .toLocaleLowerCase()
        .includes(searchText.trim().toLocaleLowerCase()) &&
      (selectedGroupId === null || set.group?.id === selectedGroupId) &&
      (!isChoosingGroupMembers || !set.group),
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
  const noVisibleSets = filteredSets.length === 0;
  const groups = [
    ...new Map(
      sets.filter((set) => set.group).map((set) => [set.group!.id, set.group!]),
    ).values(),
  ];

  const renderSetCard = (set: QuizSet) => (
    <SetCard
      key={set.id}
      set={set}
      isChoosingGroupMembers={isChoosingGroupMembers}
      canSelect={!targetGroup || !set.group}
      isSelected={selectedSetIds.has(set.id)}
      isMenuOpen={openSetMenuId === set.id}
      setOpenSetMenuId={setOpenSetMenuId}
      toggleSelectedSet={toggleSelectedSet}
      handleRenameSet={handleRenameSet}
      handleRemoveSetFromGroup={handleRemoveSetFromGroup}
      handleDeleteSet={handleDeleteSet}
    />
  );

  return (
    <>
      {loadError ? (
        <p role="alert" className="text-[13px] leading-4.5 text-bad-fg">
          {loadError}
        </p>
      ) : null}
      <section className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-[40px] font-medium leading-11 text-fg">
            Library
          </h1>
          <p className="mt-2 text-[16px] leading-6 text-muted tabular-nums">
            {sets.length} set{sets.length === 1 ? "" : "s"} ·{" "}
            {activeQuestionCount} question{activeQuestionCount === 1 ? "" : "s"}
          </p>
        </div>
        <button
          type="button"
          onClick={() => void handleCreateSet()}
          className="min-h-12 shrink-0 rounded-2xl bg-accent px-5 text-[16px] font-medium text-on-accent transition duration-200 ease-out hover:opacity-90 active:scale-[0.98]"
        >
          + New set
        </button>
      </section>

      <section aria-label="Library tools">
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
              onClick={() => importInputRef.current?.click()}
              disabled={isImporting || isExporting}
              aria-busy={isImporting || undefined}
              className="min-h-12 rounded-2xl bg-card px-4 text-[16px] font-medium text-fg transition duration-200 ease-out hover:bg-card-hover disabled:cursor-wait disabled:opacity-70"
            >
              {isImporting ? "Importing…" : "Import"}
            </button>
            <button
              type="button"
              onClick={() => void handleExportLibrary()}
              disabled={isImporting || isExporting || sets.length === 0}
              aria-busy={isExporting || undefined}
              className="min-h-12 rounded-2xl bg-card px-4 text-[16px] font-medium text-fg transition duration-200 ease-out hover:bg-card-hover disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isExporting ? "Exporting…" : "Export"}
            </button>
          </div>
        </div>
        <p className="mt-3 text-[13px] leading-4.5 text-muted">
          {isChoosingGroupMembers
            ? targetGroup
              ? `Select ungrouped sets to add to ${targetGroup.name}, then use the group button.`
              : "Select at least one set card, then create the group."
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

      {sets.length > 0 ? (
        <nav aria-label="Filter sets by group" className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setSelectedGroupId(null)}
            aria-pressed={selectedGroupId === null}
            className={`min-h-12 rounded-full px-4 text-[16px] font-medium transition-colors ${selectedGroupId === null ? "bg-accent text-on-accent" : "bg-card text-muted hover:bg-card-hover"}`}
          >
            All
          </button>
          {groups.map((group) => (
            <button
              key={group.id}
              type="button"
              onClick={() => setSelectedGroupId(group.id)}
              aria-pressed={selectedGroupId === group.id}
              className={`min-h-12 rounded-full px-4 text-[16px] transition-colors ${selectedGroupId === group.id ? "bg-accent text-on-accent" : "bg-card text-muted hover:bg-card-hover"}`}
            >
              {group.name} ·{" "}
              {sets.filter((set) => set.group?.id === group.id).length}
            </button>
          ))}
          {isChoosingGroupMembers ? (
            <>
              <button
                type="button"
                onClick={() => void handleCreateGroup()}
                disabled={isImporting || isExporting}
                className="min-h-12 rounded-2xl bg-accent px-4 text-[16px] font-medium text-on-accent transition duration-200 ease-out hover:opacity-90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
              >
                Apply ({selectedSetIds.size})
              </button>
              <button
                type="button"
                onClick={cancelGroupSelection}
                className="min-h-12 rounded-2xl bg-card px-4 text-[16px] font-medium text-fg transition-colors hover:bg-card-hover"
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => void handleCreateGroup()}
              disabled={isImporting || isExporting}
              aria-label="Create a group"
              title="Create a group"
              className="flex min-h-12 min-w-12 items-center justify-center rounded-full border border-card-hover bg-card text-fg transition-colors hover:bg-card-hover disabled:cursor-not-allowed disabled:opacity-60"
            >
              <FolderPlus
                aria-hidden="true"
                className="h-5 w-5"
                strokeWidth={1.5}
              />
            </button>
          )}
        </nav>
      ) : null}

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
            No matching sets
          </h2>
          <p className="mt-2 text-[16px] leading-6 text-muted">
            Try another search or choose a different group.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchText("");
              setSelectedGroupId(null);
            }}
            className="mt-4 min-h-12 rounded-2xl bg-card px-4 text-[16px] font-medium text-fg transition-colors hover:bg-card-hover"
          >
            Clear filters
          </button>
        </section>
      ) : (
        <section className="space-y-6">
          {[...groupedSets.entries()].map(([groupId, group]) => (
            <section key={groupId} aria-label={group.name}>
              <div
                className={`relative mb-3 flex items-center justify-between gap-3 ${openGroupMenuId === groupId ? "z-40" : "z-0"}`}
              >
                <div className="flex min-w-0 items-center gap-2 text-fg">
                  <Folder
                    aria-hidden="true"
                    className="h-5 w-5 shrink-0 text-accent-text"
                    strokeWidth={1.5}
                  />
                  <h2 className="truncate text-[16px] font-medium leading-6">
                    {group.name}
                  </h2>
                  <span className="text-[13px] leading-4.5 text-muted tabular-nums">
                    {group.sets.length}
                  </span>
                </div>
                <div className="relative shrink-0">
                  <button
                    type="button"
                    onClick={() =>
                      setOpenGroupMenuId((current) =>
                        current === groupId ? null : groupId,
                      )
                    }
                    aria-label={`Open actions for ${group.name}`}
                    aria-expanded={openGroupMenuId === groupId}
                    aria-controls={`group-actions-${groupId}`}
                    className="flex min-h-11 min-w-11 items-center justify-center rounded-[14px] bg-card text-fg transition-colors hover:bg-card-hover"
                  >
                    <Ellipsis
                      aria-hidden="true"
                      className="h-5 w-5"
                      strokeWidth={1.5}
                    />
                  </button>
                  {openGroupMenuId === groupId ? (
                    <div
                      id={`group-actions-${groupId}`}
                      className="absolute inset-e-0 top-full z-50 mt-2 flex w-44 flex-col gap-1 rounded-2xl bg-card p-2 shadow-lg"
                    >
                      <button
                        type="button"
                        onClick={() =>
                          handleAddSetsToGroup({
                            id: groupId,
                            name: group.name,
                          })
                        }
                        className="flex min-h-11 items-center gap-3 rounded-[14px] px-3 text-start text-[16px] text-fg transition-colors hover:bg-card-hover"
                      >
                        <FolderPlus
                          aria-hidden="true"
                          className="h-5 w-5"
                          strokeWidth={1.5}
                        />
                        Add sets
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setOpenGroupMenuId(null);
                          void handleRenameGroup(groupId, group.name);
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
                      <button
                        type="button"
                        onClick={() => {
                          setOpenGroupMenuId(null);
                          void handleRemoveGroup(groupId, group.name);
                        }}
                        className="flex min-h-11 items-center gap-3 rounded-[14px] px-3 text-start text-[16px] text-bad-fg transition-colors hover:bg-bad-bg"
                      >
                        <Trash2
                          aria-hidden="true"
                          className="h-5 w-5"
                          strokeWidth={1.5}
                        />
                        Delete group
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>
              <div className="grid max-w-7xl gap-4 md:grid-cols-2">
                {group.sets.map(renderSetCard)}
              </div>
            </section>
          ))}
          {ungroupedSets.length > 0 ? (
            <section aria-label="Ungrouped sets">
              <h2 className="mb-3 text-[16px] font-medium leading-6 text-fg">
                Ungrouped sets
              </h2>
              <div className="grid max-w-7xl gap-4 md:grid-cols-2">
                {ungroupedSets.map(renderSetCard)}
              </div>
            </section>
          ) : null}
        </section>
      )}
    </>
  );
}
