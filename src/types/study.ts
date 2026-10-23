/** Discriminator for the supported question variants. */
export type QuestionType = 'mcq' | 'essay' | 'true-false' | 'fill-blank' | 'flashcard'

/** Difficulty label saved with each question. */
export type QuestionDifficulty = 'easy' | 'medium' | 'hard'

/** Learning progress of one topic. `known` means "already learned, skip it". */
export type TopicStatus = 'todo' | 'active' | 'done' | 'known'

/** Kind of learning material attached to a lesson. */
export type ResourceKind = 'docs' | 'video' | 'article' | 'other'

/** Uploaded lesson documents are kept in the browser's local database and capped at 20 MB. */
export const MAX_LESSON_FILE_SIZE_BYTES = 20 * 1024 * 1024

/** Timestamps are ISO 8601 UTC strings, so they sort correctly as IndexedDB keys. */
interface Timestamps {
  createdAt: string
  updatedAt: string
}

/** A subject the user studies, such as React or English. Shown as a card on the home grid. */
export interface Roadmap extends Timestamps {
  id: string
  title: string
  icon?: string
  color?: string
  order: number
}

/** An optional, user-named section inside one roadmap. */
export interface Group extends Timestamps {
  id: string
  roadmapId: string
  title: string
  order: number
}

/**
 * One lesson in a roadmap. `order` is the position inside its container:
 * the group when `groupId` is set, otherwise the roadmap's ungrouped list.
 */
export interface Topic extends Timestamps {
  id: string
  roadmapId: string
  groupId?: string
  title: string
  order: number
  status: TopicStatus
  notes?: string
}

/** Where a topic should land: a group (or `null` for ungrouped) and a zero-based position. */
export interface TopicTarget {
  groupId: string | null
  index: number
}

/** A lesson groups learning materials and has its own completion state. */
export interface Lesson {
  id: string
  topicId: string
  title: string
  done: boolean
  order: number
  resources: LessonResource[]
}

/** A link or locally stored document attached to a lesson. */
export type LessonResource =
  | {
      id: string
      title: string
      kind: ResourceKind
      source: 'link'
      url: string
    }
  | {
      id: string
      title: string
      kind: 'docs'
      source: 'file'
      fileName: string
      mimeType: string
      size: number
      fileData: string
    }

/** Legacy topic link record, read only while migrating existing databases and roadmap files. */
export interface Resource {
  id: string
  topicId: string
  title: string
  url: string
  kind: ResourceKind
  done: boolean
  order: number
}

/** Fields shared by question records. `roadmapId` is stored so a roadmap quiz is one query. */
export interface BaseQuestion extends Timestamps {
  id: string
  topicId: string
  lessonId?: string
  roadmapId: string
  type: QuestionType
  text: string
  difficulty: QuestionDifficulty
  tags: string[]
}

/** A four-option multiple-choice question; `answerIndex` is zero-based. */
export interface McqQuestion extends BaseQuestion {
  type: 'mcq'
  options: [string, string, string, string]
  answerIndex: number
}

/** An essay question with an optional reference answer for grading. */
export interface EssayQuestion extends BaseQuestion {
  type: 'essay'
  referenceAnswer?: string
}

/** A true/false question, where the stored answer is the correct boolean. */
export interface TrueFalseQuestion extends BaseQuestion {
  type: 'true-false'
  answer: boolean
}

/** A short-answer fill-in-the-blank question with one expected answer. */
export interface FillBlankQuestion extends BaseQuestion {
  type: 'fill-blank'
  answer: string
}

/** A flashcard prompt and one correct back side. */
export interface FlashcardQuestion extends BaseQuestion {
  type: 'flashcard'
  answer: string
}

/** Union of all stored question records. */
export type Question = McqQuestion | EssayQuestion | TrueFalseQuestion | FillBlankQuestion | FlashcardQuestion

/** One answered question, saved so mistakes and progress can be computed. */
export interface Attempt {
  id: string
  questionId: string
  topicId: string
  roadmapId: string
  correct: boolean
  at: string
}

/** Spaced-repetition state of one question (used from the review step on). */
export interface Review {
  questionId: string
  topicId: string
  ease: number
  interval: number
  due: string
  lapses: number
}
