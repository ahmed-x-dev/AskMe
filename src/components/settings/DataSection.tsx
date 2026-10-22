"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  CheckCircle2,
  Download,
  TriangleAlert,
  Upload,
} from "lucide-react";
import { ImportRoadmapButton } from "@/components/backup/ImportRoadmapButton";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import {
  buttonDestructive,
  buttonPrimary,
  buttonSecondaryOnCard,
} from "@/components/ui/styles";
import { downloadBackup } from "@/lib/backupActions";
import { resetAllData, restoreBackup } from "@/lib/data";
import { plural } from "@/lib/format";
import {
  MAX_BACKUP_ARCHIVE_BYTES,
  MAX_BACKUP_ARCHIVE_SIZE_MB,
  readBackupArchive,
  type BackupContents,
} from "@/lib/libraryArchive";
import { clearBackupState, useBackupState } from "@/platform/backupStorage";

type Status = { kind: "success" | "error"; message: string; href?: string };

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/** Backup, restore, import and reset. Everything here works on the browser's local database. */
export function DataSection() {
  const { lastBackupAt } = useBackupState();
  const restoreInputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<Status | null>(null);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isReadingRestore, setIsReadingRestore] = useState(false);
  const [pendingRestore, setPendingRestore] = useState<BackupContents | null>(
    null,
  );
  const [isResetOpen, setIsResetOpen] = useState(false);

  const handleBackup = async () => {
    setIsBackingUp(true);
    setStatus(null);

    try {
      await downloadBackup();
      setStatus({
        kind: "success",
        message: "Backup downloaded. Keep the ZIP file somewhere safe.",
      });
    } catch (error) {
      setStatus({
        kind: "error",
        message:
          error instanceof Error
            ? error.message
            : "The backup could not be created.",
      });
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleRestoreFile = async (file: File | undefined) => {
    if (!file) return;

    if (file.size > MAX_BACKUP_ARCHIVE_BYTES) {
      setStatus({
        kind: "error",
        message: `The backup ZIP is too large. Choose a file no larger than ${MAX_BACKUP_ARCHIVE_SIZE_MB} MB.`,
      });
      return;
    }

    setIsReadingRestore(true);
    setStatus(null);

    try {
      setPendingRestore(
        readBackupArchive(new Uint8Array(await file.arrayBuffer())),
      );
    } catch (error) {
      setStatus({
        kind: "error",
        message:
          error instanceof Error
            ? error.message
            : "The backup could not be read.",
      });
    } finally {
      setIsReadingRestore(false);
      if (restoreInputRef.current) restoreInputRef.current.value = "";
    }
  };

  const restoreSummary = pendingRestore
    ? `${plural(pendingRestore.roadmaps.length, "roadmap")}, ${plural(
        pendingRestore.roadmaps.reduce(
          (sum, file) => sum + file.topics.length,
          0,
        ),
        "topic",
      )} and ${plural(
        pendingRestore.roadmaps.reduce(
          (sum, file) => sum + file.questions.length,
          0,
        ),
        "question",
      )}`
    : "";

  return (
    <section
      aria-labelledby="data-heading"
      className="flex w-full flex-col gap-1 rounded-2xl bg-card p-4"
    >
      <h2
        id="data-heading"
        className="text-lg font-medium leading-6.5 text-fg"
      >
        Study data
      </h2>
      <p className="mt-2 text-base leading-6 text-muted">
        Roadmaps and progress are stored in this browser, which may clear local
        data. A full backup is a ZIP containing your roadmaps and progress; it
        never contains your AI key.
      </p>

      <h3 className="mt-5 text-base font-medium leading-6 text-fg">
        Full backup
      </h3>
      <p className="mt-1 text-[13px] leading-4.5 text-muted">
        {lastBackupAt
          ? `Last downloaded: ${formatDate(lastBackupAt)}.`
          : "No backup downloaded yet."}{" "}
        Keep the ZIP in a safe place outside this browser.
      </p>
      <div className="mt-3 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => void handleBackup()}
          disabled={isBackingUp}
          aria-busy={isBackingUp}
          className={buttonPrimary}
        >
          <Download aria-hidden="true" className="h-5 w-5" strokeWidth={1.5} />
          {isBackingUp ? "Preparing…" : "Download backup"}
        </button>
        <input
          ref={restoreInputRef}
          type="file"
          accept=".zip,application/zip"
          hidden
          data-testid="restore-input"
          onChange={(event) => void handleRestoreFile(event.target.files?.[0])}
        />
        <button
          type="button"
          onClick={() => restoreInputRef.current?.click()}
          disabled={isReadingRestore}
          aria-busy={isReadingRestore}
          className={buttonSecondaryOnCard}
        >
          <Upload aria-hidden="true" className="h-5 w-5" strokeWidth={1.5} />
          {isReadingRestore ? "Reading backup…" : "Restore from backup"}
        </button>
      </div>

      <h3 className="mt-6 text-base font-medium leading-6 text-fg">
        Share one roadmap
      </h3>
      <p className="mt-1 text-[13px] leading-4.5 text-muted">
        Export a JSON file from a roadmap card on the home page. It includes
        topics, links, and questions but not progress. Import adds a separate
        new roadmap; it does not replace existing data.
      </p>
      <div className="mt-3">
        <ImportRoadmapButton
          className={buttonSecondaryOnCard}
          onImported={({ roadmap, topicCount, questionCount }) =>
            setStatus({
              kind: "success",
              message: `Imported “${roadmap.title}” with ${plural(topicCount, "topic")} and ${plural(questionCount, "question")}.`,
              href: `/roadmap/${roadmap.id}`,
            })
          }
          onError={(message) => setStatus({ kind: "error", message })}
        />
      </div>

      {status ? (
        <div
          role={status.kind === "error" ? "alert" : "status"}
          className={`mt-3 flex items-start gap-2 text-[13px] leading-4.5 ${status.kind === "error" ? "text-bad-fg" : "text-accent-text"}`}
        >
          {status.kind === "error" ? (
            <AlertCircle
              aria-hidden="true"
              className="mt-px h-4 w-4 shrink-0"
              strokeWidth={1.5}
            />
          ) : (
            <CheckCircle2
              aria-hidden="true"
              className="mt-px h-4 w-4 shrink-0"
              strokeWidth={1.5}
            />
          )}
          <p className="min-w-0 wrap-break-word">
            {status.message}{" "}
            {status.href ? (
              <Link
                href={status.href}
                className="font-medium underline underline-offset-2"
              >
                Open it
              </Link>
            ) : null}
          </p>
        </div>
      ) : null}

      <section
        aria-labelledby="reset-data-heading"
        className="mt-7 rounded-2xl bg-bg p-4"
      >
        <h3
          id="reset-data-heading"
          className="flex items-center gap-2 text-base font-medium leading-6 text-bad-fg"
        >
          <TriangleAlert
            aria-hidden="true"
            className="h-5 w-5 shrink-0"
            strokeWidth={1.5}
          />
          Reset all data
        </h3>
        <p className="mt-2 text-[13px] leading-4.5 text-muted">
          Permanently deletes all roadmaps, topics, questions, and study
          progress from this browser. Your AI key and theme preference stay.
          This cannot be undone.
        </p>
        <button
          type="button"
          onClick={() => setIsResetOpen(true)}
          className={`mt-3 ${buttonDestructive}`}
        >
          Reset all data
        </button>
      </section>

      {pendingRestore ? (
        <ConfirmDialog
          title="Restore this backup?"
          message={`This replaces all roadmaps, topics, questions, and progress in this browser with ${restoreSummary} from the backup. Your AI key and theme preference stay. This cannot be undone.`}
          confirmLabel="Replace my data"
          busyLabel="Restoring…"
          onConfirm={async () => {
            await restoreBackup(pendingRestore);
            setStatus({
              kind: "success",
              message: `Backup restored: ${restoreSummary}.`,
            });
          }}
          onClose={() => setPendingRestore(null)}
        />
      ) : null}

      {isResetOpen ? (
        <ConfirmDialog
          title="Reset all data?"
          message="This deletes every roadmap, topic, question and all progress in this browser. Download a backup first if you might want it back. Your AI key and theme preference stay. This cannot be undone."
          confirmLabel="Delete everything"
          busyLabel="Deleting…"
          onConfirm={async () => {
            await resetAllData();
            clearBackupState();
            setStatus({ kind: "success", message: "All data was deleted." });
          }}
          onClose={() => setIsResetOpen(false)}
        />
      ) : null}
    </section>
  );
}
