import type { Question, QuestionDifficulty } from '@/types/study'

export type QuizQuestionType = 'all' | 'mcq' | 'essay'

export interface QuizQueueFilters {
  questionType?: QuizQuestionType
  difficulty?: QuestionDifficulty | 'all'
  /** When set, only these question ids are kept (used by the mistakes-only mode). */
  onlyIds?: ReadonlySet<string>
  /** Keeps at most this many questions, after shuffling. */
  limit?: number
}

/** A quiz counts as passed at this share of correct answers (80%). */
export const PASS_MARK = 0.8

/** Returns true when `correct` out of `total` reaches the pass mark. An empty quiz never passes. */
export function hasPassed(correct: number, total: number): boolean {
  return total > 0 && correct / total >= PASS_MARK
}

/** Returns a shuffled copy of the items; this is the standard Fisher-Yates algorithm. */
export function shuffle<T>(items: T[]): T[] {
  const copy = [...items]

  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1))
    ;[copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]]
  }

  return copy
}

/** Keeps the questions that match the filters, in their original order. The limit is not applied. */
export function filterQuestions(questions: Question[], filters: QuizQueueFilters = {}): Question[] {
  const questionType = filters.questionType ?? 'all'
  const difficulty = filters.difficulty ?? 'all'

  return questions.filter(
    (question) =>
      (questionType === 'all' || question.type === questionType) &&
      (difficulty === 'all' || question.difficulty === difficulty) &&
      (filters.onlyIds === undefined || filters.onlyIds.has(question.id)),
  )
}

/** Builds the question order for a quiz without changing the stored questions. */
export function buildQuizQueue(questions: Question[], filters: QuizQueueFilters = {}): Question[] {
  const shuffled = shuffle(filterQuestions(questions, filters))
  const limit =
    filters.limit === undefined || !Number.isFinite(filters.limit)
      ? shuffled.length
      : Math.max(0, Math.floor(filters.limit))

  return shuffled.slice(0, limit)
}

/** Formats elapsed quiz time as minutes and seconds, adding hours when needed. */
export function formatElapsedTime(totalSeconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds))
  const hours = Math.floor(safeSeconds / 3600)
  const minutes = Math.floor((safeSeconds % 3600) / 60)
  const seconds = safeSeconds % 60

  return hours > 0
    ? `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
    : `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}
