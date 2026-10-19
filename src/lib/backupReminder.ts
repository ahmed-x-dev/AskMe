import { addDays } from './srs'

/** The learner is reminded when the last backup is older than this many days. */
export const BACKUP_REMINDER_DAYS = 7

/** "Later" hides the reminder for this many days. */
export const BACKUP_SNOOZE_DAYS = 3

export interface BackupReminderInput {
  now: Date
  /** When the learner last downloaded a full backup, if ever. */
  lastBackupAt: string | null
  /** The reminder stays hidden until this time. */
  snoozedUntil: string | null
  /** When the oldest roadmap was created, or `null` when there is no data. */
  oldestDataAt: string | null
}

/**
 * Decides whether to show the backup reminder. With no data there is nothing to lose. Without a
 * backup yet, the clock starts when the first roadmap was made, so a new user is not nagged on day one.
 */
export function shouldRemindBackup({ now, lastBackupAt, snoozedUntil, oldestDataAt }: BackupReminderInput): boolean {
  if (oldestDataAt === null) {
    return false
  }

  if (snoozedUntil !== null && snoozedUntil > now.toISOString()) {
    return false
  }

  const since = lastBackupAt ?? oldestDataAt
  const remindAt = addDays(new Date(since), BACKUP_REMINDER_DAYS)

  return remindAt <= now
}
