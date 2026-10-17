import { describe, expect, it, vi } from 'vitest'

import { buildQuizQueue, formatElapsedTime, shuffle } from '../../src/features/quiz'
import type { QuizSet } from '../../src/types/quiz'

const sampleSet: QuizSet = {
  schemaVersion: 3,
  id: 'set-1',
  title: 'Practice set',
  updatedAt: '2026-10-11T00:00:00.000Z',
  deleted: false,
  questions: [
    {
      id: 'q-1',
      type: 'mcq',
      text: 'Which planet is known as the Red Planet?',
      difficulty: 'medium',
      tags: ['space', 'deprecated'],
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
      tags: ['biology'],
      referenceAnswer: 'Plants turn sunlight into chemical energy.',
      updatedAt: '2026-10-11T00:00:00.000Z',
      deleted: false,
    },
    {
      id: 'q-3',
      type: 'mcq',
      text: 'Hidden question',
      difficulty: 'medium',
      tags: [],
      options: ['A', 'B', 'C', 'D'],
      answerIndex: 0,
      updatedAt: '2026-10-11T00:00:00.000Z',
      deleted: true,
    },
  ],
}

describe('quiz features', () => {
  it('shuffles an array without changing its contents', () => {
    const original = [1, 2, 3, 4, 5]
    vi.spyOn(Math, 'random').mockReturnValue(0)

    const shuffled = shuffle(original)

    expect(shuffled).toHaveLength(original.length)
    expect([...shuffled].sort((a, b) => a - b)).toEqual([...original].sort((a, b) => a - b))
    expect(original).toEqual([1, 2, 3, 4, 5])

    vi.restoreAllMocks()
  })

  it('builds only the requested question types and ignores deleted questions', () => {
    const mcqQueue = buildQuizQueue(sampleSet, 'mcq')
    const essayQueue = buildQuizQueue(sampleSet, 'essay')
    const randomQueue = buildQuizQueue(sampleSet, 'random')

    expect(mcqQueue.every((question) => question.type === 'mcq')).toBe(true)
    expect(essayQueue.every((question) => question.type === 'essay')).toBe(true)
    expect(randomQueue).toHaveLength(2)
    expect(randomQueue.map((question) => question.id)).toEqual(expect.arrayContaining(['q-1', 'q-2']))
  })

  it('filters by type and difficulty before applying a question limit', () => {
    const selected = buildQuizQueue(sampleSet, 'random', {
      questionType: 'mcq',
      difficulty: 'medium',
      limit: 1,
    })

    expect(selected.map((question) => question.id)).toEqual(['q-1'])
    expect(buildQuizQueue(sampleSet, 'random', { difficulty: 'hard' })).toHaveLength(1)
    expect(buildQuizQueue(sampleSet, 'random', { questionType: 'essay' })).toHaveLength(1)
  })

  it('formats elapsed quiz time with hours when needed', () => {
    expect(formatElapsedTime(0)).toBe('00:00')
    expect(formatElapsedTime(65)).toBe('01:05')
    expect(formatElapsedTime(3661)).toBe('01:01:01')
    expect(formatElapsedTime(-1)).toBe('00:00')
  })
})
