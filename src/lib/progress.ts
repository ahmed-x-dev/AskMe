/**
 * Pure progress maths (no database), so it is easy to test. `lib/data/progress.ts` loads the
 * data and calls these functions.
 */

/** Local calendar day of a timestamp as `YYYY-MM-DD`. Days follow the learner's own clock. */
export function dayKey(value: string | Date): string {
  const date = typeof value === 'string' ? new Date(value) : value
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${date.getFullYear()}-${month}-${day}`
}

/** Moves a `YYYY-MM-DD` key by whole days. */
function shiftDay(key: string, days: number): string {
  const [year, month, day] = key.split('-').map(Number)

  return dayKey(new Date(year, month - 1, day + days))
}

export interface Streak {
  /** Days in a row with at least one answer, ending today (or yesterday, if today is still empty). */
  current: number
  longest: number
  /** True when the learner already answered something today. */
  studiedToday: boolean
}

/**
 * Computes the study streak from the timestamps of every answer. A streak stays alive through
 * today even when nothing has been answered yet, so opening the app in the morning does not
 * show 0: it breaks only when a whole day is missed.
 */
export function computeStreak(timestamps: readonly string[], now: Date): Streak {
  const days = new Set(timestamps.map((value) => dayKey(value)))
  const today = dayKey(now)
  const studiedToday = days.has(today)

  let current = 0
  let cursor = studiedToday ? today : shiftDay(today, -1)

  while (days.has(cursor)) {
    current += 1
    cursor = shiftDay(cursor, -1)
  }

  let longest = 0
  let run = 0
  let previous: string | null = null

  for (const day of [...days].sort()) {
    run = previous !== null && shiftDay(previous, 1) === day ? run + 1 : 1
    longest = Math.max(longest, run)
    previous = day
  }

  return { current, longest, studiedToday }
}

/** A topic the learner keeps getting wrong. */
export interface WeakTopic {
  topicId: string
  attempts: number
  correct: number
  /** Share of correct answers, from 0 to 1. */
  accuracy: number
}

/** A topic needs this many recent answers before it can be called weak (avoids one-off misses). */
export const WEAK_MIN_ATTEMPTS = 5

/** A topic is weak below this share of correct answers. */
export const WEAK_ACCURACY = 0.7

/** Returns the weakest topics first, using only topics with enough answers. */
export function findWeakTopics(
  attempts: ReadonlyArray<{ topicId: string; correct: boolean }>,
  limit = 5,
): WeakTopic[] {
  const stats = new Map<string, { attempts: number; correct: number }>()

  for (const attempt of attempts) {
    const entry = stats.get(attempt.topicId) ?? { attempts: 0, correct: 0 }

    entry.attempts += 1
    entry.correct += attempt.correct ? 1 : 0
    stats.set(attempt.topicId, entry)
  }

  return [...stats]
    .map(([topicId, entry]) => ({ topicId, ...entry, accuracy: entry.correct / entry.attempts }))
    .filter((topic) => topic.attempts >= WEAK_MIN_ATTEMPTS && topic.accuracy < WEAK_ACCURACY)
    .sort((a, b) => a.accuracy - b.accuracy || b.attempts - a.attempts)
    .slice(0, limit)
}
