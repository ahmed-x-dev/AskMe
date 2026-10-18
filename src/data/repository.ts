import { db } from './db'
import { CURRENT_SCHEMA_VERSION, exportSetJson, parseQuestionsJson, parseSetJson } from './importExport'
import type { Question, QuizSet, SetGroup } from '../types/quiz'

function nowIso(): string {
  return new Date().toISOString()
}

function sanitizeTitle(input: string): string {
  return input.trim() || 'Untitled set'
}

function sanitizeGroupName(input: string): string {
  return input.trim() || 'Untitled group'
}

async function updateGroupMemberships(
  assignments: ReadonlyMap<string, SetGroup | undefined>,
): Promise<QuizSet[]> {
  const timestamp = nowIso()

  return db.transaction('rw', db.sets, async () => {
    const activeSets = await db.sets.filter((set) => !set.deleted).toArray()
    const preliminary = activeSets.map((set) => ({
      ...set,
      group: assignments.has(set.id) ? assignments.get(set.id) : set.group,
    }))
    const memberCounts = new Map<string, number>()

    preliminary.forEach((set) => {
      if (set.group) {
        memberCounts.set(set.group.id, (memberCounts.get(set.group.id) ?? 0) + 1)
      }
    })

    const updated = preliminary.map((set) => {
      const group = set.group && (memberCounts.get(set.group.id) ?? 0) < 2 ? undefined : set.group
      const original = activeSets.find((candidate) => candidate.id === set.id)
      const groupChanged = original?.group?.id !== group?.id || original?.group?.name !== group?.name

      return groupChanged ? { ...set, group, updatedAt: timestamp } : set
    })
    const changed = updated.filter((set, index) => set !== activeSets[index])

    if (changed.length > 0) {
      await db.sets.bulkPut(changed)
    }

    return updated.filter((set) => assignments.has(set.id))
  })
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
    schemaVersion: CURRENT_SCHEMA_VERSION,
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

/** Creates one named group for at least two active sets, replacing any prior memberships. */
export async function createSetGroup(setIds: readonly string[], name: string): Promise<QuizSet[]> {
  const uniqueIds = [...new Set(setIds)]

  if (uniqueIds.length < 2) {
    throw new Error('Choose at least two sets to create a group.')
  }

  const selectedSets = await db.sets.bulkGet(uniqueIds)

  if (selectedSets.some((set) => !set || set.deleted)) {
    throw new Error('Every selected set must still be available.')
  }

  const group: SetGroup = { id: crypto.randomUUID(), name: sanitizeGroupName(name) }
  return updateGroupMemberships(new Map(uniqueIds.map((id) => [id, group])))
}

/** Renames every active member of a group; returns an empty array if it no longer exists. */
export async function renameSetGroup(groupId: string, name: string): Promise<QuizSet[]> {
  const members = await db.sets.filter((set) => !set.deleted && set.group?.id === groupId).toArray()
  const nextName = sanitizeGroupName(name)
  return updateGroupMemberships(
    new Map(members.map((set) => [set.id, { id: groupId, name: nextName }])),
  )
}

/** Removes a group while keeping every member set active and ungrouped. */
export async function removeSetGroup(groupId: string): Promise<QuizSet[]> {
  const members = await db.sets.filter((set) => !set.deleted && set.group?.id === groupId).toArray()
  return updateGroupMemberships(new Map(members.map((set) => [set.id, undefined])))
}

/** Removes one active set from its group without deleting the set. */
export async function removeSetFromGroup(setId: string): Promise<QuizSet | null> {
  const set = await getSet(setId)

  if (!set?.group) {
    return null
  }

  const updated = await updateGroupMemberships(new Map([[setId, undefined]]))
  return updated[0] ?? null
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

  return exportSetJson(set)
}

/** Validates and imports multiple sets atomically; matching IDs replace their local sets. */
export async function importSetsFromJson(
  rawJsonFiles: readonly string[],
): Promise<{ sets: QuizSet[]; updatedCount: number }> {
  if (rawJsonFiles.length === 0) {
    throw new Error('Select at least one set JSON file to import.')
  }

  const importedSets = rawJsonFiles.map(parseSetJson)
  const importedIds = new Set<string>()

  for (const set of importedSets) {
    if (importedIds.has(set.id)) {
      throw new Error(`The import contains more than one set with id "${set.id}".`)
    }

    importedIds.add(set.id)
  }

  const timestamp = nowIso()

  return db.transaction('rw', db.sets, async () => {
    const existingSets = await db.sets.bulkGet(importedSets.map((set) => set.id))
    const sets = importedSets.map(
      (set): QuizSet => ({
        ...set,
        updatedAt: timestamp,
        deleted: false,
      }),
    )

    await db.sets.bulkPut(sets)

    return {
      sets,
      updatedCount: existingSets.filter((set) => set !== undefined).length,
    }
  })
}

/** Validates a JSON export and swaps the current set record for the imported one. */
export async function importSetFromJson(rawJson: string): Promise<QuizSet | null> {
  const result = await importSetsFromJson([rawJson])
  return result.sets[0] ?? null
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
