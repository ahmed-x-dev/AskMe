import { strToU8, unzipSync, zipSync } from 'fflate'
import { describe, expect, it } from 'vitest'

import { exportSetJson, parseSetJson } from '../../src/data/importExport'
import { createLibraryArchive, readLibraryArchive } from '../../src/data/libraryArchive'
import type { QuizSet } from '../../src/types/quiz'

const sampleSet: QuizSet = {
  schemaVersion: 3,
  id: 'set-1',
  title: 'Biology',
  updatedAt: '2026-10-16T00:00:00.000Z',
  deleted: false,
  questions: [
    {
      id: 'question-1',
      type: 'essay',
      text: 'Explain photosynthesis.',
      difficulty: 'medium',
      tags: ['biology'],
      updatedAt: '2026-10-16T00:00:00.000Z',
      deleted: false,
    },
    {
      id: 'deleted-question',
      type: 'essay',
      text: 'Deleted question.',
      difficulty: 'medium',
      tags: [],
      updatedAt: '2026-10-16T00:00:00.000Z',
      deleted: true,
    },
  ],
}

describe('library archives', () => {
  it('exports each set to a ZIP JSON file and excludes deleted questions', () => {
    const archive = createLibraryArchive([sampleSet])
    const entries = unzipSync(archive)
    const fileContents = new TextDecoder().decode(Object.values(entries)[0])
    const parsed = parseSetJson(fileContents)

    expect(Object.keys(entries)).toEqual(['sets/1-set-1.json'])
    expect(parsed).toEqual({
      ...sampleSet,
      questions: [sampleSet.questions[0]],
    })
  })

  it('reads multiple set JSON files from a ZIP archive', () => {
    const secondSet: QuizSet = {
      ...sampleSet,
      id: 'set-2',
      title: 'History',
      questions: [],
    }
    const archive = zipSync({
      'first.json': strToU8(exportSetJson(sampleSet)),
      'nested/second.JSON': strToU8(exportSetJson(secondSet)),
      'notes.txt': strToU8('Ignore non-JSON files.'),
    })

    expect(readLibraryArchive(archive).map((rawJson) => parseSetJson(rawJson).id)).toEqual([
      'set-1',
      'set-2',
    ])
  })

  it('reports unreadable archives and archives without JSON files', () => {
    expect(() => readLibraryArchive(new Uint8Array([1, 2, 3]))).toThrow(/readable ZIP archive/)
    expect(() =>
      readLibraryArchive(zipSync({ 'notes.txt': strToU8('No sets here.') })),
    ).toThrow(/does not contain any JSON set files/)
  })

  it('does not export an empty library', () => {
    expect(() => createLibraryArchive([])).toThrow(/no sets to export/i)
  })
})
