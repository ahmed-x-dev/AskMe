export type QuestionType = 'mcq' | 'essay'

export type Question = McqQuestion | EssayQuestion

export interface BaseQuestion {
  id: string
  type: QuestionType
  text: string
  updatedAt: string
  deleted: boolean
}

export interface McqQuestion extends BaseQuestion {
  type: 'mcq'
  options: [string, string, string, string]
  answerIndex: number
}

export interface EssayQuestion extends BaseQuestion {
  type: 'essay'
  referenceAnswer?: string
}

export interface QuizSet {
  schemaVersion: number
  id: string
  title: string
  updatedAt: string
  deleted: boolean
  questions: Question[]
}
