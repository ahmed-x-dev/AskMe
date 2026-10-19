import { describe, expect, it } from 'vitest'

import { computeStreak, dayKey, findWeakTopics } from '../src/lib/progress'

const at = (month: number, day: number, hour = 12) => new Date(2026, month - 1, day, hour).toISOString()
const now = new Date(2026, 9, 19, 18) // 19 Oct 2026

describe('dayKey', () => {
  it('uses the local calendar day', () => {
    expect(dayKey(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05')
    expect(dayKey(at(10, 9))).toBe('2026-10-09')
  })
})

describe('computeStreak', () => {
  it('is 0 with no answers', () => {
    expect(computeStreak([], now)).toEqual({ current: 0, longest: 0, studiedToday: false })
  })

  it('counts consecutive days ending today', () => {
    const result = computeStreak([at(10, 17), at(10, 18, 8), at(10, 18, 20), at(10, 19)], now)
    expect(result).toEqual({ current: 3, longest: 3, studiedToday: true })
  })

  it('stays alive through today when yesterday was studied', () => {
    expect(computeStreak([at(10, 17), at(10, 18)], now)).toMatchObject({ current: 2, studiedToday: false })
  })

  it('breaks after a missed day, and remembers the longest run', () => {
    const result = computeStreak([at(10, 10), at(10, 11), at(10, 12), at(10, 13), at(10, 17)], now)
    expect(result).toMatchObject({ current: 0, longest: 4 })
  })

  it('crosses month boundaries', () => {
    const result = computeStreak([at(9, 30), at(10, 1), at(10, 2)], new Date(2026, 9, 2, 9))
    expect(result.current).toBe(3)
  })
})

describe('findWeakTopics', () => {
  const answers = (topicId: string, right: number, wrong: number) => [
    ...Array.from({ length: right }, () => ({ topicId, correct: true })),
    ...Array.from({ length: wrong }, () => ({ topicId, correct: false })),
  ]

  it('needs enough answers and low accuracy, weakest first', () => {
    const weak = findWeakTopics([
      ...answers('few', 0, 3), // too few answers
      ...answers('strong', 9, 1), // 90%
      ...answers('bad', 1, 5), // 17%
      ...answers('meh', 3, 3), // 50%
      ...answers('edge', 7, 3), // exactly 70% is not weak
    ])
    expect(weak.map((topic) => topic.topicId)).toEqual(['bad', 'meh'])
    expect(weak[0]).toMatchObject({ attempts: 6, correct: 1 })
  })

  it('respects the limit', () => {
    const many = ['a', 'b', 'c'].flatMap((id) => answers(id, 0, 6))
    expect(findWeakTopics(many, 2)).toHaveLength(2)
  })
})
