import { buildBackup, buildRoadmapFile } from './data'
import { downloadFile } from './download'
import { slugify, stringifyFile } from './importExport'
import { createBackupArchive } from './libraryArchive'
import { dayKey } from './progress'
import { markBackedUp } from '../platform/backupStorage'

/** Downloads one roadmap as a JSON file (content only, no progress). */
export async function downloadRoadmap(roadmapId: string): Promise<void> {
  const file = await buildRoadmapFile(roadmapId)

  if (!file) {
    throw new Error('This roadmap no longer exists.')
  }

  downloadFile(`askme-${slugify(file.roadmap.title)}.json`, stringifyFile(file), 'application/json')
}

/** Downloads a full backup ZIP (every roadmap and all progress) and remembers the date for the reminder. */
export async function downloadBackup(): Promise<void> {
  const contents = await buildBackup()

  if (contents.roadmaps.length === 0) {
    throw new Error('There is nothing to back up yet.')
  }

  const now = new Date()

  downloadFile(`askme-backup-${dayKey(now)}.zip`, createBackupArchive(contents), 'application/zip')
  markBackedUp(now)
}
