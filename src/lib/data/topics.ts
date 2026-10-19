import { allTables, db } from './db'
import { applyTopicMove } from './sections'
import { byOrder, cleanTitle, newId, nextOrder, nowIso } from './util'
import type { Topic, TopicStatus, TopicTarget } from '../../types/study'

export type { TopicTarget }

export interface TopicInput {
  roadmapId: string
  /** Leave empty to add the topic to the ungrouped list. */
  groupId?: string
  title: string
}

/** Returns every topic of a roadmap, sorted by `order`. Use `buildSections` to split them by group. */
export async function listTopics(roadmapId: string): Promise<Topic[]> {
  return byOrder(await db.topics.where('roadmapId').equals(roadmapId).toArray())
}

/** Returns one topic, or undefined when it does not exist. */
export async function getTopic(id: string): Promise<Topic | undefined> {
  return db.topics.get(id)
}

/** Loads the topics of one container (a group, or the ungrouped list) in order. */
async function loadContainer(roadmapId: string, groupId: string | undefined): Promise<Topic[]> {
  const topics = await db.topics.where('roadmapId').equals(roadmapId).toArray()

  return byOrder(topics.filter((topic) => (topic.groupId ?? undefined) === groupId))
}

/** Writes consecutive `order` values (and the group) for a container, touching only what changed. */
async function renumber(topics: readonly Topic[], groupId: string | undefined): Promise<void> {
  const timestamp = nowIso()

  for (const [index, topic] of topics.entries()) {
    if (topic.order !== index || (topic.groupId ?? undefined) !== groupId) {
      await db.topics.update(topic.id, { order: index, groupId, updatedAt: timestamp })
    }
  }
}

/** Creates a topic at the end of a group (or of the ungrouped list). */
export async function createTopic(input: TopicInput): Promise<Topic> {
  return db.transaction('rw', db.roadmaps, db.groups, db.topics, async () => {
    if (!(await db.roadmaps.get(input.roadmapId))) {
      throw new Error('Roadmap not found.')
    }

    if (input.groupId) {
      const group = await db.groups.get(input.groupId)

      if (!group || group.roadmapId !== input.roadmapId) {
        throw new Error('That group is not in this roadmap.')
      }
    }

    const timestamp = nowIso()
    const topic: Topic = {
      id: newId(),
      roadmapId: input.roadmapId,
      groupId: input.groupId || undefined,
      title: cleanTitle(input.title, 'Topic name'),
      order: nextOrder(await loadContainer(input.roadmapId, input.groupId || undefined)),
      status: 'todo',
      createdAt: timestamp,
      updatedAt: timestamp,
    }

    await db.topics.add(topic)
    return topic
  })
}

/** Updates the title or notes of a topic. */
export async function updateTopic(
  id: string,
  patch: { title?: string; notes?: string },
): Promise<void> {
  const changes: Partial<Topic> = { updatedAt: nowIso() }

  if (patch.title !== undefined) {
    changes.title = cleanTitle(patch.title, 'Topic name')
  }

  if (patch.notes !== undefined) {
    changes.notes = patch.notes.trim() ? patch.notes : undefined
  }

  const updated = await db.topics.update(id, changes)

  if (updated === 0) {
    throw new Error('Topic not found.')
  }
}

/** Sets the learning status of a topic. */
export async function setTopicStatus(id: string, status: TopicStatus): Promise<void> {
  const updated = await db.topics.update(id, { status, updatedAt: nowIso() })

  if (updated === 0) {
    throw new Error('Topic not found.')
  }
}

/**
 * Moves a topic inside its roadmap: reorder within a container, or drop it into another
 * group (or the ungrouped list). Both the source and target positions are renumbered.
 */
export async function moveTopic(topicId: string, target: TopicTarget): Promise<void> {
  await db.transaction('rw', db.groups, db.topics, async () => {
    const topic = await db.topics.get(topicId)

    if (!topic) {
      throw new Error('Topic not found.')
    }

    if (target.groupId) {
      const group = await db.groups.get(target.groupId)

      if (!group || group.roadmapId !== topic.roadmapId) {
        throw new Error('That group is not in this roadmap.')
      }
    }

    const before = await db.topics.where('roadmapId').equals(topic.roadmapId).toArray()
    const previous = new Map(before.map((item) => [item.id, item]))
    const timestamp = nowIso()

    for (const next of applyTopicMove(before, topicId, target)) {
      const old = previous.get(next.id)

      if (old && (old.order !== next.order || old.groupId !== next.groupId)) {
        await db.topics.update(next.id, {
          order: next.order,
          groupId: next.groupId,
          updatedAt: timestamp,
        })
      }
    }
  })
}

/**
 * Moves a topic (with its questions and history) to another roadmap, in one transaction.
 * It lands at the end of `groupId` in the target roadmap, or at the end of the ungrouped list
 * when `groupId` is empty. To reorder inside one roadmap, use `moveTopic` instead.
 */
export async function moveTopicToRoadmap(
  topicId: string,
  roadmapId: string,
  groupId?: string | null,
): Promise<void> {
  await db.transaction(
    'rw',
    [db.roadmaps, db.groups, db.topics, db.questions, db.attempts],
    async () => {
      const topic = await db.topics.get(topicId)

      if (!topic) {
        throw new Error('Topic not found.')
      }

      if (topic.roadmapId === roadmapId) {
        return
      }

      if (!(await db.roadmaps.get(roadmapId))) {
        throw new Error('Roadmap not found.')
      }

      const targetGroupId = groupId || undefined

      if (targetGroupId) {
        const group = await db.groups.get(targetGroupId)

        if (!group || group.roadmapId !== roadmapId) {
          throw new Error('That group is not in the target roadmap.')
        }
      }

      const sourceRoadmapId = topic.roadmapId
      const sourceGroupId = topic.groupId ?? undefined
      const order = nextOrder(await loadContainer(roadmapId, targetGroupId))

      await db.topics.update(topicId, {
        roadmapId,
        groupId: targetGroupId,
        order,
        updatedAt: nowIso(),
      })
      await db.questions.where('topicId').equals(topicId).modify({ roadmapId })
      await db.attempts.where('topicId').equals(topicId).modify({ roadmapId })

      await renumber(await loadContainer(sourceRoadmapId, sourceGroupId), sourceGroupId)
    },
  )
}

/** Deletes a topic with its resources, questions, attempts and reviews. */
export async function deleteTopic(id: string): Promise<void> {
  await db.transaction('rw', allTables(), async () => {
    const topic = await db.topics.get(id)

    if (!topic) {
      return
    }

    await db.reviews.where('topicId').equals(id).delete()
    await db.attempts.where('topicId').equals(id).delete()
    await db.questions.where('topicId').equals(id).delete()
    await db.resources.where('topicId').equals(id).delete()
    await db.topics.delete(id)

    const groupId = topic.groupId ?? undefined
    await renumber(await loadContainer(topic.roadmapId, groupId), groupId)
  })
}
