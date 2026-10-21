import { allTables, db } from './db'
import { cleanTitle, newId, nextOrder, nowIso } from './util'
import type { Roadmap } from '../../types/study'

export interface RoadmapInput {
  title: string
  icon?: string
  color?: string
}

/** Returns all roadmaps in display order. */
export async function listRoadmaps(): Promise<Roadmap[]> {
  return db.roadmaps.orderBy('order').toArray()
}

/** Returns one roadmap, or undefined when it does not exist. */
export async function getRoadmap(id: string): Promise<Roadmap | undefined> {
  return db.roadmaps.get(id)
}

/** Creates a roadmap at the end of the grid. */
export async function createRoadmap(input: RoadmapInput): Promise<Roadmap> {
  return db.transaction('rw', db.roadmaps, async () => {
    const timestamp = nowIso()
    const roadmap: Roadmap = {
      id: newId(),
      title: cleanTitle(input.title, 'Roadmap name'),
      icon: input.icon?.trim() || undefined,
      color: input.color?.trim() || undefined,
      order: nextOrder(await db.roadmaps.toArray()),
      createdAt: timestamp,
      updatedAt: timestamp,
    }

    await db.roadmaps.add(roadmap)
    return roadmap
  })
}

/** Updates the title, icon or color of a roadmap. Pass an empty string to clear icon or color. */
export async function updateRoadmap(id: string, patch: Partial<RoadmapInput>): Promise<void> {
  const changes: Partial<Roadmap> = { updatedAt: nowIso() }

  if (patch.title !== undefined) {
    changes.title = cleanTitle(patch.title, 'Roadmap name')
  }

  if (patch.icon !== undefined) {
    changes.icon = patch.icon.trim() || undefined
  }

  if (patch.color !== undefined) {
    changes.color = patch.color.trim() || undefined
  }

  const updated = await db.roadmaps.update(id, changes)

  if (updated === 0) {
    throw new Error('Roadmap not found.')
  }
}

/** Saves a new card order for the home grid. */
export async function reorderRoadmaps(orderedIds: string[]): Promise<void> {
  await db.transaction('rw', db.roadmaps, async () => {
    const timestamp = nowIso()

    for (const [index, id] of orderedIds.entries()) {
      await db.roadmaps.update(id, { order: index, updatedAt: timestamp })
    }
  })
}

/** Deletes a roadmap together with everything inside it. */
export async function deleteRoadmap(id: string): Promise<void> {
  await db.transaction('rw', allTables(), async () => {
    const topicIds = await db.topics.where('roadmapId').equals(id).primaryKeys()

    await db.reviews.where('topicId').anyOf(topicIds).delete()
    await db.lessons.where('topicId').anyOf(topicIds).delete()
    await db.attempts.where('roadmapId').equals(id).delete()
    await db.questions.where('roadmapId').equals(id).delete()
    await db.topics.where('roadmapId').equals(id).delete()
    await db.groups.where('roadmapId').equals(id).delete()
    await db.roadmaps.delete(id)
  })
}
