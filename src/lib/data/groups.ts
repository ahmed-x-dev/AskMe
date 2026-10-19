import { db } from './db'
import { byOrder, cleanTitle, newId, nextOrder, nowIso } from './util'
import type { Group } from '../../types/study'

/** Returns the groups of a roadmap in display order. */
export async function listGroups(roadmapId: string): Promise<Group[]> {
  return byOrder(await db.groups.where('roadmapId').equals(roadmapId).toArray())
}

/** Creates an optional group at the end of a roadmap. The user chooses any name. */
export async function createGroup(roadmapId: string, title: string): Promise<Group> {
  return db.transaction('rw', db.roadmaps, db.groups, async () => {
    if (!(await db.roadmaps.get(roadmapId))) {
      throw new Error('Roadmap not found.')
    }

    const timestamp = nowIso()
    const group: Group = {
      id: newId(),
      roadmapId,
      title: cleanTitle(title, 'Group name'),
      order: nextOrder(await db.groups.where('roadmapId').equals(roadmapId).toArray()),
      createdAt: timestamp,
      updatedAt: timestamp,
    }

    await db.groups.add(group)
    return group
  })
}

/** Renames a group. */
export async function renameGroup(id: string, title: string): Promise<void> {
  const updated = await db.groups.update(id, {
    title: cleanTitle(title, 'Group name'),
    updatedAt: nowIso(),
  })

  if (updated === 0) {
    throw new Error('Group not found.')
  }
}

/** Saves a new order for the groups of one roadmap. */
export async function reorderGroups(orderedIds: string[]): Promise<void> {
  await db.transaction('rw', db.groups, async () => {
    const timestamp = nowIso()

    for (const [index, id] of orderedIds.entries()) {
      await db.groups.update(id, { order: index, updatedAt: timestamp })
    }
  })
}

/** Deletes a group. Its topics are kept and moved to the end of the ungrouped list. */
export async function deleteGroup(id: string): Promise<void> {
  await db.transaction('rw', db.groups, db.topics, async () => {
    const group = await db.groups.get(id)

    if (!group) {
      return
    }

    const roadmapTopics = await db.topics.where('roadmapId').equals(group.roadmapId).toArray()
    const members = byOrder(roadmapTopics.filter((topic) => topic.groupId === id))
    let order = nextOrder(roadmapTopics.filter((topic) => !topic.groupId))
    const timestamp = nowIso()

    for (const member of members) {
      await db.topics.update(member.id, { groupId: undefined, order, updatedAt: timestamp })
      order += 1
    }

    await db.groups.delete(id)
  })
}
