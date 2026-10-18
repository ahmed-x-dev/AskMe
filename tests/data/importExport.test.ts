import { describe, expect, it } from 'vitest'

import { CURRENT_SCHEMA_VERSION, exportSetJson, parseQuestionsJson, parseSetJson } from '../../src/data/importExport'
import type { QuizSet } from '../../src/types/quiz'

const sampleSet: QuizSet = {
  schemaVersion: CURRENT_SCHEMA_VERSION,
  id: 'set-1',
  title: 'Import export set',
  updatedAt: '2026-10-11T00:00:00.000Z',
  deleted: false,
  questions: [
    {
      id: 'q-1',
      type: 'mcq',
      text: 'Which planet is known as the Red Planet?',
      difficulty: 'easy',
      tags: ['space'],
      options: ['Venus', 'Mars', 'Jupiter', 'Mercury'],
      answerIndex: 1,
      updatedAt: '2026-10-11T00:00:00.000Z',
      deleted: false,
    },
    {
      id: 'q-2',
      type: 'essay',
      text: 'Explain photosynthesis.',
      difficulty: 'hard',
      tags: ['biology', 'deprecated'],
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

  it('migrates version 1 sets with medium difficulty and no tags', () => {
    const oldSet = {
      ...sampleSet,
      schemaVersion: 1,
      questions: sampleSet.questions.map((question) => {
        const legacyQuestion: Record<string, unknown> = { ...question }
        delete legacyQuestion.difficulty
        delete legacyQuestion.tags
        return legacyQuestion
      }),
    }

    expect(parseSetJson(JSON.stringify(oldSet))).toEqual({
      ...sampleSet,
      questions: sampleSet.questions.map((question) => ({
        ...question,
        difficulty: 'medium',
        tags: [],
      })),
    })
  })

  it('migrates version 2 normal difficulty and normalizes imported tags', () => {
    const oldSet = {
      ...sampleSet,
      schemaVersion: 2,
      questions: sampleSet.questions.map((question, index) =>
        index === 0 ? { ...question, difficulty: 'normal' } : question,
      ),
    }
    const migratedSet = parseSetJson(JSON.stringify(oldSet))

    expect(migratedSet.schemaVersion).toBe(CURRENT_SCHEMA_VERSION)
    expect(migratedSet.questions[0].difficulty).toBe('medium')

    const question = sampleSet.questions[0]
    const normalized = parseQuestionsJson(JSON.stringify({
      ...question,
      difficulty: 'normal',
      tags: [' deprecated ', '', 'deprecated', ' html '],
    }))

    expect(normalized[0].tags).toEqual(['deprecated', 'html'])
    expect(normalized[0].difficulty).toBe('medium')
    expect(() => parseQuestionsJson(JSON.stringify({ ...question, difficulty: 'trivial' })))
      .toThrowError(/unsupported difficulty/)
    expect(() => parseQuestionsJson(JSON.stringify({ ...question, tags: ['valid', 2] })))
      .toThrowError(/tags must be an array of strings/)
  })

  it('preserves valid group metadata and leaves older imports ungrouped', () => {
    const grouped = {
      ...sampleSet,
      schemaVersion: CURRENT_SCHEMA_VERSION,
      group: { id: 'science-group', name: 'Science' },
    }
    expect(parseSetJson(JSON.stringify(grouped))).toEqual(grouped)

    const oldSet = { ...sampleSet, schemaVersion: 3 }
    expect(parseSetJson(JSON.stringify(oldSet))).toEqual({
      ...sampleSet,
      schemaVersion: CURRENT_SCHEMA_VERSION,
    })
    expect(() => parseSetJson(JSON.stringify({ ...grouped, group: { id: '', name: 'Science' } })))
      .toThrowError(/group must have a valid id and name/)
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
