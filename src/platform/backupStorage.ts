import { useSyncExternalStore } from 'react'

import { addDays } from '../lib/srs'
import { BACKUP_SNOOZE_DAYS } from '../lib/backupReminder'

const LAST_BACKUP_KEY = 'askme-last-backup'
const SNOOZE_KEY = 'askme-backup-snooze'
const CHANGE_EVENT = 'askme-backup-change'

/** Browser storage can be blocked (private mode), so every access is guarded. */
function read(key: string): string | null {
  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

function write(key: string, value: string | null): void {
  try {
    if (value === null) {
      window.localStorage.removeItem(key)
    } else {
      window.localStorage.setItem(key, value)
    }
  } catch {
    // Without storage the reminder simply keeps showing. Nothing else depends on it.
  }

  window.dispatchEvent(new Event(CHANGE_EVENT))
}

/** Remembers that a full backup was just downloaded. */
export function markBackedUp(now: Date = new Date()): void {
  write(LAST_BACKUP_KEY, now.toISOString())
  write(SNOOZE_KEY, null)
}

/** Hides the backup reminder for a few days. */
export function snoozeBackupReminder(now: Date = new Date()): void {
  write(SNOOZE_KEY, addDays(now, BACKUP_SNOOZE_DAYS).toISOString())
}

/** Forgets the backup dates, used after "Reset all data". */
export function clearBackupState(): void {
  write(LAST_BACKUP_KEY, null)
  write(SNOOZE_KEY, null)
}

export interface BackupState {
  lastBackupAt: string | null
  snoozedUntil: string | null
}

function subscribe(onChange: () => void): () => void {
  window.addEventListener('storage', onChange)
  window.addEventListener(CHANGE_EVENT, onChange)

  return () => {
    window.removeEventListener('storage', onChange)
    window.removeEventListener(CHANGE_EVENT, onChange)
  }
}

// `useSyncExternalStore` needs a snapshot that is equal while nothing changed, so a string is used.
const getSnapshot = () => JSON.stringify([read(LAST_BACKUP_KEY), read(SNOOZE_KEY)])
const getServerSnapshot = () => JSON.stringify([null, null])

/** Reads the backup dates and re-renders when they change (also across tabs). */
export function useBackupState(): BackupState {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
  const [lastBackupAt, snoozedUntil] = JSON.parse(snapshot) as [string | null, string | null]

  return { lastBackupAt, snoozedUntil }
}
