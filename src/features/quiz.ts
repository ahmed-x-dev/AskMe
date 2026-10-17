import type { Question, QuestionDifficulty, QuizSet } from '../types/quiz'

export type QuizMode = 'random' | 'mcq' | 'essay'
export type QuizQuestionType = 'all' | 'mcq' | 'essay'

export interface QuizQueueFilters {
  questionType?: QuizQuestionType
  difficulty?: QuestionDifficulty | 'all'
  limit?: number
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

/** Builds the question order for the current quiz mode without mutating the stored set. */
export function buildQuizQueue(
  set: QuizSet | null,
  mode: QuizMode = 'random',
  filters: QuizQueueFilters = {},
): Question[] {
  if (!set) {
    return []
  }

  const activeQuestions = set.questions.filter((question) => !question.deleted)
  const questionType = filters.questionType ?? (mode === 'random' ? 'all' : mode)
  const difficulty = filters.difficulty ?? 'all'
  const filteredQuestions = activeQuestions.filter(
    (question) =>
      (questionType === 'all' || question.type === questionType) &&
      (difficulty === 'all' || question.difficulty === difficulty),
  )
  const shuffledQuestions = shuffle(filteredQuestions)
  const limit =
    filters.limit === undefined || !Number.isFinite(filters.limit)
      ? shuffledQuestions.length
      : Math.max(0, Math.floor(filters.limit))

  return shuffledQuestions.slice(0, limit)
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
