import { db } from './db'
import { byOrder, cleanTitle, cleanUrl, newId, nextOrder } from './util'
import type { Resource, ResourceKind } from '../../types/study'

export interface ResourceInput {
  topicId: string
  /** Optional. When empty, the link's host name is used. */
  title?: string
  url: string
  kind?: ResourceKind
}

/** Returns the resources of a topic in display order. */
export async function listResources(topicId: string): Promise<Resource[]> {
  return byOrder(await db.resources.where('topicId').equals(topicId).toArray())
}

/** Adds a link to a topic. */
export async function addResource(input: ResourceInput): Promise<Resource> {
  return db.transaction('rw', db.topics, db.resources, async () => {
    if (!(await db.topics.get(input.topicId))) {
      throw new Error('Topic not found.')
    }

    const url = cleanUrl(input.url)
    const title = input.title?.trim() ? cleanTitle(input.title, 'Link title') : new URL(url).hostname

    const resource: Resource = {
      id: newId(),
      topicId: input.topicId,
      title,
      url,
      kind: input.kind ?? 'other',
      done: false,
      order: nextOrder(await db.resources.where('topicId').equals(input.topicId).toArray()),
    }

    await db.resources.add(resource)
    return resource
  })
}

/** Edits a link's title, url or kind. */
export async function updateResource(
  id: string,
  patch: { title?: string; url?: string; kind?: ResourceKind },
): Promise<void> {
  const changes: Partial<Resource> = {}

  if (patch.title !== undefined) {
    changes.title = cleanTitle(patch.title, 'Link title')
  }

  if (patch.url !== undefined) {
    changes.url = cleanUrl(patch.url)
  }

  if (patch.kind !== undefined) {
    changes.kind = patch.kind
  }

  const updated = await db.resources.update(id, changes)

  if (updated === 0) {
    throw new Error('Link not found.')
  }
}

/** Ticks or unticks a link as read / watched. */
export async function setResourceDone(id: string, done: boolean): Promise<void> {
  await db.resources.update(id, { done })
}

/** Saves a new order for the links of one topic. */
export async function reorderResources(orderedIds: string[]): Promise<void> {
  await db.transaction('rw', db.resources, async () => {
    for (const [index, id] of orderedIds.entries()) {
      await db.resources.update(id, { order: index })
    }
  })
}

/** Removes a link. */
export async function deleteResource(id: string): Promise<void> {
  await db.resources.delete(id)
}
