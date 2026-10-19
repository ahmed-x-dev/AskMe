import { describe, expect, it } from 'vitest'

import { applyQuality, DEFAULT_EASE, isDue, MIN_EASE, scheduleAnswer, startOfDay } from '../src/lib/srs'
import type { Review } from '../src/types/study'

const now = new Date(2026, 9, 19, 15, 30) // 19 Oct 2026, 15:30 local
const base = { questionId: 'q1', topicId: 't1' }
const fresh = { ease: DEFAULT_EASE, interval: 0, lapses: 0 }

describe('applyQuality (SM-2)', () => {
  it('grows the interval 1 day, 6 days, then interval x ease', () => {
    const first = applyQuality(fresh, 4, now)
    expect(first.interval).toBe(1)
    const second = applyQuality(first, 4, now)
    expect(second.interval).toBe(6)
    const third = applyQuality(second, 4, now)
    expect(third.interval).toBe(15) // round(6 * 2.5)
  })

  it('moves ease with the SM-2 formula', () => {
    expect(applyQuality(fresh, 4, now).ease).toBe(2.5) // quality 4 keeps it
    expect(applyQuality(fresh, 5, now).ease).toBe(2.6)
    expect(applyQuality(fresh, 3, now).ease).toBe(2.36)
  })

  it('a lapse resets the interval, counts the lapse and lowers ease, but not below the minimum', () => {
    const lapsed = applyQuality({ ease: 2.5, interval: 30, lapses: 0 }, 1, now)
    expect(lapsed).toMatchObject({ interval: 1, lapses: 1, ease: 2.3 })
    expect(applyQuality({ ease: 1.4, interval: 9, lapses: 3 }, 1, now).ease).toBe(MIN_EASE)
  })

  it('due is the start of the local day, interval days ahead', () => {
    const { due } = applyQuality(fresh, 4, now)
    expect(due).toBe(new Date(2026, 9, 20).toISOString())
    expect(isDue({ due }, now)).toBe(false)
    expect(isDue({ due }, new Date(2026, 9, 20, 0, 0, 1))).toBe(true)
  })

  it('works across a month end', () => {
    const { due } = applyQuality({ ease: 2.5, interval: 6, lapses: 0 }, 4, new Date(2026, 9, 28, 9))
    expect(due).toBe(new Date(2026, 10, 12).toISOString()) // 28 Oct + 15 days
  })
})

describe('scheduleAnswer', () => {
  it('first answer enters the schedule: right = due tomorrow, wrong = due tomorrow with a lapse', () => {
    expect(scheduleAnswer(undefined, base, true, now)).toMatchObject({ ...base, interval: 1, lapses: 0 })
    expect(scheduleAnswer(undefined, base, false, now)).toMatchObject({ ...base, interval: 1, lapses: 1 })
  })

  it('a right answer on a card that is not due leaves it unchanged', () => {
    const notDue: Review = { ...base, ease: 2.5, interval: 6, due: new Date(2026, 9, 24).toISOString(), lapses: 0 }
    expect(scheduleAnswer(notDue, base, true, now)).toBe(notDue)
  })

  it('a wrong answer on a card that is not due still reschedules it', () => {
    const notDue: Review = { ...base, ease: 2.5, interval: 6, due: new Date(2026, 9, 24).toISOString(), lapses: 0 }
    expect(scheduleAnswer(notDue, base, false, now)).toMatchObject({ interval: 1, lapses: 1, ease: 2.3 })
  })

  it('a right answer on a due card moves it forward', () => {
    const due: Review = { ...base, ease: 2.5, interval: 1, due: startOfDay(now).toISOString(), lapses: 0 }
    expect(scheduleAnswer(due, base, true, now)).toMatchObject({ interval: 6 })
  })
})
