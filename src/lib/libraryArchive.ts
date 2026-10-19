import { unzipSync, zipSync } from 'fflate'

import { parseProgressFile, parseRoadmapFile, slugify, stringifyFile } from './importExport'
import type { ProgressFile, RoadmapFile } from './schemas'

/** Everything a full backup holds: each roadmap with its content, plus the learner's progress. */
export interface BackupContents {
  roadmaps: RoadmapFile[]
  progress: ProgressFile
}

const PROGRESS_PATH = 'progress.json'
const ROADMAP_FOLDER = 'roadmaps/'

/**
 * Builds the backup ZIP. Each roadmap is its own `roadmaps/<n>-<name>.json` file, in the same
 * format as a single-roadmap export, so one can be pulled out and shared. Progress is in
 * `progress.json`. The AI key is never part of a backup.
 */
export function createBackupArchive({ roadmaps, progress }: BackupContents): Uint8Array<ArrayBuffer> {
  const encoder = new TextEncoder()
  const files: Record<string, Uint8Array> = {
    [PROGRESS_PATH]: encoder.encode(stringifyFile(progress)),
  }

  roadmaps.forEach((file, index) => {
    files[`${ROADMAP_FOLDER}${index + 1}-${slugify(file.roadmap.title)}.json`] = encoder.encode(
      stringifyFile(file),
    )
  })

  return zipSync(files)
}

/** Reads a backup ZIP and checks every file inside. Nothing is stored here. */
export function readBackupArchive(archive: Uint8Array): BackupContents {
  let files: ReturnType<typeof unzipSync>

  try {
    files = unzipSync(archive)
  } catch (error) {
    const detail = error instanceof Error ? ` ${error.message}` : ''
    throw new Error(`The selected file is not a readable ZIP archive.${detail}`, { cause: error })
  }

  const decoder = new TextDecoder('utf-8', { fatal: true })
  const read = (path: string): string => {
    try {
      return decoder.decode(files[path])
    } catch {
      throw new Error(`${path} in the backup is not valid text.`)
    }
  }

  if (!files[PROGRESS_PATH]) {
    throw new Error('This is not an AskMe backup: progress.json is missing.')
  }

  const roadmaps = Object.keys(files)
    .filter((path) => path.startsWith(ROADMAP_FOLDER) && path.toLowerCase().endsWith('.json'))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
    .map((path) => parseRoadmapFile(read(path)))

  return { roadmaps, progress: parseProgressFile(read(PROGRESS_PATH)) }
}
