import { unzipSync, zipSync } from 'fflate'

import { exportSetJson } from './importExport'
import type { QuizSet } from '../types/quiz'

/** Creates a ZIP archive with one portable JSON file for each supplied set. */
export function createLibraryArchive(sets: readonly QuizSet[]): Uint8Array<ArrayBuffer> {
  if (sets.length === 0) {
    throw new Error('There are no sets to export.')
  }

  const files: Record<string, Uint8Array> = {}
  const encoder = new TextEncoder()

  sets.forEach((set, index) => {
    const safeId = set.id.replace(/[^a-zA-Z0-9_-]/g, '_')
    files[`sets/${index + 1}-${safeId}.json`] = encoder.encode(exportSetJson(set))
  })

  return zipSync(files)
}

/** Extracts JSON set files from a ZIP archive without writing archive paths to disk. */
export function readLibraryArchive(archive: Uint8Array): string[] {
  let files: ReturnType<typeof unzipSync>

  try {
    files = unzipSync(archive)
  } catch (error) {
    const detail = error instanceof Error ? ` ${error.message}` : ''
    throw new Error(`The selected file is not a readable ZIP archive.${detail}`, { cause: error })
  }

  const decoder = new TextDecoder('utf-8', { fatal: true })
  const jsonFiles = Object.entries(files)
    .filter(([path]) => !path.endsWith('/') && path.toLowerCase().endsWith('.json'))
    .map(([, contents]) => decoder.decode(contents))

  if (jsonFiles.length === 0) {
    throw new Error('The ZIP archive does not contain any JSON set files.')
  }

  return jsonFiles
}
