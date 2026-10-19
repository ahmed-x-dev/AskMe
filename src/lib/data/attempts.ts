import { scheduleAnswer } from '../srs'
import { db } from './db'
import { newId, nowIso } from './util'
import type { Attempt } from '../../types/study'

/**
 * Saves the result of answering one question and updates its spaced-repetition schedule
 * (see `scheduleAnswer`), in one transaction.
 */
export async function recordAttempt(questionId: string, correct: boolean): Promise<Attempt> {
  return db.transaction('rw', db.questions, db.attempts, db.reviews, async () => {
    const question = await db.questions.get(questionId)

    if (!question) {
      throw new Error('Question not found.')
    }

    const attempt: Attempt = {
      id: newId(),
      questionId,
      topicId: question.topicId,
      roadmapId: question.roadmapId,
      correct,
      at: nowIso(),
    }

    await db.attempts.add(attempt)
    await db.reviews.put(
      scheduleAnswer(
        await db.reviews.get(questionId),
        { questionId, topicId: question.topicId },
        correct,
        new Date(attempt.at),
      ),
    )
    return attempt
  })
}

/** Returns the most recent result (correct or not) for each answered question of the given topics. */
export async function getLatestResults(topicIds: string[]): Promise<Map<string, boolean>> {
  const attempts = await db.attempts.where('topicId').anyOf(topicIds).toArray()
  const results = new Map<string, boolean>()

  for (const attempt of attempts.sort((a, b) => a.at.localeCompare(b.at))) {
    results.set(attempt.questionId, attempt.correct)
  }

  return results
}

/** Returns the ids of questions whose latest answer was wrong, for the mistakes-only quiz. */
export async function listMistakeQuestionIds(topicIds: string[]): Promise<string[]> {
  const results = await getLatestResults(topicIds)

  return [...results].filter(([, correct]) => !correct).map(([questionId]) => questionId)
}
