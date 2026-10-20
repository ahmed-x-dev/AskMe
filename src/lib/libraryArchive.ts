import { Unzip, UnzipInflate, UnzipPassThrough, zipSync } from 'fflate'

import { parseProgressFile, parseRoadmapFile, slugify, stringifyFile } from './importExport'
import type { ProgressFile, RoadmapFile } from './schemas'

/** Everything a full backup holds: each roadmap with its content, plus the learner's progress. */
export interface BackupContents {
  roadmaps: RoadmapFile[]
  progress: ProgressFile
}

const PROGRESS_PATH = 'progress.json'
const ROADMAP_FOLDER = 'roadmaps/'
export const MAX_BACKUP_ARCHIVE_SIZE_MB = 25
export const MAX_BACKUP_ARCHIVE_BYTES = MAX_BACKUP_ARCHIVE_SIZE_MB * 1024 * 1024
export const MAX_BACKUP_UNCOMPRESSED_BYTES = 50 * 1024 * 1024
const MAX_BACKUP_ENTRIES = 1000
const UNZIP_CHUNK_BYTES = 64 * 1024

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

/** Reads a bounded backup ZIP and checks every relevant file. Nothing is stored here. */
export function readBackupArchive(archive: Uint8Array): BackupContents {
  if (archive.byteLength < 22) {
    throw new Error('The selected file is not a readable ZIP archive.')
  }

  if (archive.byteLength > MAX_BACKUP_ARCHIVE_BYTES) {
    throw new Error(`The backup ZIP is too large. Choose a file no larger than ${MAX_BACKUP_ARCHIVE_SIZE_MB} MB.`)
  }

  const files = new Map<string, string>()
  const seenNames = new Set<string>()
  const roadmaps: { path: string; file: RoadmapFile }[] = []
  const unzipper = new Unzip()
  let entryCount = 0
  let uncompressedBytes = 0
  let extractionError: Error | undefined

  unzipper.register(UnzipPassThrough)
  unzipper.register(UnzipInflate)
  unzipper.onfile = (file) => {
    entryCount += 1

    if (entryCount > MAX_BACKUP_ENTRIES) {
      extractionError = new Error('This backup contains too many files to restore.')
      return
    }

    const isProgress = file.name === PROGRESS_PATH
    const isRoadmap = file.name.startsWith(ROADMAP_FOLDER) && file.name.toLowerCase().endsWith('.json')

    if (extractionError || (!isProgress && !isRoadmap)) return

    if (seenNames.has(file.name)) {
      extractionError = new Error('This backup contains a duplicate file.')
      return
    }

    seenNames.add(file.name)

    if (
      file.originalSize !== undefined &&
      file.originalSize > MAX_BACKUP_UNCOMPRESSED_BYTES - uncompressedBytes
    ) {
      extractionError = new Error('This backup expands beyond the restore size limit.')
      file.terminate()
      return
    }

    let text = ''
    const fileDecoder = new TextDecoder('utf-8', { fatal: true })
    file.ondata = (error, chunk, final) => {
      if (extractionError) return

      if (error) {
        extractionError = error
        return
      }

      uncompressedBytes += chunk.byteLength

      if (uncompressedBytes > MAX_BACKUP_UNCOMPRESSED_BYTES) {
        extractionError = new Error('This backup expands beyond the restore size limit.')
        file.terminate()
        return
      }

      try {
        text += fileDecoder.decode(chunk, { stream: !final })

        if (final) {
          text += fileDecoder.decode()
          if (isProgress) files.set(file.name, text)
          if (isRoadmap) roadmaps.push({ path: file.name, file: parseRoadmapFile(text) })
        }
      } catch (decodeError) {
        extractionError = decodeError instanceof Error
          ? decodeError
          : new Error(`${file.name} in the backup is not valid text.`)
      }
    }

    file.start()
  }

  try {
    for (let offset = 0; offset < archive.byteLength; offset += UNZIP_CHUNK_BYTES) {
      const end = Math.min(offset + UNZIP_CHUNK_BYTES, archive.byteLength)
      unzipper.push(archive.subarray(offset, end), end === archive.byteLength)

      if (extractionError) throw extractionError
    }
  } catch (error) {
    if (extractionError) throw extractionError

    const detail = error instanceof Error ? ` ${error.message}` : ''
    throw new Error(`The selected file is not a readable ZIP archive.${detail}`, { cause: error })
  }

  const progressText = files.get(PROGRESS_PATH)

  if (!progressText) {
    throw new Error('This is not an AskMe backup: progress.json is missing.')
  }

  roadmaps.sort((a, b) => a.path.localeCompare(b.path, undefined, { numeric: true }))

  return { roadmaps: roadmaps.map(({ file }) => file), progress: parseProgressFile(progressText) }
}
