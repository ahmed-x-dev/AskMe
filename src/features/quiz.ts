import type { Question, QuizSet } from '../types/quiz'

export type QuizMode = 'random' | 'mcq' | 'essay'

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
export function buildQuizQueue(set: QuizSet | null, mode: QuizMode = 'random'): Question[] {
  if (!set) {
    return []
  }

  const activeQuestions = set.questions.filter((question) => !question.deleted)

  const filteredQuestions =
    mode === 'random'
      ? activeQuestions
      : activeQuestions.filter((question) => question.type === mode)

  return shuffle(filteredQuestions)
}
