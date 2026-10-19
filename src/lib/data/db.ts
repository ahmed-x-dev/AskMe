import Dexie, { type Table } from 'dexie'

import type {
  Attempt,
  Group,
  Question,
  Resource,
  Review,
  Roadmap,
  Topic,
} from '../../types/study'

/** IndexedDB schema for the study app. A new database name keeps the old AskMe data untouched. */
class StudyDatabase extends Dexie {
  roadmaps!: Table<Roadmap, string>
  groups!: Table<Group, string>
  topics!: Table<Topic, string>
  resources!: Table<Resource, string>
  questions!: Table<Question, string>
  attempts!: Table<Attempt, string>
  reviews!: Table<Review, string>

  constructor() {
    super('askme-db')

    this.version(1).stores({
      roadmaps: '&id, order',
      groups: '&id, roadmapId',
      topics: '&id, roadmapId, groupId',
      resources: '&id, topicId',
      questions: '&id, topicId, roadmapId',
      attempts: '&id, questionId, topicId, roadmapId, at',
      reviews: '&questionId, topicId, due',
    })
  }
}

export const db = new StudyDatabase()

/** Every table, for transactions that touch the whole database. */
export function allTables() {
  return [
    db.roadmaps,
    db.groups,
    db.topics,
    db.resources,
    db.questions,
    db.attempts,
    db.reviews,
  ]
}
