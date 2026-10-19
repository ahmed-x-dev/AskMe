import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  buildQuizQueue,
  filterQuestions,
  formatElapsedTime,
  hasPassed,
  PASS_MARK,
  shuffle,
} from '../../src/features/quiz'
import type { Question } from '../../src/types/study'

const base = { topicId: 't1', roadmapId: 'r1', tags: [], createdAt: '2026-10-11T00:00:00.000Z', updatedAt: '2026-10-11T00:00:00.000Z' }

const questions: Question[] = [
  { ...base, id: 'q-1', type: 'mcq', text: 'Red planet?', difficulty: 'medium', options: ['Venus', 'Mars', 'Jupiter', 'Mercury'], answerIndex: 1 },
  { ...base, id: 'q-2', type: 'essay', text: 'Explain photosynthesis.', difficulty: 'hard', referenceAnswer: 'Light to energy.' },
  { ...base, id: 'q-3', type: 'mcq', text: 'Easy one', difficulty: 'easy', options: ['A', 'B', 'C', 'D'], answerIndex: 0 },
]

afterEach(() => vi.restoreAllMocks())

describe('quiz features', () => {
  it('shuffles an array without changing its contents', () => {
    const original = [1, 2, 3, 4, 5]
    vi.spyOn(Math, 'random').mockReturnValue(0)

    const shuffled = shuffle(original)

    expect(shuffled).toHaveLength(original.length)
    expect([...shuffled].sort((a, b) => a - b)).toEqual(original)
    expect(original).toEqual([1, 2, 3, 4, 5])
  })

  it('keeps every question when there are no filters', () => {
    expect(buildQuizQueue(questions).map((question) => question.id).sort()).toEqual(['q-1', 'q-2', 'q-3'])
  })

  it('filters by type and difficulty before applying a limit', () => {
    expect(filterQuestions(questions, { questionType: 'mcq' }).map((question) => question.id)).toEqual(['q-1', 'q-3'])
    expect(filterQuestions(questions, { questionType: 'mcq', difficulty: 'easy' }).map((question) => question.id)).toEqual(['q-3'])
    expect(buildQuizQueue(questions, { questionType: 'mcq', limit: 1 })).toHaveLength(1)
    expect(buildQuizQueue(questions, { limit: 0 })).toEqual([])
    expect(buildQuizQueue(questions, { limit: Number.NaN })).toHaveLength(3)
  })

  it('keeps only the given ids for the mistakes-only mode', () => {
    const queue = buildQuizQueue(questions, { onlyIds: new Set(['q-2', 'missing']) })

    expect(queue.map((question) => question.id)).toEqual(['q-2'])
    expect(buildQuizQueue(questions, { onlyIds: new Set() })).toEqual([])
  })

  it('does not change the stored questions', () => {
    const before = questions.map((question) => question.id)

    buildQuizQueue(questions, { limit: 2 })

    expect(questions.map((question) => question.id)).toEqual(before)
  })

  it('passes at exactly the pass mark and never passes an empty quiz', () => {
    expect(PASS_MARK).toBe(0.8)
    expect(hasPassed(4, 5)).toBe(true)
    expect(hasPassed(3, 5)).toBe(false)
    expect(hasPassed(5, 5)).toBe(true)
    expect(hasPassed(0, 0)).toBe(false)
  })

  it('formats elapsed quiz time with hours when needed', () => {
    expect(formatElapsedTime(0)).toBe('00:00')
    expect(formatElapsedTime(65)).toBe('01:05')
    expect(formatElapsedTime(3661)).toBe('01:01:01')
    expect(formatElapsedTime(-1)).toBe('00:00')
  })
})
