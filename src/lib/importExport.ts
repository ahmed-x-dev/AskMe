import type { z } from 'zod'

import { newId } from './data/util'
import {
  progressFileSchema,
  roadmapFileImportSchema,
  type ProgressFile,
  type LegacyRoadmapFile,
  type RoadmapFile,
} from './schemas'

/** Turns a Zod error into one readable sentence, such as `topics.2.title: Too small`. */
function describeIssue(error: z.ZodError): string {
  const [issue] = error.issues
  const path = issue.path.join('.')

  return path ? `${path}: ${issue.message}` : issue.message
}

/** Parses JSON text and checks it against a schema, throwing an error a person can read. */
function parseWith<T>(text: string, schema: z.ZodType<T>, what: string): T {
  let value: unknown

  try {
    value = JSON.parse(text)
  } catch {
    throw new Error(`This is not a valid ${what} file (it is not JSON).`)
  }

  const result = schema.safeParse(value)

  if (!result.success) {
    throw new Error(`This is not a valid ${what} file. ${describeIssue(result.error)}`)
  }

  return result.data
}

/** Reads the text of a roadmap file, for example one picked in the import dialog. */
export function parseRoadmapFile(text: string): RoadmapFile {
  const parsed = parseWith(text, roadmapFileImportSchema, 'AskMe roadmap')

  if (parsed.version === 2) {
    return parsed
  }

  return migrateRoadmapFile(parsed)
}

/** Converts a version-one roadmap's topic links into one-resource lessons. */
function migrateRoadmapFile(file: LegacyRoadmapFile): RoadmapFile {
  return {
    format: 'askme-roadmap',
    version: 2,
    exportedAt: file.exportedAt,
    roadmap: file.roadmap,
    groups: file.groups,
    topics: file.topics,
    lessons: file.resources.map((resource) => ({
      id: resource.id,
      topicId: resource.topicId,
      title: resource.title,
      done: resource.done,
      order: resource.order,
      resources: [{
        id: newId(),
        title: resource.title,
        kind: resource.kind,
        source: 'link',
        url: resource.url,
      }],
    })),
    questions: file.questions,
  }
}

/** Reads the `progress.json` file inside a backup. */
export function parseProgressFile(text: string): ProgressFile {
  return parseWith(text, progressFileSchema, 'AskMe progress')
}

/** Serializes a roadmap or progress file as readable JSON. */
export function stringifyFile(file: RoadmapFile | ProgressFile): string {
  return JSON.stringify(file, null, 2)
}

/**
 * Gives every record of a roadmap file a new id, so importing never collides with data that is
 * already stored (importing the same file twice makes two copies). Links between records
 * (topic to group, question to topic, and so on) are kept. `makeId` can be replaced in tests.
 */
export function cloneWithNewIds(file: RoadmapFile, makeId: () => string = newId): RoadmapFile {
  const ids = new Map<string, string>()
  const remap = (oldId: string): string => {
    const existing = ids.get(oldId)

    if (existing) {
      return existing
    }

    const created = makeId()

    ids.set(oldId, created)
    return created
  }

  const roadmapId = remap(file.roadmap.id)

  return {
    ...file,
    roadmap: { ...file.roadmap, id: roadmapId },
    groups: file.groups.map((group) => ({ ...group, id: remap(group.id), roadmapId })),
    topics: file.topics.map((topic) => ({
      ...topic,
      id: remap(topic.id),
      roadmapId,
      groupId: topic.groupId ? remap(topic.groupId) : undefined,
    })),
    lessons: file.lessons.map((lesson) => ({
      ...lesson,
      id: remap(lesson.id),
      topicId: remap(lesson.topicId),
      resources: lesson.resources.map((resource) => ({
        ...resource,
        id: remap(resource.id),
      })),
    })),
    questions: file.questions.map((question) => ({
      ...question,
      id: remap(question.id),
      topicId: remap(question.topicId),
      roadmapId,
    })),
  }
}

/** Removes progress from a roadmap file, so shared roadmaps start fresh. */
export function stripProgress(file: RoadmapFile): RoadmapFile {
  return {
    ...file,
    topics: file.topics.map((topic) => ({ ...topic, status: 'todo' })),
    lessons: file.lessons.map((lesson) => ({ ...lesson, done: false })),
  }
}

/** Makes a safe file name from a title, for example `React Hooks!` becomes `react-hooks`. */
export function slugify(title: string): string {
  const slug = title
    .normalize('NFKD')
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()

  return slug.slice(0, 40) || 'roadmap'
}

/**
 * Checks that the parts of a backup fit together before anything is stored: no id is used twice,
 * and every attempt and review points at a question that is in the backup. Throws a readable error.
 */
export function validateBackup(roadmaps: readonly RoadmapFile[], progress: ProgressFile): void {
  const seen = new Set<string>()

  for (const file of roadmaps) {
    const ids = [
      file.roadmap.id,
      ...file.groups.map((item) => item.id),
      ...file.topics.map((item) => item.id),
      ...file.lessons.flatMap((item) => [item.id, ...item.resources.map((resource) => resource.id)]),
      ...file.questions.map((item) => item.id),
    ]

    for (const id of ids) {
      if (seen.has(id)) {
        throw new Error('The backup is damaged: the same id appears twice.')
      }

      seen.add(id)
    }
  }

  const questionIds = new Set(roadmaps.flatMap((file) => file.questions.map((item) => item.id)))

  if (progress.attempts.some((attempt) => !questionIds.has(attempt.questionId))) {
    throw new Error('The backup is damaged: an answer points at a question that is not in it.')
  }

  if (progress.reviews.some((review) => !questionIds.has(review.questionId))) {
    throw new Error('The backup is damaged: a review date points at a question that is not in it.')
  }
}
