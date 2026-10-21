import { db } from './db'
import { byOrder, cleanTitle, cleanUrl, newId, nextOrder } from './util'
import {
  MAX_LESSON_FILE_SIZE_BYTES,
  type Lesson,
  type LessonResource,
  type ResourceKind,
  type Topic,
} from '../../types/study'

export type LessonResourceInput =
  | { source: 'link'; title: string; kind: ResourceKind; url: string }
  | {
      source: 'file'
      title: string
      fileName: string
      mimeType: string
      size: number
      fileData: string
    }

export interface TopicLessonResourceData {
  topic: Topic
  lesson: Lesson
  resource: LessonResource
}

/** Finds one resource only within lessons owned by the requested topic. */
export async function getTopicLessonResource(
  topicId: string,
  resourceId: string,
): Promise<TopicLessonResourceData | null> {
  const topic = await db.topics.get(topicId)

  if (!topic) return null

  const lessons = await listLessons(topicId)

  for (const lesson of lessons) {
    const resource = lesson.resources.find((item) => item.id === resourceId)

    if (resource) return { topic, lesson, resource }
  }

  return null
}

/** Returns a topic's lessons in display order. */
export async function listLessons(topicId: string): Promise<Lesson[]> {
  return byOrder(await db.lessons.where('topicId').equals(topicId).toArray())
}

/** Creates an empty lesson at the end of a topic's lesson list. */
export async function addLesson(topicId: string, title: string): Promise<Lesson> {
  return db.transaction('rw', db.topics, db.lessons, async () => {
    if (!(await db.topics.get(topicId))) {
      throw new Error('Topic not found.')
    }

    const lesson: Lesson = {
      id: newId(),
      topicId,
      title: cleanTitle(title, 'Lesson title'),
      done: false,
      order: nextOrder(await db.lessons.where('topicId').equals(topicId).toArray()),
      resources: [],
    }

    await db.lessons.add(lesson)
    return lesson
  })
}

/** Changes a lesson's title. */
export async function updateLesson(id: string, title: string): Promise<void> {
  const lesson = await db.lessons.get(id)

  if (!lesson) {
    throw new Error('Lesson not found.')
  }

  await db.lessons.update(id, { title: cleanTitle(title, 'Lesson title') })
}

/** Marks a lesson complete or incomplete. */
export async function setLessonDone(id: string, done: boolean): Promise<void> {
  const updated = await db.lessons.update(id, { done })

  if (updated === 0) {
    throw new Error('Lesson not found.')
  }
}

/** Saves a new display order for a topic's lessons. */
export async function reorderLessons(orderedIds: string[]): Promise<void> {
  await db.transaction('rw', db.lessons, async () => {
    for (const [index, id] of orderedIds.entries()) {
      await db.lessons.update(id, { order: index })
    }
  })
}

function makeResource(input: LessonResourceInput, id: string): LessonResource {
  const title = cleanTitle(input.title, 'Resource title')

  if (input.source === 'link') {
    return {
      id,
      title,
      kind: input.kind,
      source: 'link',
      url: cleanUrl(input.url),
    }
  }

  if (
    !input.fileName.trim() ||
    input.fileName.length > 255 ||
    !/\.(pdf|txt|md|markdown|doc|docx)$/i.test(input.fileName) ||
    !input.mimeType.trim() ||
    input.mimeType.length > 100 ||
    !Number.isSafeInteger(input.size) ||
    input.size < 1 ||
    input.size > MAX_LESSON_FILE_SIZE_BYTES ||
    !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(input.fileData) ||
    Math.floor((input.fileData.length * 3) / 4) -
      (input.fileData.endsWith('==') ? 2 : input.fileData.endsWith('=') ? 1 : 0) !== input.size
  ) {
    throw new Error('Choose a PDF, TXT, Markdown, or Word document no larger than 20 MB.')
  }

  return {
    id,
    title,
    kind: 'docs',
    source: 'file',
    fileName: input.fileName,
    mimeType: input.mimeType,
    size: input.size,
    fileData: input.fileData,
  }
}

async function changeLessonResources(
  lessonId: string,
  change: (resources: LessonResource[]) => LessonResource[],
): Promise<void> {
  await db.transaction('rw', db.lessons, async () => {
    const lesson = await db.lessons.get(lessonId)

    if (!lesson) {
      throw new Error('Lesson not found.')
    }

    await db.lessons.update(lessonId, { resources: change(lesson.resources) })
  })
}

/** Adds a link or a locally stored document to a lesson. */
export async function addLessonResource(
  lessonId: string,
  input: LessonResourceInput,
): Promise<LessonResource> {
  const resource = makeResource(input, newId())
  await changeLessonResources(lessonId, (resources) => [...resources, resource])
  return resource
}

/** Replaces a lesson resource's details while keeping its id and position. */
export async function updateLessonResource(
  lessonId: string,
  resourceId: string,
  input: LessonResourceInput,
): Promise<void> {
  const replacement = makeResource(input, resourceId)
  await changeLessonResources(lessonId, (resources) => {
    if (!resources.some((resource) => resource.id === resourceId)) {
      throw new Error('Resource not found.')
    }

    return resources.map((resource) => resource.id === resourceId ? replacement : resource)
  })
}

/** Removes a resource from a lesson. */
export async function deleteLessonResource(lessonId: string, resourceId: string): Promise<void> {
  await changeLessonResources(lessonId, (resources) => {
    if (!resources.some((resource) => resource.id === resourceId)) {
      throw new Error('Resource not found.')
    }

    return resources.filter((resource) => resource.id !== resourceId)
  })
}

/** Deletes a lesson and its nested resources. */
export async function deleteLesson(id: string): Promise<void> {
  await db.lessons.delete(id)
}
