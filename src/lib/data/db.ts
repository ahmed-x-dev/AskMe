import Dexie, { type Table } from 'dexie'

import type {
  Attempt,
  Group,
  Lesson,
  Question,
  Resource,
  Review,
  Roadmap,
  Topic,
} from '../../types/study'
import { newId } from './util'

/** IndexedDB schema for the study app. A new database name keeps the old AskMe data untouched. */
export class StudyDatabase extends Dexie {
  roadmaps!: Table<Roadmap, string>
  groups!: Table<Group, string>
  topics!: Table<Topic, string>
  lessons!: Table<Lesson, string>
  questions!: Table<Question, string>
  attempts!: Table<Attempt, string>
  reviews!: Table<Review, string>

  constructor(name = 'askme-db') {
    super(name)

    this.version(1).stores({
      roadmaps: '&id, order',
      groups: '&id, roadmapId',
      topics: '&id, roadmapId, groupId',
      resources: '&id, topicId',
      questions: '&id, topicId, roadmapId',
      attempts: '&id, questionId, topicId, roadmapId, at',
      reviews: '&questionId, topicId, due',
    })

    this.version(2)
      .stores({
        roadmaps: '&id, order',
        groups: '&id, roadmapId',
        topics: '&id, roadmapId, groupId',
        lessons: '&id, topicId',
        resources: null,
        questions: '&id, topicId, roadmapId',
        attempts: '&id, questionId, topicId, roadmapId, at',
        reviews: '&questionId, topicId, due',
      })
      .upgrade(async (transaction) => {
        const resources = (await transaction.table('resources').toArray()) as Resource[]
        const lessons: Lesson[] = resources.map((resource) => ({
          id: resource.id,
          topicId: resource.topicId,
          title: resource.title,
          done: resource.done,
          order: resource.order,
          resources: [
            {
              id: newId(),
              title: resource.title,
              kind: resource.kind,
              source: 'link',
              url: resource.url,
            },
          ],
        }))

        await transaction.table('lessons').bulkAdd(lessons)
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
    db.lessons,
    db.questions,
    db.attempts,
    db.reviews,
  ]
}
