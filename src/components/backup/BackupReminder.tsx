"use client";

import { useState } from "react";
import { CheckCircle2, DatabaseBackup } from "lucide-react";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { buttonGhost, buttonPrimary } from "@/components/ui/styles";
import { downloadBackup } from "@/lib/backupActions";
import { shouldRemindBackup } from "@/lib/backupReminder";
import { snoozeBackupReminder, useBackupState } from "@/platform/backupStorage";

/** A banner that asks for a backup when the last one is old. Browsers can clear local data, so this matters. */
export function BackupReminder({ oldestDataAt }: { oldestDataAt: string | null }) {
  const { lastBackupAt, snoozedUntil } = useBackupState();
  const [now] = useState(() => new Date());
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [backupComplete, setBackupComplete] = useState(false);

  if (!backupComplete && !shouldRemindBackup({ now, lastBackupAt, snoozedUntil, oldestDataAt })) {
    return null;
  }

  const handleBackup = async () => {
    setIsBusy(true);
    setError(null);

    try {
      await downloadBackup();
      setBackupComplete(true);
    } catch (backupError) {
      setError(backupError instanceof Error ? backupError.message : "The backup could not be created.");
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <section
      aria-label="Backup reminder"
      className={`flex flex-col gap-3 rounded-2xl p-4 ${backupComplete ? "bg-ok-bg text-ok-fg" : "bg-warn-bg text-warn-fg"}`}
    >
      <div className="flex items-start gap-3">
        {backupComplete ? (
          <CheckCircle2 aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0" strokeWidth={1.5} />
        ) : (
          <DatabaseBackup aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0" strokeWidth={1.5} />
        )}
        <p role={backupComplete ? "status" : undefined} className="min-w-0 text-[16px] leading-6">
          {backupComplete
            ? "Backup downloaded. Keep the ZIP file somewhere safe."
            : `${lastBackupAt ? "It has been a while since your last backup." : "You have not made a backup yet."} Your data lives only in this browser, and browsers can clear it.`}
        </p>
      </div>
      {error ? <ErrorMessage>{error}</ErrorMessage> : null}
      {backupComplete ? (
        <button type="button" onClick={() => setBackupComplete(false)} className={`self-start ${buttonGhost}`}>
          Done
        </button>
      ) : (
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => void handleBackup()}
            disabled={isBusy}
            aria-busy={isBusy}
            className={buttonPrimary}
          >
            {isBusy ? "Preparing…" : "Back up now"}
          </button>
          <button
            type="button"
            onClick={() => snoozeBackupReminder()}
            className="min-h-12 rounded-2xl px-4 text-[16px] font-medium underline-offset-4 transition-opacity hover:underline hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
          >
            Remind me later
          </button>
        </div>
      )}
    </section>
  );
}
