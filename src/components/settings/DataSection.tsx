"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { Download, TriangleAlert, Upload } from "lucide-react";
import { ImportRoadmapButton } from "@/components/backup/ImportRoadmapButton";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { buttonDestructive, buttonPrimary, buttonSecondaryOnCard } from "@/components/ui/styles";
import { downloadBackup } from "@/lib/backupActions";
import { resetAllData, restoreBackup } from "@/lib/data";
import { plural } from "@/lib/format";
import { readBackupArchive, type BackupContents } from "@/lib/libraryArchive";
import { clearBackupState, useBackupState } from "@/platform/backupStorage";

type Status = { kind: "success" | "error"; message: string; href?: string };

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

/** Backup, restore, import and reset. Everything here works on the browser's local database. */
export function DataSection() {
  const { lastBackupAt } = useBackupState();
  const restoreInputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<Status | null>(null);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [pendingRestore, setPendingRestore] = useState<BackupContents | null>(null);
  const [isResetOpen, setIsResetOpen] = useState(false);

  const handleBackup = async () => {
    setIsBackingUp(true);
    setStatus(null);

    try {
      await downloadBackup();
      setStatus({ kind: "success", message: "Backup downloaded. Keep the ZIP file somewhere safe." });
    } catch (error) {
      setStatus({ kind: "error", message: error instanceof Error ? error.message : "The backup could not be created." });
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleRestoreFile = async (file: File | undefined) => {
    if (!file) return;

    setStatus(null);

    try {
      setPendingRestore(readBackupArchive(new Uint8Array(await file.arrayBuffer())));
    } catch (error) {
      setStatus({ kind: "error", message: error instanceof Error ? error.message : "The backup could not be read." });
    } finally {
      if (restoreInputRef.current) restoreInputRef.current.value = "";
    }
  };

  const restoreSummary = pendingRestore
    ? `${plural(pendingRestore.roadmaps.length, "roadmap")}, ${plural(
        pendingRestore.roadmaps.reduce((sum, file) => sum + file.topics.length, 0),
        "topic",
      )} and ${plural(
        pendingRestore.roadmaps.reduce((sum, file) => sum + file.questions.length, 0),
        "question",
      )}`
    : "";

  return (
    <section aria-labelledby="data-heading" className="w-full rounded-2xl bg-card p-4">
      <h2 id="data-heading" className="text-[18px] font-medium leading-[26px] text-fg">
        Your data
      </h2>
      <p className="mt-2 text-[16px] leading-6 text-muted">
        Everything is stored in this browser only. Browsers can clear it, so download a backup now and then. Backups
        never contain your AI key.
      </p>

      <h3 className="mt-6 text-[16px] font-medium leading-6 text-fg">Backup</h3>
      <p className="mt-1 text-[13px] leading-[18px] text-muted">
        {lastBackupAt ? `Last backup: ${formatDate(lastBackupAt)}` : "No backup yet."} A backup holds every roadmap and
        all your progress.
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
        <button type="button" onClick={() => restoreInputRef.current?.click()} className={buttonSecondaryOnCard}>
          <Upload aria-hidden="true" className="h-5 w-5" strokeWidth={1.5} />
          Restore from backup
        </button>
      </div>

      <h3 className="mt-6 text-[16px] font-medium leading-6 text-fg">Share a roadmap</h3>
      <p className="mt-1 text-[13px] leading-[18px] text-muted">
        Export a roadmap from its card on the home page. A roadmap file holds topics, links and questions, never your
        progress. Import adds it as a new roadmap.
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
        <p
          role={status.kind === "error" ? "alert" : "status"}
          className={`mt-4 text-[13px] leading-[18px] ${status.kind === "error" ? "text-bad-fg" : "text-accent-text"}`}
        >
          {status.message}{" "}
          {status.href ? (
            <Link href={status.href} className="font-medium underline underline-offset-2">
              Open it
            </Link>
          ) : null}
        </p>
      ) : null}

      <h3 className="mt-8 flex items-center gap-2 text-[16px] font-medium leading-6 text-bad-fg">
        <TriangleAlert aria-hidden="true" className="h-5 w-5" strokeWidth={1.5} />
        Reset all data
      </h3>
      <p className="mt-1 text-[13px] leading-[18px] text-muted">
        Deletes every roadmap, topic, question and all progress from this browser. Your AI key and theme stay.
      </p>
      <button
        type="button"
        onClick={() => setIsResetOpen(true)}
        className={`mt-3 ${buttonDestructive}`}
      >
        Reset all data
      </button>

      {pendingRestore ? (
        <ConfirmDialog
          title="Restore this backup?"
          message={`This replaces everything in this browser with ${restoreSummary} from the backup. This cannot be undone.`}
          confirmLabel="Replace my data"
          busyLabel="Restoring…"
          onConfirm={async () => {
            await restoreBackup(pendingRestore);
            setStatus({ kind: "success", message: `Backup restored: ${restoreSummary}.` });
          }}
          onClose={() => setPendingRestore(null)}
        />
      ) : null}

      {isResetOpen ? (
        <ConfirmDialog
          title="Reset all data?"
          message="This deletes every roadmap, topic, question and all progress in this browser. Download a backup first if you might want it back. This cannot be undone."
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
