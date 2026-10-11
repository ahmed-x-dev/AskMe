import { describe, expect, it } from 'vitest'

import { exportSetJson, parseQuestionsJson, parseSetJson } from '../../src/data/importExport'
import type { QuizSet } from '../../src/types/quiz'

const sampleSet: QuizSet = {
  schemaVersion: 1,
  id: 'set-1',
  title: 'Import export set',
  updatedAt: '2026-10-11T00:00:00.000Z',
  deleted: false,
  questions: [
    {
      id: 'q-1',
      type: 'mcq',
      text: 'Which planet is known as the Red Planet?',
      options: ['Venus', 'Mars', 'Jupiter', 'Mercury'],
      answerIndex: 1,
      updatedAt: '2026-10-11T00:00:00.000Z',
      deleted: false,
    },
    {
      id: 'q-2',
      type: 'essay',
      text: 'Explain photosynthesis.',
      referenceAnswer: 'Plants turn sunlight into chemical energy.',
      updatedAt: '2026-10-11T00:00:00.000Z',
      deleted: false,
    },
  ],
}

describe('import/export helpers', () => {
  it('round-trips a valid set through JSON export and parse', () => {
    const rawJson = exportSetJson(sampleSet)
    const parsed = parseSetJson(rawJson)

    expect(parsed).toEqual(sampleSet)
  })

  it('rejects unsupported schema versions', () => {
    const invalidJson = JSON.stringify({
      schemaVersion: 99,
      id: 'set-1',
      title: 'Broken set',
      updatedAt: '2026-10-11T00:00:00.000Z',
      deleted: false,
      questions: [],
    })

    expect(() => parseSetJson(invalidJson)).toThrowError(/Unsupported schema version/)
  })

  it('parses one Question object and arrays using the Question shape', () => {
    expect(parseQuestionsJson(JSON.stringify(sampleSet.questions[0]))).toEqual([
      sampleSet.questions[0],
    ])
    expect(parseQuestionsJson(JSON.stringify(sampleSet.questions))).toEqual(sampleSet.questions)
  })

  it('extracts questions from a set export without treating it as an import of that set', () => {
    expect(parseQuestionsJson(exportSetJson(sampleSet))).toEqual(sampleSet.questions)
  })

  it('rejects invalid and empty question imports', () => {
    expect(() =>
      parseQuestionsJson(
        '{"id":"bad-question","type":"unsupported","text":"Bad","updatedAt":"2026-10-12T00:00:00.000Z"}',
      ),
    ).toThrowError(/unsupported type/)
    expect(() => parseQuestionsJson('[]')).toThrowError(/active questions/)
  })
})
