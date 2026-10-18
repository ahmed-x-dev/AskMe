import Dexie, { type Table } from 'dexie'

import { CURRENT_SCHEMA_VERSION } from './importExport'
import type { QuestionDifficulty, QuizSet } from '../types/quiz'

function migrateDifficulty(value: unknown): QuestionDifficulty {
  if (value === 'normal') {
    return 'medium'
  }

  if (value === 'easy' || value === 'medium' || value === 'hard') {
    return value
  }

  throw new Error(`Stored question has an unsupported difficulty: ${String(value)}.`)
}

/** IndexedDB schema for locally stored quiz sets. */
class AskMeDatabase extends Dexie {
  sets!: Table<QuizSet, string>

  constructor() {
    super('askme-local-db')

    this.version(1).stores({
      sets: '&id, title, updatedAt, deleted, schemaVersion',
    })

    this.version(2)
      .stores({
        sets: '&id, title, updatedAt, deleted, schemaVersion',
      })
      .upgrade((transaction) =>
        transaction.table('sets').toCollection().modify((set: QuizSet) => {
          set.schemaVersion = 2
          set.questions = set.questions.map((question) => ({
            ...question,
            difficulty: question.difficulty ?? 'medium',
            tags: question.tags ?? [],
          }))
        }),
      )

    this.version(3)
      .stores({
        sets: '&id, title, updatedAt, deleted, schemaVersion',
      })
      .upgrade((transaction) =>
        transaction.table('sets').toCollection().modify((set: QuizSet) => {
          set.schemaVersion = CURRENT_SCHEMA_VERSION
          set.questions = set.questions.map((question) => ({
            ...question,
            difficulty: migrateDifficulty(question.difficulty),
          }))
        }),
      )

    this.version(4)
      .stores({
        sets: '&id, title, updatedAt, deleted, schemaVersion',
      })
      .upgrade((transaction) =>
        transaction.table('sets').toCollection().modify((set: QuizSet) => {
          set.schemaVersion = CURRENT_SCHEMA_VERSION
        }),
      )
  }
}

export const db = new AskMeDatabase()

/** Opens the local database and propagates any IndexedDB errors to the caller. */
export async function openDatabase(): Promise<void> {
  await db.open()
}
