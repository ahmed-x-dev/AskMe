/** Discriminator for the supported question variants. */
export type QuestionType = 'mcq' | 'essay'

/** Difficulty label saved with each question. */
export type QuestionDifficulty = 'easy' | 'medium' | 'hard'

/** Union of all question records stored in a quiz set. */
export type Question = McqQuestion | EssayQuestion

/** Fields shared by question records; timestamps are ISO 8601 UTC strings. */
export interface BaseQuestion {
  id: string
  type: QuestionType
  text: string
  difficulty: QuestionDifficulty
  tags: string[]
  updatedAt: string
  deleted: boolean
}

/** A four-option multiple-choice question; `answerIndex` is zero-based. */
export interface McqQuestion extends BaseQuestion {
  type: 'mcq'
  options: [string, string, string, string]
  answerIndex: number
}

/** An essay question with an optional reference answer for later grading. */
export interface EssayQuestion extends BaseQuestion {
  type: 'essay'
  referenceAnswer?: string
}

/** A set's portable data record; `schemaVersion` versions this JSON format. */
export interface QuizSet {
  schemaVersion: number
  id: string
  title: string
  updatedAt: string
  deleted: boolean
  questions: Question[]
}
