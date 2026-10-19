import type { Review } from '../types/study'

/** Ease a brand-new card starts with (the SM-2 default). */
export const DEFAULT_EASE = 2.5

/** Ease never drops below this, so a hard card is still shown again eventually. */
export const MIN_EASE = 1.3

/** SM-2 quality for a right answer ("good") and for a wrong answer ("again"). */
const QUALITY_CORRECT = 4
const QUALITY_WRONG = 1

/** How much ease a lapse (a wrong answer) costs. */
const LAPSE_EASE_PENALTY = 0.2

/** Start of the local calendar day containing `date`. */
export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

/** Adds whole calendar days in local time (safe across daylight saving changes). */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date)

  result.setDate(result.getDate() + days)
  return result
}

/**
 * One SM-2 step for a given quality (0 to 5). Quality 3 or more is a pass; below 3 is a lapse.
 *
 * - Pass: the interval grows 1 day, then 6 days, then `interval * ease`. Ease moves with the
 *   SM-2 formula (quality 4 keeps it the same, 5 raises it, 3 lowers it).
 * - Lapse: the interval goes back to 1 day, `lapses` goes up and ease drops by 0.2 (the Anki
 *   style penalty, because plain SM-2 leaves ease alone and a leech never gets easier to spot).
 *
 * `interval` is 0 for a card that has never been scheduled; `1` after a lapse also gives 6 next,
 * which matches SM-2's "second repetition".
 */
export function applyQuality(
  review: Pick<Review, 'ease' | 'interval' | 'lapses'>,
  quality: number,
  now: Date,
): Pick<Review, 'ease' | 'interval' | 'lapses' | 'due'> {
  const q = Math.min(5, Math.max(0, quality))
  let { ease, interval, lapses } = review

  if (q < 3) {
    lapses += 1
    interval = 1
    ease = Math.max(MIN_EASE, ease - LAPSE_EASE_PENALTY)
  } else {
    interval = interval <= 0 ? 1 : interval === 1 ? 6 : Math.round(interval * ease)
    ease = Math.max(MIN_EASE, ease + 0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
  }

  // Due from the start of that local day, so "due today" is simply `due <= now`.
  const due = addDays(startOfDay(now), interval).toISOString()

  return { ease: Number(ease.toFixed(2)), interval, lapses, due }
}

/** True when a review is due now or overdue. */
export function isDue(review: Pick<Review, 'due'>, now: Date): boolean {
  return review.due <= now.toISOString()
}

/**
 * Computes the review state after the learner answers a question (in a quiz or in the review).
 *
 * - First answer ever: the card enters the schedule.
 * - A right answer on a card that is NOT due yet leaves the schedule alone, so repeating a quiz
 *   the same day cannot inflate the interval.
 * - A wrong answer always counts, due or not.
 */
export function scheduleAnswer(
  previous: Review | undefined,
  base: Pick<Review, 'questionId' | 'topicId'>,
  correct: boolean,
  now: Date,
): Review {
  if (previous && correct && !isDue(previous, now)) {
    return previous
  }

  const start = previous ?? { ease: DEFAULT_EASE, interval: 0, lapses: 0 }
  const next = applyQuality(start, correct ? QUALITY_CORRECT : QUALITY_WRONG, now)

  return { questionId: base.questionId, topicId: base.topicId, ...next }
}
