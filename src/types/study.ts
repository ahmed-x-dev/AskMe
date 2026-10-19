/** Discriminator for the supported question variants. */
export type QuestionType = 'mcq' | 'essay'

/** Difficulty label saved with each question. */
export type QuestionDifficulty = 'easy' | 'medium' | 'hard'

/** Learning progress of one topic. `known` means "already learned, skip it". */
export type TopicStatus = 'todo' | 'active' | 'done' | 'known'

/** Kind of external learning resource attached to a topic. */
export type ResourceKind = 'docs' | 'video' | 'article' | 'other'

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

/** An external link or reference used to learn a topic. */
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

/** Union of all stored question records. */
export type Question = McqQuestion | EssayQuestion

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
