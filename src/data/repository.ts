import { db } from './db'
import { parseQuestionsJson, parseSetJson } from './importExport'
import type { Question, QuizSet } from '../types/quiz'

const SCHEMA_VERSION = 1

function nowIso(): string {
  return new Date().toISOString()
}

function sanitizeTitle(input: string): string {
  return input.trim() || 'Untitled set'
}

/** Lists non-deleted sets, most recently updated first. */
export async function listSets(): Promise<QuizSet[]> {
  return db.sets
    .orderBy('updatedAt')
    .reverse()
    .filter((set) => !set.deleted)
    .toArray()
}

/** Alias for `listSets`, retained as a convenient repository API name. */
export const getSets = listSets

/** Returns an active set, or `null` when it does not exist or is soft-deleted. */
export async function getSet(id: string): Promise<QuizSet | null> {
  const set = await db.sets.get(id)
  return set && !set.deleted ? set : null
}

/** Creates an empty set with a generated UUID and the current schema version. */
export async function createSet(title: string): Promise<QuizSet> {
  const now = nowIso()
  const set: QuizSet = {
    schemaVersion: SCHEMA_VERSION,
    id: crypto.randomUUID(),
    title: sanitizeTitle(title),
    updatedAt: now,
    deleted: false,
    questions: [],
  }

  await db.sets.put(set)
  return set
}

/** Renames an active set; returns `null` if the set is missing or deleted. */
export async function updateSetTitle(id: string, title: string): Promise<QuizSet | null> {
  const set = await getSet(id)

  if (!set) {
    return null
  }

  const updated: QuizSet = {
    ...set,
    title: sanitizeTitle(title),
    updatedAt: nowIso(),
  }

  await db.sets.put(updated)
  return updated
}

/** Marks an active set deleted without removing it from storage. */
export async function softDeleteSet(id: string): Promise<QuizSet | null> {
  const set = await getSet(id)

  if (!set) {
    return null
  }

  const updated: QuizSet = {
    ...set,
    deleted: true,
    updatedAt: nowIso(),
  }

  await db.sets.put(updated)
  return updated
}

/** Replaces the entire set record after it is validated and normalized. */
export async function replaceSet(nextSet: QuizSet): Promise<QuizSet> {
  const normalized: QuizSet = {
    ...nextSet,
    id: nextSet.id.trim() || crypto.randomUUID(),
    title: sanitizeTitle(nextSet.title),
    updatedAt: nextSet.updatedAt || nowIso(),
    deleted: Boolean(nextSet.deleted),
    questions: nextSet.questions.map((question) => ({
      ...question,
      deleted: Boolean(question.deleted),
      updatedAt: question.updatedAt || nowIso(),
    })),
  }

  await db.sets.put(normalized)
  return normalized
}

/** Exports a set as a JSON string in the app's portable schema. */
export async function exportSetAsJson(setId: string): Promise<string | null> {
  const set = await getSet(setId)

  if (!set) {
    return null
  }

  return JSON.stringify(
    {
      ...set,
      questions: set.questions.filter((question) => !question.deleted),
    },
    null,
    2,
  )
}

/** Validates a JSON export and swaps the current set record for the imported one. */
export async function importSetFromJson(rawJson: string): Promise<QuizSet | null> {
  const importedSet = parseSetJson(rawJson)
  const existingSet = await getSet(importedSet.id)

  const nextSet: QuizSet = {
    ...importedSet,
    id: existingSet?.id ?? importedSet.id,
    updatedAt: nowIso(),
    deleted: false,
  }

  await db.sets.put(nextSet)
  return nextSet
}

/** Adds validated questions from JSON to an active set without importing set metadata. */
export async function importQuestionsFromJson(
  setId: string,
  rawJson: string,
): Promise<QuizSet | null> {
  const importedQuestions = parseQuestionsJson(rawJson)
  const set = await getSet(setId)

  if (!set) {
    return null
  }

  const timestamp = nowIso()
  const nextQuestions: Question[] = importedQuestions.map((question) => ({
    ...question,
    id: crypto.randomUUID(),
    updatedAt: timestamp,
    deleted: false,
  }))

  const updated: QuizSet = {
    ...set,
    questions: [...set.questions, ...nextQuestions],
    updatedAt: timestamp,
  }

  await db.sets.put(updated)
  return updated
}

/** Adds a question to an active set and refreshes its record timestamps. */
export async function addQuestion(setId: string, question: Question): Promise<QuizSet | null> {
  const set = await getSet(setId)

  if (!set) {
    return null
  }

  const updatedQuestion: Question = {
    ...question,
    id: question.id || crypto.randomUUID(),
    deleted: false,
    updatedAt: nowIso(),
  }

  const updated: QuizSet = {
    ...set,
    questions: [...set.questions, updatedQuestion],
    updatedAt: nowIso(),
  }

  await db.sets.put(updated)
  return updated
}

/** Replaces a question while preserving its ID; returns `null` if either record is missing. */
export async function updateQuestion(
  setId: string,
  questionId: string,
  nextQuestion: Question,
): Promise<QuizSet | null> {
  const set = await getSet(setId)

  if (!set) {
    return null
  }

  const foundQuestion = set.questions.some((question) => question.id === questionId)

  if (!foundQuestion) {
    return null
  }

  const updated: QuizSet = {
    ...set,
    questions: set.questions.map((question) =>
      question.id === questionId
        ? {
            ...nextQuestion,
            id: questionId,
            deleted: false,
            updatedAt: nowIso(),
          }
        : question,
    ),
    updatedAt: nowIso(),
  }

  await db.sets.put(updated)
  return updated
}

/** Marks a question deleted without removing it; returns `null` if it cannot be found. */
export async function softDeleteQuestion(setId: string, questionId: string): Promise<QuizSet | null> {
  const set = await getSet(setId)

  if (!set) {
    return null
  }

  const questionExists = set.questions.some((question) => question.id === questionId)

  if (!questionExists) {
    return null
  }

  const updated: QuizSet = {
    ...set,
    questions: set.questions.map((question) =>
      question.id === questionId
        ? {
            ...question,
            deleted: true,
            updatedAt: nowIso(),
          }
        : question,
    ),
    updatedAt: nowIso(),
  }

  await db.sets.put(updated)
  return updated
}
